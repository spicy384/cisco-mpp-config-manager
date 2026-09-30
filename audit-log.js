const fs = require("fs");
const path = require("path");

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

function clip(value, max = MAX_FIELD) {
  const text = String(value == null ? "" : value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function createAuditLog({ dataDir, keep = DEFAULT_KEEP }) {
  const file = path.join(dataDir, "audit-log.json");
  const limit = Number.isInteger(keep) && keep > 0 ? keep : DEFAULT_KEEP;

  function load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /** Never throws: failing to write the audit log must not break the action itself. */
  function record({ user = "", action, target = "", detail = "", ok = true, ip = "" }) {
    const entry = {
      ts: Date.now(),
      user: clip(user, 64),
      action: clip(action, 64),
      target: clip(target),
      detail: clip(detail),
      ok: Boolean(ok),
      ip: clip(ip, 64)
    };

    try {
      fs.mkdirSync(dataDir, { recursive: true });
      const entries = [...load(), entry].slice(-limit);
      fs.writeFileSync(file, JSON.stringify(entries, null, 2), "utf8");
    } catch (error) {
      console.error(`Audit log could not be written: ${error.message}`);
    }
    return entry;
  }

  /** Newest first. */
  function list({ limit: max = 500 } = {}) {
    const n = Math.max(1, Math.min(Number(max) || 500, limit));
    return load().slice(-n).reverse();
  }

  /**
   * Express middleware that records requests matching a rule once they finish:
   *
   *   { method, path: RegExp, action, prepare?(req), describe?(req, res, body), skip?(req, res, body) }
   *
   * `prepare` runs before the route (to note something the route will delete);
   * `describe` returns { user?, target?, detail? } after it. The result is judged
   * by status code, and the route's own error message is kept as the detail.
   */
  function middleware(rules) {
    return (req, res, next) => {
      const rule = rules.find((r) => r.method === req.method && r.path.test(req.path));
      if (!rule) {
        return next();
      }

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
          record({
            user: described.user || (req.user && req.user.username) || "",
            action: rule.action,
            target: described.target || "",
            detail: described.detail || (ok ? "" : (body && body.error) || `HTTP ${res.statusCode}`),
            ok,
            ip: req.ip || ""
          });
        } catch (error) {
          console.error(`Audit rule ${rule.action} failed: ${error.message}`);
        }
      });

      return next();
    };
  }

  return { file, keep: limit, record, list, middleware };
}

module.exports = { createAuditLog, DEFAULT_KEEP };
