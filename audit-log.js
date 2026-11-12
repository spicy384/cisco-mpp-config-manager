const path = require("path");

const { readJsonFile, writeJsonFile } = require("./json-store");

/**
 * A record of who did what to the app itself: sign-ins, account and role changes,
 * server profiles, connections, keys. Changes to phone configs are in the change
 * log; this covers everything around them.
 *
 * Entries are appended to <dataDir>/audit-log.json, oldest dropped beyond `keep`.
 * There is deliberately no way to clear it from the app.
 */

const DEFAULT_KEEP = 5000;
const MAX_FIELD = 300;
// A rule may ask for more room than MAX_FIELD for its detail (a command someone saved
// must be readable in full), but never for more than this.
const MAX_DETAIL = 1200;
// How many "already recorded this minute" keys are remembered before the oldest go.
const MAX_COALESCE_KEYS = 5000;

function clip(value, max = MAX_FIELD) {
  const text = String(value == null ? "" : value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

/** The path a rule is matched against: trailing slashes do not make it a different route. */
function auditPath(requestPath) {
  return String(requestPath || "").replace(/\/+$/, "") || "/";
}

function createAuditLog({ dataDir, keep = DEFAULT_KEEP, now = Date.now }) {
  const file = path.join(dataDir, "audit-log.json");
  const limit = Number.isInteger(keep) && keep > 0 ? keep : DEFAULT_KEEP;

  // Written atomically and read strictly (json-store.js): a log that cannot be parsed
  // is an error to be fixed, not an empty log that the next entry would overwrite.
  function load() {
    const parsed = readJsonFile(file, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  /** Never throws: failing to write the audit log must not break the action itself. */
  function record({ user = "", action, target = "", detail = "", ok = true, ip = "", detailLimit = MAX_FIELD }) {
    const room = Math.max(MAX_FIELD, Math.min(Number(detailLimit) || MAX_FIELD, MAX_DETAIL));
    const entry = {
      ts: now(),
      user: clip(user, 64),
      action: clip(action, 64),
      target: clip(target),
      detail: clip(detail, room),
      ok: Boolean(ok),
      ip: clip(ip, 64)
    };

    try {
      const entries = [...load(), entry].slice(-limit);
      writeJsonFile(file, entries);
    } catch (error) {
      console.error(`Audit log could not be written: ${error.message}`);
    }
    return entry;
  }

  /** Newest first. Throws when the file exists but cannot be read. */
  function list({ limit: max = 500 } = {}) {
    const n = Math.max(1, Math.min(Number(max) || 500, limit));
    return load().slice(-n).reverse();
  }

  // Failures already recorded recently, so someone hammering one account from one
  // address adds a line a minute rather than a line a request and cannot push every
  // other event out of the log. Insertion-ordered, so the oldest keys are dropped first.
  const recentFailures = new Map();

  function alreadyRecorded(key, windowMs) {
    const at = now();
    const last = recentFailures.get(key);
    if (last !== undefined && at - last < windowMs) {
      return true;
    }
    recentFailures.delete(key);
    recentFailures.set(key, at);
    while (recentFailures.size > MAX_COALESCE_KEYS) {
      recentFailures.delete(recentFailures.keys().next().value);
    }
    return false;
  }

  /**
   * Express middleware that records requests matching a rule once they finish:
   *
   *   { method, path: RegExp, action, prepare?(req), describe?(req, res, body),
   *     skip?(req, res, body), coalesceFailuresMs? }
   *
   * `prepare` runs before the route (to note something the route will delete);
   * `describe` returns { user?, target?, detail?, detailLimit? } after it. The result
   * is judged by status code, and the route's own error message is kept as the detail.
   * With `coalesceFailuresMs`, a failure identical to one just recorded (same address,
   * user and reason) is left out until that long has passed.
   *
   * Express routes without regard to case or a trailing slash, so rules are matched
   * the same way; otherwise "/api/users/" would do the work and leave no trace. The
   * match is left on req.auditMatch for rules that need an id from the path.
   */
  function middleware(rules) {
    const compiled = rules.map((rule) => ({
      rule,
      matcher: new RegExp(rule.path.source, rule.path.flags.includes("i") ? rule.path.flags : `${rule.path.flags}i`)
    }));

    return (req, res, next) => {
      const where = auditPath(req.path);
      let match = null;
      const found = compiled.find((c) => {
        if (c.rule.method !== req.method) {
          return false;
        }
        match = c.matcher.exec(where);
        return Boolean(match);
      });
      if (!found) {
        return next();
      }
      const rule = found.rule;
      req.auditMatch = match;

      try {
        if (rule.prepare) {
          req.auditContext = rule.prepare(req) || {};
        }
      } catch {
        req.auditContext = {};
      }

      let body;
      const json = res.json.bind(res);
      res.json = (payload) => {
        body = payload;
        return json(payload);
      };

      res.on("finish", () => {
        try {
          // "Not signed in" on a route that needs a session is noise, not an event.
          if (res.statusCode === 401 && !rule.public) {
            return;
          }
          if (rule.skip && rule.skip(req, res, body)) {
            return;
          }
          const ok = res.statusCode < 400;
          const described = rule.describe ? (rule.describe(req, res, body) || {}) : {};
          const entry = {
            user: described.user || (req.user && req.user.username) || "",
            action: rule.action,
            target: described.target || "",
            detail: described.detail || (ok ? "" : (body && body.error) || `HTTP ${res.statusCode}`),
            ok,
            ip: req.ip || "",
            detailLimit: described.detailLimit
          };
          if (!ok && rule.coalesceFailuresMs > 0
            && alreadyRecorded(`${rule.action}|${entry.ip}|${String(entry.user).toLowerCase().slice(0, 64)}|${String(entry.detail).slice(0, 80)}`, rule.coalesceFailuresMs)) {
            return;
          }
          record(entry);
        } catch (error) {
          console.error(`Audit rule ${rule.action} failed: ${error.message}`);
        }
      });

      return next();
    };
  }

  return { file, keep: limit, record, list, middleware };
}

module.exports = { createAuditLog, auditPath, DEFAULT_KEEP };
