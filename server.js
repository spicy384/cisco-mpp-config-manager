const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const SftpClient = require("ssh2-sftp-client");
const { XMLParser, XMLBuilder } = require("fast-xml-parser");

const app = express();
const PORT = process.env.PORT || 3000;
// Override with DATA_DIR when running in a container so the JSON stores live on a volume.
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
const SERVERS_FILE = path.join(DATA_DIR, "servers.json");
const FILE_CACHE_FILE = path.join(DATA_DIR, "file-metadata-cache.json");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");
const CHANGE_LOG_FILE = path.join(DATA_DIR, "change-log.json");
// Which phone model each config file belongs to, so the Quick editor shows the right keys.
const PHONE_MODELS_FILE = path.join(DATA_DIR, "phone-models.json");
/**
 * Where the built-in "Default Template" is read from, tried in order:
 *   1. DEFAULT_TEMPLATE_PATH env var
 *   2. default-template.xml inside the data directory (your real template)
 *   3. the bundled example, so a fresh install has something usable
 * Returns null only if even the example is missing.
 */
const DEFAULT_TEMPLATE_CANDIDATES = [
  process.env.DEFAULT_TEMPLATE_PATH,
  path.join(DATA_DIR, "default-template.xml"),
  path.join(__dirname, "examples", "default-template.xml")
].filter(Boolean);

function resolveDefaultTemplatePath() {
  return DEFAULT_TEMPLATE_CANDIDATES.find((candidate) => {
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  }) || null;
}

// Per-server change history is capped so the log file cannot grow without bound.
const MAX_LOG_ENTRIES_PER_SCOPE = 2000;

// Behind a reverse proxy, say how many proxies to trust (usually 1) so the audit log
// records the client's address rather than the proxy's. Off by default: trusting
// forwarded headers from anyone would let a client choose the address it is logged as.
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set("trust proxy", Number.isInteger(hops) ? hops : process.env.TRUST_PROXY);
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const { createAuth } = require("./auth-routes");
const { resolveTlsOptions } = require("./tls-setup");
const { quickSchema, normalizeModelChoice } = require("./public/quick-config");
const { macToFileName } = require("./public/csv-rows");
const authGuard = createAuth({ dataDir: DATA_DIR });
const { createSshKeyStore } = require("./ssh-key");
// The app's own SSH key, for profiles set to sign in with a key instead of a password.
const sshKey = createSshKeyStore({ dataDir: DATA_DIR });
const { createAuditLog } = require("./audit-log");
// Who did what to the app itself (sign-ins, accounts, servers, keys). Phone config
// changes are in the change log.
const auditLog = createAuditLog({
  dataDir: DATA_DIR,
  keep: Number(process.env.AUDIT_KEEP) > 0 ? Number(process.env.AUDIT_KEEP) : undefined
});
const { createHostKeyStore } = require("./host-keys");
// SSH host keys are remembered on first connection and checked on every later one.
const hostKeys = createHostKeyStore({ dataDir: DATA_DIR });
const { createSnapshotStore } = require("./snapshots");
// A copy of every file is kept before it is overwritten, so any change made through
// this app can be undone. Oldest versions are pruned beyond this many per file.
const SNAPSHOT_KEEP = Number(process.env.SNAPSHOT_KEEP) > 0 ? Number(process.env.SNAPSHOT_KEEP) : 20;
const snapshots = createSnapshotStore({ dataDir: DATA_DIR, keep: SNAPSHOT_KEEP });
const {
  DEFAULT_RESYNC_COMMAND,
  validateResyncCommand,
  resolveResyncCommand,
  findLineExtension,
  sendResync,
  execOverSsh,
  buildResyncCommand,
  classifyResyncOutput
} = require("./resync");
const {
  validateStatusCommand,
  resolveStatusCommand,
  parseRegistrations,
  statusForExtension
} = require("./registration");

// --- audit rules -------------------------------------------------------------------
// Matched against every request before it is routed; see audit-log.js for the shape.
const userNameById = (id) => (authGuard.loadUsers().find((u) => u.id === id) || {}).username || id;
const idFromPath = (req, pattern) => decodeURIComponent((pattern.exec(req.path) || [])[1] || "");
const attemptedUser = (req, res, body) => ({ user: (body && body.user && body.user.username) || req.auditUser || String(req.body?.username || "").trim() });

const AUDIT_RULES = [
  { method: "POST", path: /^\/api\/auth\/setup$/, action: "setup", public: true,
    describe: (req) => ({ user: String(req.body?.username || "").trim(), detail: "first administrator created" }) },
  { method: "POST", path: /^\/api\/auth\/login$/, action: "sign-in", public: true,
    describe: (req, res, body) => ({
      ...attemptedUser(req, res, body),
      detail: res.statusCode < 400 ? (body && body.mfaRequired ? "password accepted, second factor required" : "password") : undefined
    }) },
  { method: "POST", path: /^\/api\/auth\/login\/mfa$/, action: "sign-in", public: true,
    describe: (req, res, body) => ({ ...attemptedUser(req, res, body), detail: res.statusCode < 400 ? "authenticator code" : undefined }) },
  { method: "POST", path: /^\/api\/auth\/login\/recovery$/, action: "sign-in", public: true,
    describe: (req, res, body) => ({ ...attemptedUser(req, res, body), detail: res.statusCode < 400 ? "recovery code" : undefined }) },
  { method: "POST", path: /^\/api\/auth\/passkeys\/login\/verify$/, action: "sign-in", public: true,
    describe: (req, res, body) => ({ ...attemptedUser(req, res, body), detail: res.statusCode < 400 ? "passkey" : undefined }) },
  { method: "POST", path: /^\/api\/auth\/logout$/, action: "sign-out" },
  { method: "POST", path: /^\/api\/auth\/password$/, action: "password-changed" },
  { method: "POST", path: /^\/api\/auth\/mfa\/confirm$/, action: "mfa-enabled" },
  { method: "POST", path: /^\/api\/auth\/mfa\/disable$/, action: "mfa-disabled" },
  { method: "POST", path: /^\/api\/auth\/passkeys\/register\/verify$/, action: "passkey-added",
    describe: (req) => ({ target: String(req.body?.name || "").trim() }) },
  { method: "DELETE", path: /^\/api\/auth\/passkeys\/([^/]+)$/, action: "passkey-removed" },

  { method: "POST", path: /^\/api\/users$/, action: "user-created",
    describe: (req, res, body) => ({ target: String(req.body?.username || "").trim(), detail: body && body.user ? `role ${body.user.role}` : undefined }) },
  { method: "DELETE", path: /^\/api\/users\/([^/]+)$/, action: "user-deleted",
    prepare: (req) => ({ target: userNameById(idFromPath(req, /^\/api\/users\/([^/]+)$/)) }),
    describe: (req) => ({ target: req.auditContext.target }) },
  { method: "POST", path: /^\/api\/users\/([^/]+)\/role$/, action: "role-changed",
    prepare: (req) => {
      const id = idFromPath(req, /^\/api\/users\/([^/]+)\/role$/);
      const user = authGuard.loadUsers().find((u) => u.id === id);
      return { target: user ? user.username : id, from: user ? user.role : "" };
    },
    describe: (req, res) => ({
      target: req.auditContext.target,
      detail: res.statusCode < 400 ? `${req.auditContext.from} -> ${String(req.body?.role || "")}` : undefined
    }) },
  { method: "POST", path: /^\/api\/users\/([^/]+)\/reset-mfa$/, action: "mfa-reset",
    prepare: (req) => ({ target: userNameById(idFromPath(req, /^\/api\/users\/([^/]+)\/reset-mfa$/)) }),
    describe: (req) => ({ target: req.auditContext.target }) },

  { method: "POST", path: /^\/api\/servers$/, action: "server-saved",
    describe: (req) => ({ target: `${String(req.body?.name || "").trim()} (${String(req.body?.host || "").trim()})` }) },
  { method: "DELETE", path: /^\/api\/servers\/([^/]+)$/, action: "server-deleted",
    prepare: (req) => {
      const id = idFromPath(req, /^\/api\/servers\/([^/]+)$/);
      const server = loadServers().find((s) => s.id === id);
      return { target: server ? `${server.name} (${server.host})` : id };
    },
    describe: (req) => ({ target: req.auditContext.target }) },
  { method: "POST", path: /^\/api\/templates$/, action: "template-saved",
    describe: (req) => ({ target: String(req.body?.name || "").trim() }) },

  { method: "POST", path: /^\/api\/connect$/, action: "pbx-connect",
    describe: (req, res, body) => {
      const conn = body && body.connection;
      const profile = req.body?.profileId ? loadServers().find((s) => s.id === String(req.body.profileId)) : null;
      const target = conn ? (conn.profileName || conn.host) : (profile ? profile.name : String(req.body?.host || "").trim());
      return { target, detail: conn ? `${conn.username}@${conn.host}:${conn.port} ${conn.remoteDir}, ${conn.auth === "key" ? "SSH key" : "password"}` : undefined };
    } },
  { method: "DELETE", path: /^\/api\/connection$/, action: "pbx-disconnect",
    describe: (req) => ({ target: req.auditTarget }),
    skip: (req) => !req.auditTarget },
  { method: "POST", path: /^\/api\/connection\/select$/, action: "pbx-switch",
    describe: (req) => ({ target: req.auditTarget || String(req.body?.key || "") }) },
  { method: "POST", path: /^\/api\/ssh-key$/, action: "ssh-key-generated",
    describe: (req, res, body) => ({ target: body && body.fingerprint ? body.fingerprint : "", detail: res.statusCode < 400 && req.body?.replace === true ? "replaced the previous key" : undefined }) },
  { method: "DELETE", path: /^\/api\/ssh-key$/, action: "ssh-key-removed" },
  { method: "POST", path: /^\/api\/known-hosts\/forget$/, action: "host-key-forgotten",
    describe: (req) => ({ target: `${String(req.body?.host || "").trim()}:${Number(req.body?.port) || 22}` }) },
  { method: "DELETE", path: /^\/api\/logs\/(.+)$/, action: "change-log-cleared",
    describe: (req, res, body) => ({ target: idFromPath(req, /^\/api\/logs\/(.+)$/), detail: body && body.cleared !== undefined ? `${body.cleared} entries` : undefined }) }
];

app.use(auditLog.middleware(AUDIT_RULES));

// Auth endpoints are mounted first: they must be reachable while signed out.
app.use(authGuard.router);

// Everything else under /api requires a signed-in user.
app.use("/api", authGuard.requireAuth);

// From here on a request knows which PBX it is about (see "PBX connections" below).
app.use("/api", (req, res, next) => {
  pbxContext.run({ key: resolveActiveKey(sessionIdOf(req)) }, next);
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  // Keep every value exactly as it appears in the file. The parser otherwise coerces
  // numeric-looking text, which silently corrupts real settings on the way back out:
  // an extension of 0903 becomes 903, 0x1F becomes 31, and 1.50 becomes 1.5.
  parseTagValue: false,
  parseAttributeValue: false
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  format: true,
  suppressEmptyNode: false
});

// --- PBX connections ---------------------------------------------------------------
// Several PBXs can be connected at once. Each live connection is a "link", keyed the
// same way as its change log (profile:<id>, or host|dir for an unsaved one), and each
// browser session works on one link at a time.
//
// A request's link is resolved once, up front, and carried through everything the
// request starts - including a bulk job that outlives it - so code below simply reads
// pbx.sftp and pbx.connection and always gets the PBX that request was about.
const { AsyncLocalStorage } = require("async_hooks");
const pbxContext = new AsyncLocalStorage();
const links = new Map();      // key -> { key, sftp, connection }
const lostLinks = new Map();  // key -> why a link ended without its users asking
const sessionPbx = new Map(); // session -> the key it works on ("" = chose to be on none)

const pbx = {
  get key() {
    const store = pbxContext.getStore();
    return store ? store.key : null;
  },
  get link() {
    const key = this.key;
    return key ? links.get(key) || null : null;
  },
  get sftp() {
    const link = this.link;
    return link ? link.sftp : null;
  },
  get connection() {
    const link = this.link;
    return link ? link.connection : null;
  },
  get lastDisconnect() {
    const key = this.key;
    return key ? lostLinks.get(key) || null : null;
  }
};

/** Proxy-authenticated callers have no session of their own, so they are told apart by name. */
function sessionIdOf(req) {
  return req.session && req.session.id ? req.session.id : `user:${req.user ? req.user.username : ""}`;
}

/**
 * Which PBX a session is on: the one it chose while that is live (or was lost, so it
 * can be told), else the only one connected - which keeps the old behaviour that a
 * second person signing in finds the shared connection waiting.
 */
function resolveActiveKey(sid) {
  const chosen = sessionPbx.get(sid);
  if (chosen === "") {
    return null;
  }
  if (chosen && (links.has(chosen) || lostLinks.has(chosen))) {
    return chosen;
  }
  if (links.size === 1) {
    const only = links.keys().next().value;
    sessionPbx.set(sid, only);
    return only;
  }
  return null;
}

/** Ends a link on purpose. Sessions still on it are told why on their next request. */
async function closeLink(key, reason) {
  const link = links.get(key);
  if (!link) {
    return false;
  }
  links.delete(key);
  registrationCaches.delete(key);
  deliberatelyClosed.add(link.sftp);
  if (reason) {
    lostLinks.set(key, {
      at: Date.now(),
      host: link.connection.host,
      profileId: link.connection.profileId || null,
      profileName: link.connection.profileName || null,
      reason
    });
  }
  try {
    await link.sftp.end();
  } catch (_) {
    // Ignore close errors.
  }
  return true;
}

function describeLinks(currentKey) {
  return [...links.values()].map((link) => ({
    key: link.key,
    label: link.connection.profileName || link.connection.host,
    host: link.connection.host,
    remoteDir: link.connection.remoteDir,
    current: link.key === currentKey
  }));
}

const fileMetadataCache = new Map();

function buildCacheScope() {
  if (pbx.connection?.profileId) {
    return `profile:${pbx.connection.profileId}`;
  }

  return `host:${pbx.connection?.host || ""}|dir:${pbx.connection?.remoteDir || ""}`;
}

function buildCacheKey(fileName) {
  return `${buildCacheScope()}/${fileName}`;
}
// A link that ends without anyone asking for it (idle timeout, PBX reboot, network
// drop) is remembered in lostLinks, so the next request from a session that was on it
// can say what happened instead of failing with whatever the SFTP layer threw.
const deliberatelyClosed = new WeakSet();
const SKIPPED_CONNECTION_LOST = "Not attempted: the connection to the PBX was lost first.";

function connectionLostMessage(lost = pbx.lastDisconnect) {
  const where = lost.profileName || lost.host || "the PBX";
  return `The connection to ${where} was lost (${lost.reason}). Reconnect to continue.`;
}

function ensureConnected() {
  if (pbx.sftp && pbx.connection) {
    return;
  }
  if (pbx.lastDisconnect) {
    const error = new Error(connectionLostMessage());
    error.connectionLost = true;
    error.status = 503;
    throw error;
  }
  throw new Error("Not connected. Use the Connect button first.");
}

/** Watches a live link and records when it ends on its own. */
function watchConnection(link) {
  const info = link.connection;
  let lastError = "";
  link.sftp.client.on("error", (error) => {
    lastError = error && error.message ? error.message : String(error);
  });
  // "end" arrives before "close", and the SFTP layer already refuses work by then,
  // so whichever comes first settles it.
  const onGone = () => {
    if (links.get(link.key) !== link || deliberatelyClosed.has(link.sftp)) {
      return;
    }
    links.delete(link.key);
    registrationCaches.delete(link.key);
    const lost = {
      at: Date.now(),
      host: info.host,
      profileId: info.profileId || null,
      profileName: info.profileName || null,
      reason: lastError || "the PBX closed the connection"
    };
    lostLinks.set(link.key, lost);
    console.warn(`PBX connection lost: ${info.host} - ${lost.reason}`);
    auditLog.record({ user: "(system)", action: "pbx-connection-lost", target: info.profileName || info.host, detail: lost.reason, ok: false });
  };
  link.sftp.client.on("end", onGone);
  link.sftp.client.on("close", onGone);
}

/**
 * One place for failed requests to answer from. A request that failed because the
 * connection went away says so (503, connectionLost) whatever the SFTP layer threw,
 * so the browser can drop back to the connect form.
 */
function sendError(res, error, fallbackStatus = 500) {
  const lostNow = pbx.lastDisconnect;
  const lost = Boolean(error && error.connectionLost) || (!pbx.sftp && Boolean(lostNow));
  if (lost && lostNow) {
    return res.status(503).json({
      error: connectionLostMessage(lostNow),
      connectionLost: true,
      lastDisconnect: lostNow,
      detail: error && !error.connectionLost ? error.message : undefined
    });
  }
  return res.status((error && error.status) || fallbackStatus).json({ error: error.message });
}

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(SERVERS_FILE)) {
    fs.writeFileSync(SERVERS_FILE, "[]", "utf8");
  }

  if (!fs.existsSync(FILE_CACHE_FILE)) {
    fs.writeFileSync(FILE_CACHE_FILE, "{}", "utf8");
  }

  if (!fs.existsSync(TEMPLATES_FILE)) {
    fs.writeFileSync(TEMPLATES_FILE, "[]", "utf8");
  }

  if (!fs.existsSync(CHANGE_LOG_FILE)) {
    fs.writeFileSync(CHANGE_LOG_FILE, "{}", "utf8");
  }
}

function loadFileMetadataCache() {
  ensureDataStore();

  try {
    const raw = fs.readFileSync(FILE_CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw);

    fileMetadataCache.clear();
    for (const [key, value] of Object.entries(parsed || {})) {
      if (!value || typeof value !== "object") {
        continue;
      }

      fileMetadataCache.set(key, {
        size: Number(value.size) || 0,
        modified: Number(value.modified) || 0,
        stationDisplayName: String(value.stationDisplayName || "")
      });
    }
  } catch {
    fileMetadataCache.clear();
  }
}

function persistFileMetadataCache() {
  ensureDataStore();

  const data = Object.fromEntries(fileMetadataCache.entries());
  fs.writeFileSync(FILE_CACHE_FILE, JSON.stringify(data, null, 2), "utf8");
}

function setFileMetadataCacheEntry(key, value) {
  fileMetadataCache.set(key, value);
  persistFileMetadataCache();
}

function deleteFileMetadataCacheEntry(key) {
  if (fileMetadataCache.delete(key)) {
    persistFileMetadataCache();
  }
}
/**
 * Change log is keyed by the same scope as the metadata cache, so a saved profile keeps
 * one history regardless of how many times you connect and disconnect.
 */
function loadChangeLog() {
  ensureDataStore();

  try {
    const raw = fs.readFileSync(CHANGE_LOG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveChangeLog(log) {
  ensureDataStore();
  fs.writeFileSync(CHANGE_LOG_FILE, JSON.stringify(log, null, 2), "utf8");
}

// Snapshot of who we are writing to, captured up-front so a later disconnect
// cannot detach entries from the server they belong to.
function buildLogScope(conn) {
  if (!conn) {
    return null;
  }

  const key = conn.profileId
    ? `profile:${conn.profileId}`
    : `host:${conn.host || ""}|dir:${conn.remoteDir || ""}`;

  return {
    key,
    label: conn.profileName || conn.host || "Unknown server",
    host: conn.host || "",
    remoteDir: conn.remoteDir || "",
    profileId: conn.profileId || null
  };
}

// Tags whose values must never be written to the change log.
const SENSITIVE_TAG = /passwd|password|passphrase|secret/i;
const REDACTED = "(hidden)";

function isSensitiveTag(tag) {
  return Boolean(tag) && SENSITIVE_TAG.test(String(tag));
}

/**
 * Records that a password changed without recording what it changed to.
 * Empty is left as-is so "cleared" is still distinguishable from "set", which
 * is useful when auditing and reveals nothing.
 */
function redactSensitiveEntry(entry) {
  if (!isSensitiveTag(entry.tag)) {
    return entry;
  }

  return {
    ...entry,
    before: entry.before ? REDACTED : entry.before,
    after: entry.after ? REDACTED : entry.after
  };
}

/**
 * `user` is stamped and secrets are redacted here rather than at each construction
 * site, so no code path can record a change without saying who made it, or leak a
 * password value into the log.
 */
function appendLogEntries(scope, entries, user = "") {
  if (!scope || !Array.isArray(entries) || entries.length === 0) {
    return;
  }

  const stamped = entries
    .map(redactSensitiveEntry)
    .map((entry) => ({ ...entry, user: entry.user || user || "" }));

  const log = loadChangeLog();
  const existing = log[scope.key];
  const bucket = existing && Array.isArray(existing.entries) ? existing : { entries: [] };

  // Refresh the label each time so renaming a profile updates the log viewer.
  bucket.label = scope.label;
  bucket.host = scope.host;
  bucket.remoteDir = scope.remoteDir;
  bucket.profileId = scope.profileId;
  bucket.entries = [...bucket.entries, ...stamped].slice(-MAX_LOG_ENTRIES_PER_SCOPE);

  log[scope.key] = bucket;
  saveChangeLog(log);
}

function loadServers() {
  ensureDataStore();
  try {
    const raw = fs.readFileSync(SERVERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveServers(servers) {
  ensureDataStore();
  fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2), "utf8");
}

function loadTemplates() {
  ensureDataStore();
  try {
    const raw = fs.readFileSync(TEMPLATES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates) {
  ensureDataStore();
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), "utf8");
}

function getDefaultTemplate() {
  try {
    const templatePath = resolveDefaultTemplatePath();
    if (!templatePath) {
      throw new Error("No default template file found.");
    }

    const xml = fs.readFileSync(templatePath, "utf8");
    const { rootKey, entries } = xmlToEntries(xml);
    return {
      id: "default",
      name: "Default Template",
      rootKey,
      entries
    };
  } catch {
    return {
      id: "default",
      name: "Default Template",
      rootKey: "flat-profile",
      entries: []
    };
  }
}
function sanitizeServerProfile(input) {
  const name = String(input?.name || "").trim();
  const host = String(input?.host || "").trim();
  const username = String(input?.username || "").trim();
  const remoteDir = String(input?.remoteDir || "").trim();
  const port = Number(input?.port) || 22;
  // Where speed dial and BLF buttons point, e.g. "pbx.example.com:5060".
  // Optional: only the Quick editor needs it, and it says so when it is missing.
  const sipServer = String(input?.sipServer || "").trim();
  // How to tell a phone to fetch its config, run on the PBX over SSH. Stored blank for
  // "use the default" so a later change to the default reaches every profile; throws
  // if a typed template is unusable.
  const resyncCommand = validateResyncCommand(input?.resyncCommand);
  // How to list registered phones. Blank means "pjsip show contacts".
  const statusCommand = validateStatusCommand(input?.statusCommand);
  // "key" signs in with the app's SSH key, so nobody types the PBX password.
  const auth = input?.auth === "key" ? "key" : "password";
  // Which phone model new and unassigned configs are assumed to be. Null means the app default.
  const defaultModel = normalizeModelChoice({
    model: input?.defaultModel?.model ?? input?.defaultModel,
    kems: input?.defaultModel?.kems ?? input?.defaultKems,
    customKeys: input?.defaultModel?.customKeys ?? input?.defaultCustomKeys
  });

  if (!name || !host || !username || !remoteDir) {
    throw new Error("name, host, username, and remoteDir are required.");
  }

  if (sipServer && /[\s;@]/.test(sipServer)) {
    throw new Error("SIP server must be a host or host:port, with no spaces, '@' or ';'.");
  }

  return {
    id: String(input?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    name,
    host,
    port,
    username,
    remoteDir,
    sipServer,
    resyncCommand,
    statusCommand,
    defaultModel,
    auth
  };
}

function sanitizeFileName(fileName) {
  if (typeof fileName !== "string") {
    throw new Error("Invalid file name.");
  }

  const clean = fileName.trim();
  if (!clean || clean.includes("/") || clean.includes("\\")) {
    throw new Error("File name must not include paths.");
  }

  if (!clean.toLowerCase().endsWith(".xml")) {
    throw new Error("File name must end with .xml");
  }

  return clean;
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) {
    throw new Error("Entries must be an array.");
  }

  return entries
    .map((entry) => ({
      key: String(entry.key || "").trim(),
      value: entry.value == null ? "" : String(entry.value),
      attributes: entry.attributes && typeof entry.attributes === "object" ? entry.attributes : {}
    }))
    .filter((entry) => entry.key.length > 0);
}

function xmlToEntries(xmlText) {
  const parsed = parser.parse(xmlText);
  const rootKey = Object.keys(parsed)[0];

  if (!rootKey) {
    throw new Error("XML has no root node.");
  }

  const root = parsed[rootKey];
  if (!root || typeof root !== "object") {
    return { rootKey, entries: [] };
  }

  const entries = [];

  for (const [key, raw] of Object.entries(root)) {
    if (Array.isArray(raw)) {
      raw.forEach((item) => {
        if (item && typeof item === "object") {
          const attributes = {};
          let value = "";

          for (const [k, v] of Object.entries(item)) {
            if (k === "#text") {
              value = v == null ? "" : String(v);
            } else if (k.startsWith("@_")) {
              attributes[k.slice(2)] = v;
            }
          }

          entries.push({ key, value, attributes });
        } else {
          entries.push({ key, value: item == null ? "" : String(item), attributes: {} });
        }
      });
      continue;
    }

    if (raw && typeof raw === "object") {
      const attributes = {};
      let value = "";

      for (const [k, v] of Object.entries(raw)) {
        if (k === "#text") {
          value = v == null ? "" : String(v);
        } else if (k.startsWith("@_")) {
          attributes[k.slice(2)] = v;
        }
      }

      entries.push({ key, value, attributes });
      continue;
    }

    entries.push({ key, value: raw == null ? "" : String(raw), attributes: {} });
  }

  return { rootKey, entries };
}

function extractStationDisplayName(xmlText) {
  // Fast path: avoid full XML parse for list rendering.
  const match = String(xmlText).match(/<Station_Display_Name\b[^>]*>([\s\S]*?)<\/Station_Display_Name>/i);
  if (!match) {
    return "";
  }

  const raw = match[1] || "";
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function findStationDisplayNameInEntries(entries) {
  const found = (entries || []).find((entry) => String(entry.key || "").trim() === "Station_Display_Name");
  return found ? String(found.value || "") : "";
}
function entriesToXml(rootKey, entries) {
  const normalized = normalizeEntries(entries);
  const root = {};

  for (const entry of normalized) {
    const node = { "#text": entry.value };

    for (const [attrName, attrValue] of Object.entries(entry.attributes || {})) {
      if (attrName.trim().length === 0) {
        continue;
      }
      node[`@_${attrName}`] = attrValue == null ? "" : String(attrValue);
    }

    if (Object.prototype.hasOwnProperty.call(root, entry.key)) {
      if (!Array.isArray(root[entry.key])) {
        root[entry.key] = [root[entry.key]];
      }
      root[entry.key].push(node);
    } else {
      root[entry.key] = node;
    }
  }

  return builder.build({ [rootKey]: root });
}

const BULK_EDIT_MODES = new Set(["set", "update-existing", "delete"]);

// null means "keep whatever attributes the tag already has".
function normalizeAttributeOverride(input) {
  if (input == null) {
    return null;
  }

  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Attributes must be a JSON object.");
  }

  const out = {};
  for (const [name, value] of Object.entries(input)) {
    const clean = String(name).trim();
    if (clean.length === 0) {
      continue;
    }
    out[clean] = value == null ? "" : String(value);
  }

  return out;
}

/**
 * Applies a single tag edit to one file's entries.
 * Returns the new entry list plus the previous values, so callers can show a diff.
 */
function applyBulkEdit(entries, { key, value, attributes, mode }) {
  const previousValues = [];
  let matched = 0;
  let next;

  if (mode === "delete") {
    next = entries.filter((entry) => {
      if (entry.key !== key) {
        return true;
      }
      matched += 1;
      previousValues.push(entry.value);
      return false;
    });
  } else {
    next = entries.map((entry) => {
      if (entry.key !== key) {
        return entry;
      }

      matched += 1;
      previousValues.push(entry.value);
      return {
        key: entry.key,
        value,
        attributes: attributes === null ? entry.attributes : attributes
      };
    });

    // "set" also creates the tag when it is missing; "update-existing" never does.
    if (matched === 0 && mode === "set") {
      next = [...next, { key, value, attributes: attributes || {} }];
    }
  }

  return { entries: next, matched, previousValues };
}

// A single save can touch many fields (e.g. loading a template), so itemised logging
// is capped and the remainder collapsed into one summary row.
const MAX_LOGGED_FIELD_CHANGES = 25;

function groupEntriesByKey(entries) {
  const map = new Map();

  for (const entry of entries || []) {
    if (!map.has(entry.key)) {
      map.set(entry.key, []);
    }
    map.get(entry.key).push(entry);
  }

  return map;
}

/**
 * Field-level diff between two entry lists, so a manual save records what actually
 * changed rather than just "N fields". Repeated tags are compared as a group.
 */
function diffEntriesForLog(oldEntries, newEntries) {
  const before = groupEntriesByKey(oldEntries);
  const after = groupEntriesByKey(newEntries);
  const keys = new Set([...before.keys(), ...after.keys()]);
  const changes = [];

  for (const key of keys) {
    const oldList = before.get(key) || [];
    const newList = after.get(key) || [];

    const oldValues = oldList.map((e) => e.value).join(" | ");
    const newValues = newList.map((e) => e.value).join(" | ");
    const oldAttrs = JSON.stringify(oldList.map((e) => e.attributes || {}));
    const newAttrs = JSON.stringify(newList.map((e) => e.attributes || {}));

    if (oldValues === newValues && oldAttrs === newAttrs) {
      continue;
    }

    let action;
    if (oldList.length === 0) {
      action = "field-added";
    } else if (newList.length === 0) {
      action = "field-removed";
    } else {
      action = "field-changed";
    }

    // When only attributes moved, show them so the row isn't "x -> x".
    const attrsOnly = oldValues === newValues && oldAttrs !== newAttrs;

    changes.push({
      key,
      action,
      before: oldList.length === 0 ? null : (attrsOnly ? `${oldValues} [attrs ${oldAttrs}]` : oldValues),
      after: newList.length === 0 ? null : (attrsOnly ? `${newValues} [attrs ${newAttrs}]` : newValues)
    });
  }

  changes.sort((a, b) => a.key.localeCompare(b.key));
  return changes;
}

function buildSaveLogEntries(fileName, changes, station = "") {
  const ts = Date.now();

  if (changes.length === 0) {
    return [{
      ts,
      action: "save",
      file: fileName,
      station,
      tag: null,
      before: null,
      after: "No field changes",
      status: "changed",
      error: null
    }];
  }

  const shown = changes.slice(0, MAX_LOGGED_FIELD_CHANGES);
  const entries = shown.map((change) => ({
    ts,
    action: change.action,
    file: fileName,
    station,
    tag: change.key,
    before: change.before,
    after: change.after,
    status: "changed",
    error: null
  }));

  const remaining = changes.length - shown.length;
  if (remaining > 0) {
    entries.push({
      ts,
      action: "save",
      file: fileName,
      station,
      tag: null,
      before: null,
      after: `+${remaining} more field${remaining === 1 ? "" : "s"} changed`,
      status: "changed",
      error: null
    });
  }

  return entries;
}

// Bulk runs are tracked as jobs so the browser can poll progress while SFTP works
// through the files one at a time.
const bulkJobs = new Map();
// PBX key -> the job running on it. One at a time per PBX: they share its connection.
const activeJobs = new Map();
const JOB_RETENTION_MS = 10 * 60 * 1000;

function pruneBulkJobs() {
  const now = Date.now();
  for (const [id, job] of bulkJobs) {
    if (job.status !== "running" && now - (job.finishedAt || 0) > JOB_RETENTION_MS) {
      bulkJobs.delete(id);
    }
  }
}

function summarizeResults(results) {
  return results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
}

function jobToJson(job) {
  return {
    jobId: job.id,
    status: job.status,
    dryRun: job.dryRun,
    key: job.key,
    mode: job.mode,
    total: job.total,
    processed: job.processed,
    currentFile: job.currentFile,
    results: job.results,
    summary: summarizeResults(job.results),
    error: job.error || null,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt || null,
    rollbackOf: job.request.rollbackOf || null,
    unmatched: job.unmatched || 0,
    sourceLabel: job.sourceLabel || null,
    criteria: job.request.criteria || null,
    resync: Boolean(job.request.resync),
    stage: job.stage || "write",
    resyncTotal: job.resyncTotal || 0,
    resyncDone: job.resyncDone || 0
  };
}

/**
 * Identifies one exact state of a file. The editor is given this when it opens a
 * file and hands it back on save, so a save can be refused if someone else wrote
 * the file in between.
 */
function contentVersion(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

/** Who last wrote a file through this app, from the change log, for conflict messages. */
function lastLoggedWrite(scope, fileName) {
  const bucket = scope ? loadChangeLog()[scope.key] : null;
  const entries = bucket && Array.isArray(bucket.entries) ? bucket.entries : [];
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (entries[i].file === fileName && entries[i].status !== "error") {
      return { user: entries[i].user || "", ts: entries[i].ts };
    }
  }
  return null;
}

/**
 * Stores the file as it currently is on the PBX before it is overwritten. Returns
 * null when the file does not exist yet. Any other failure is thrown so the write
 * does not go ahead: a change that cannot be undone is not one worth making.
 * Pass `xmlText` when the caller has already read the file.
 */
async function snapshotBeforeWrite(scope, fileName, remotePath, { user = "", reason = "save", station = "", xmlText = null } = {}) {
  let raw = xmlText;

  if (raw === null) {
    if (!(await pbx.sftp.exists(remotePath))) {
      return null;
    }
    const content = await pbx.sftp.get(remotePath);
    raw = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);
  }

  const entry = snapshots.capture({
    scopeKey: scope.key,
    fileName,
    content: raw,
    user,
    reason,
    station: station || extractStationDisplayName(raw) || ""
  });

  return { ...entry, xmlText: raw };
}

/**
 * Writes a stored version back to the PBX. The file as it is now is snapshotted
 * first, so a restore is itself undoable. Versions are looked up under the
 * connected server's scope, so one PBX's history can never land on another.
 */
async function restoreSnapshot(fileName, snapshotId, user = "") {
  const scope = buildLogScope(pbx.connection);
  const snapshot = snapshots.read(scope.key, fileName, snapshotId);

  if (!snapshot) {
    const error = new Error("No such version exists for this server.");
    error.status = 404;
    throw error;
  }

  const remotePath = path.posix.join(pbx.connection.remoteDir, fileName);
  const before = await snapshotBeforeWrite(scope, fileName, remotePath, { user, reason: "restore" });

  await pbx.sftp.put(Buffer.from(snapshot.content, "utf8"), remotePath);

  const restoredEntries = xmlToEntries(snapshot.content).entries;
  const previousEntries = before ? xmlToEntries(before.xmlText).entries : [];
  const station = findStationDisplayNameInEntries(previousEntries) || findStationDisplayNameInEntries(restoredEntries);

  setFileMetadataCacheEntry(buildCacheKey(fileName), {
    size: Buffer.byteLength(snapshot.content, "utf8"),
    modified: Date.now(),
    stationDisplayName: findStationDisplayNameInEntries(restoredEntries),
    extension: findLineExtension(restoredEntries) || ""
  });

  // With no file on the PBX (it was deleted or replaced) this recreates it; a row per
  // field would say nothing useful.
  const changes = before ? diffEntriesForLog(previousEntries, restoredEntries) : [];
  const summary = !before
    ? `file recreated, ${restoredEntries.length} field${restoredEntries.length === 1 ? "" : "s"}`
    : changes.length === 0
    ? "no field changes"
    : `${changes.length} field${changes.length === 1 ? "" : "s"}`;

  const logEntries = [
    {
      ts: Date.now(),
      action: "restore",
      file: fileName,
      station,
      tag: null,
      before: null,
      after: `Restored version from ${new Date(snapshot.ts).toISOString()} (${summary})`,
      status: "changed",
      error: null
    },
    ...(changes.length ? buildSaveLogEntries(fileName, changes, station) : [])
  ].map((entry) => ({ ...entry, snapshotId: before ? before.id : null }));

  appendLogEntries(scope, logEntries, user);

  return {
    fileName,
    station,
    ext: findLineExtension(restoredEntries),
    restored: { id: snapshot.id, ts: snapshot.ts },
    changes: changes.length,
    recreated: !before,
    // The copy taken just now, i.e. what "undo this restore" would bring back.
    undoSnapshotId: before ? before.id : null
  };
}

function resyncLogEntry(fileName, station, result) {
  const after = result.status === "sent"
    ? `Resync sent to ${result.ext}`
    : (result.status === "skipped" ? `Resync skipped: ${result.detail}` : null);

  return {
    ts: Date.now(),
    action: "resync",
    file: fileName,
    station: station || "",
    tag: null,
    before: null,
    after,
    status: result.status === "failed" ? "error" : "changed",
    error: result.status === "failed" ? `Resync failed: ${result.detail}` : null
  };
}

/** Tells one phone to fetch its config, reading the file to find its extension. */
async function resyncPhone(fileName, user = "") {
  const remotePath = path.posix.join(pbx.connection.remoteDir, fileName);
  const content = await pbx.sftp.get(remotePath);
  const { entries } = xmlToEntries(Buffer.isBuffer(content) ? content.toString("utf8") : String(content));
  const station = findStationDisplayNameInEntries(entries);
  const ext = findLineExtension(entries);

  const result = await sendResync(pbx.sftp.client, pbx.connection.resyncCommand, ext);
  appendLogEntries(buildLogScope(pbx.connection), [resyncLogEntry(fileName, station, result)], user);

  return { fileName, station, ...result };
}

/** The resync stage of a bulk apply: every phone whose file changed is told to fetch it. */
async function resyncChangedPhones(job) {
  const targets = job.results.filter((item) => item.status === "changed");
  job.stage = "resync";
  job.resyncTotal = targets.length;
  job.resyncDone = 0;

  for (const item of targets) {
    job.currentFile = item.name;
    item.resync = pbx.sftp
      ? await sendResync(pbx.sftp.client, job.request.resyncCommand, item.ext)
      : { status: "failed", ext: item.ext || null, detail: "the connection to the PBX was lost" };
    job.resyncDone += 1;
  }

  job.currentFile = null;
}

// --- phone models ------------------------------------------------------------------
function loadPhoneModels() {
  ensureDataStore();
  try {
    const parsed = JSON.parse(fs.readFileSync(PHONE_MODELS_FILE, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function savePhoneModels(map) {
  ensureDataStore();
  fs.writeFileSync(PHONE_MODELS_FILE, JSON.stringify(map, null, 2), "utf8");
}

function getPhoneModel(fileName) {
  return normalizeModelChoice(loadPhoneModels()[buildCacheKey(fileName)]);
}

/** Null clears the record so the profile default applies again. */
function setPhoneModel(fileName, choice) {
  const map = loadPhoneModels();
  const key = buildCacheKey(fileName);
  const clean = normalizeModelChoice(choice);
  if (clean) {
    map[key] = clean;
  } else {
    delete map[key];
  }
  savePhoneModels(map);
  return clean;
}

// --- clone a phone --------------------------------------------------------------
const PHONE_FILE_PATTERN = /^spa.*\.xml$/i;

function setEntryValue(entries, key, value, attributes = { ua: "na" }) {
  const index = entries.findIndex((e) => e.key === key);
  if (index >= 0) {
    entries[index] = { ...entries[index], value: String(value) };
  } else {
    entries.push({ key, value: String(value), attributes });
  }
}

function entryValue(entries, key) {
  const found = entries.find((e) => e.key === key);
  return found ? String(found.value == null ? "" : found.value).trim() : "";
}

/**
 * A new phone's config from an existing one: everything copied, line 1 re-pointed
 * at the new extension. Blank overrides keep the source's value, except that the
 * short name follows whichever of the extension or display name it mirrored.
 */
function buildClonedEntries(sourceEntries, { ext, displayName = "", password = "", station = "" } = {}) {
  const extension = String(ext || "").trim();
  if (!extension) {
    throw new Error("A line 1 extension is required for the new phone.");
  }

  const entries = sourceEntries.map((e) => ({ ...e, attributes: { ...(e.attributes || {}) } }));
  const sourceExt = entryValue(entries, "User_ID_1_");
  const sourceName = entryValue(entries, "Display_Name_1_");
  const sourceShort = entryValue(entries, "Short_Name_1_");

  setEntryValue(entries, "User_ID_1_", extension);
  if (entryValue(entries, "Extension_1_") === "" || /^disabled$/i.test(entryValue(entries, "Extension_1_"))) {
    setEntryValue(entries, "Extension_1_", "1");
  }
  if (String(displayName).trim()) {
    setEntryValue(entries, "Display_Name_1_", String(displayName).trim());
  }
  if (String(password)) {
    setEntryValue(entries, "Password_1_", String(password));
  }
  if (String(station).trim()) {
    setEntryValue(entries, "Station_Display_Name", String(station).trim());
  }

  // Keep the short name meaningful: if it mirrored the old extension or name, follow the new one.
  if (sourceShort && sourceExt && sourceShort === sourceExt) {
    setEntryValue(entries, "Short_Name_1_", extension);
  } else if (sourceShort && sourceName && sourceShort === sourceName && String(displayName).trim()) {
    setEntryValue(entries, "Short_Name_1_", String(displayName).trim());
  }

  return entries;
}

// --- find in all configs ------------------------------------------------------
const SEARCH_MODES = new Set(["contains", "exact", "regex"]);
const MAX_SEARCH_MATCHES_PER_FILE = 20;
const MAX_SEARCH_PATTERN_LENGTH = 200;

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Turns what was typed into the Find panel into tests. A tag matches by name
 * (case-insensitive, * as a wildcard); a value by containing, equalling, or
 * matching a regular expression. Either may be omitted, not both.
 */
function buildSearchCriteria({ tag, value, mode } = {}) {
  const tagText = String(tag || "").trim();
  const valueText = String(value == null ? "" : value);
  const matchMode = SEARCH_MODES.has(mode) ? mode : "contains";

  if (!tagText && !valueText) {
    throw new Error("Enter a tag name, a value, or both.");
  }
  if (tagText.length > MAX_SEARCH_PATTERN_LENGTH || valueText.length > MAX_SEARCH_PATTERN_LENGTH) {
    throw new Error(`Search terms are limited to ${MAX_SEARCH_PATTERN_LENGTH} characters.`);
  }

  let tagTest = null;
  if (tagText) {
    if (tagText.includes("*")) {
      const re = new RegExp(`^${tagText.split("*").map(escapeRegex).join(".*")}$`, "i");
      tagTest = (key) => re.test(key);
    } else {
      const wanted = tagText.toLowerCase();
      tagTest = (key) => key.toLowerCase() === wanted;
    }
  }

  let valueTest = null;
  if (valueText) {
    if (matchMode === "regex") {
      let re;
      try {
        re = new RegExp(valueText, "i");
      } catch (error) {
        throw new Error(`Invalid regular expression: ${error.message}`);
      }
      valueTest = (v) => re.test(v);
    } else if (matchMode === "exact") {
      valueTest = (v) => v === valueText;
    } else {
      const wanted = valueText.toLowerCase();
      valueTest = (v) => v.toLowerCase().includes(wanted);
    }
  }

  return { tag: tagText, value: valueText, mode: matchMode, tagTest, valueTest };
}

/** The entries of one file that satisfy the criteria, as { tag, value }. */
function matchEntries(entries, criteria) {
  const out = [];
  for (const entry of Array.isArray(entries) ? entries : []) {
    const key = String(entry?.key || "");
    const value = String(entry?.value == null ? "" : entry.value);
    if (criteria.tagTest && !criteria.tagTest(key)) {
      continue;
    }
    if (criteria.valueTest && !criteria.valueTest(value)) {
      continue;
    }
    out.push({ tag: key, value });
  }
  return out;
}

/** Read-only scan of every config on the PBX. Results hold only the files that matched. */
async function runSearchJob(job) {
  const { criteria: raw, remoteDir } = job.request;
  const criteria = buildSearchCriteria(raw);

  ensureConnected();
  const remoteList = await pbx.sftp.list(remoteDir);
  const fileNames = remoteList
    .filter((item) => item.type !== "d" && /^spa.*\.xml$/i.test(item.name))
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b));

  job.total = fileNames.length;
  job.unmatched = 0;

  for (const fileName of fileNames) {
    job.currentFile = fileName;
    ensureConnected();
    try {
      const content = await pbx.sftp.get(path.posix.join(remoteDir, fileName));
      const { entries } = xmlToEntries(Buffer.isBuffer(content) ? content.toString("utf8") : String(content));
      const matches = matchEntries(entries, criteria);

      if (matches.length === 0) {
        job.unmatched += 1;
        continue;
      }

      job.results.push({
        name: fileName,
        station: findStationDisplayNameInEntries(entries),
        status: "matched",
        matched: matches.length,
        // Same rule as the change log: a password's presence is shown, its value is not.
        matches: matches.slice(0, MAX_SEARCH_MATCHES_PER_FILE).map((m) => ({
          tag: m.tag,
          value: isSensitiveTag(m.tag) && m.value ? REDACTED : m.value
        }))
      });
    } catch (error) {
      job.results.push({
        name: fileName,
        station: fileMetadataCache.get(buildCacheKey(fileName))?.stationDisplayName || "",
        status: "error",
        error: error.message
      });
    } finally {
      job.processed += 1;
    }
  }

  job.currentFile = null;
}

// --- provisioning from a list ---------------------------------------------------------
const MAX_PROVISION_ROWS = 500;

/**
 * Checks a list of phones to create before anything is written: every row gets its
 * file name, and the problems that would stop it (errors) or that the operator
 * should know about (warnings). `existing` is the set of file names already on the
 * PBX, lower-cased; `usedExtensions` maps an extension to the file that has it.
 */
function planProvisionRows(rows, { existing = new Set(), usedExtensions = new Map(), sourceHasPassword = false } = {}) {
  const seenFiles = new Map();
  const seenExtensions = new Map();

  return rows.map((row, index) => {
    const line = Number(row?.line) || index + 1;
    const ext = String(row?.ext == null ? "" : row.ext).trim();
    const fileName = macToFileName(row?.mac);
    const plan = {
      line,
      mac: String(row?.mac == null ? "" : row.mac).trim(),
      fileName,
      ext,
      displayName: String(row?.displayName == null ? "" : row.displayName).trim(),
      password: String(row?.password == null ? "" : row.password),
      station: String(row?.station == null ? "" : row.station).trim(),
      errors: [],
      warnings: []
    };

    if (!fileName) {
      plan.errors.push(plan.mac ? `"${plan.mac}" is not a MAC address (12 hex digits) or a .xml file name` : "no MAC address");
    } else if (/[/\\]/.test(fileName) || !PHONE_FILE_PATTERN.test(fileName)) {
      plan.errors.push("the file must be named spa<MAC>.xml");
    } else {
      const key = fileName.toLowerCase();
      if (seenFiles.has(key)) {
        plan.errors.push(`same phone as line ${seenFiles.get(key)}`);
      } else {
        seenFiles.set(key, line);
        if (existing.has(key)) {
          plan.errors.push(`${fileName} already exists on the PBX`);
        }
      }
    }

    if (!ext) {
      plan.errors.push("no extension");
    } else {
      if (seenExtensions.has(ext)) {
        plan.warnings.push(`extension ${ext} is also on line ${seenExtensions.get(ext)}`);
      } else {
        seenExtensions.set(ext, line);
      }
      if (usedExtensions.has(ext)) {
        plan.warnings.push(`extension ${ext} is already on ${usedExtensions.get(ext)}`);
      }
    }

    if (!plan.password) {
      plan.warnings.push(sourceHasPassword ? "no SIP password given: the source's is copied" : "no SIP password");
    }

    return plan;
  });
}

/** The config to copy from: a phone on the PBX or a saved template. */
async function loadProvisionSource(source) {
  if (source.templateId) {
    const template = source.templateId === "default"
      ? getDefaultTemplate()
      : loadTemplates().find((t) => t.id === source.templateId);
    if (!template) {
      throw new Error("Template not found.");
    }
    if (!Array.isArray(template.entries) || template.entries.length === 0) {
      throw new Error(`Template "${template.name}" is empty.`);
    }
    return { label: `template "${template.name}"`, rootKey: template.rootKey || "flat-profile", entries: normalizeEntries(template.entries), model: null };
  }

  const remotePath = path.posix.join(pbx.connection.remoteDir, source.file);
  if (!(await pbx.sftp.exists(remotePath))) {
    throw new Error(`Source file not found: ${source.file}`);
  }
  const content = await pbx.sftp.get(remotePath);
  const { rootKey, entries } = xmlToEntries(Buffer.isBuffer(content) ? content.toString("utf8") : String(content));
  return { label: source.file, rootKey: rootKey || "flat-profile", entries, model: getPhoneModel(source.file) };
}

/** Creates (or, as a dry run, only checks) every phone in the list. */
async function runProvisionJob(job) {
  const { rows, source, dryRun, remoteDir, scope, user } = job.request;

  ensureConnected();
  const loaded = await loadProvisionSource(source);
  job.sourceLabel = loaded.label;

  const remoteList = await pbx.sftp.list(remoteDir);
  const existing = new Set(remoteList.filter((item) => item.type !== "d").map((item) => item.name.toLowerCase()));
  const usedExtensions = new Map();
  const cachePrefix = `${buildCacheScope()}/`;
  for (const [key, meta] of fileMetadataCache.entries()) {
    if (key.startsWith(cachePrefix) && meta && meta.extension && existing.has(key.slice(cachePrefix.length).toLowerCase())) {
      usedExtensions.set(meta.extension, key.slice(cachePrefix.length));
    }
  }

  const sourceHasPassword = loaded.entries.some((e) => e.key === "Password_1_" && String(e.value || "") !== "");
  const plans = planProvisionRows(rows, { existing, usedExtensions, sourceHasPassword });
  const logEntries = [];

  for (const plan of plans) {
    job.currentFile = plan.fileName || `line ${plan.line}`;
    const result = {
      name: plan.fileName || "",
      line: plan.line,
      ext: plan.ext,
      station: plan.station,
      warnings: plan.warnings
    };

    try {
      if (plan.errors.length > 0) {
        job.results.push({ ...result, status: "error", error: plan.errors.join("; ") });
        continue;
      }

      const entries = buildClonedEntries(loaded.entries, {
        ext: plan.ext, displayName: plan.displayName, password: plan.password, station: plan.station
      });
      result.station = findStationDisplayNameInEntries(entries);

      if (dryRun) {
        job.results.push({ ...result, status: "ready" });
        continue;
      }

      ensureConnected();
      const remotePath = path.posix.join(remoteDir, plan.fileName);
      // Checked again at the moment of writing: the list may be minutes old.
      if (await pbx.sftp.exists(remotePath)) {
        job.results.push({ ...result, status: "error", error: `${plan.fileName} already exists on the PBX` });
        continue;
      }

      const xml = entriesToXml(loaded.rootKey, entries);
      await pbx.sftp.put(Buffer.from(xml, "utf8"), remotePath);

      setFileMetadataCacheEntry(buildCacheKey(plan.fileName), {
        size: Buffer.byteLength(xml, "utf8"),
        modified: Date.now(),
        stationDisplayName: result.station,
        extension: plan.ext
      });
      if (loaded.model) {
        setPhoneModel(plan.fileName, loaded.model);
      }

      logEntries.push({
        ts: Date.now(),
        action: "create",
        file: plan.fileName,
        station: result.station,
        tag: null,
        before: null,
        after: `Created from ${loaded.label} by list (${entries.length} field${entries.length === 1 ? "" : "s"}), line 1 = ${plan.ext}`,
        status: "changed",
        error: null,
        snapshotId: null
      });
      job.results.push({ ...result, status: "created" });
    } catch (error) {
      job.results.push({ ...result, status: "error", error: error.message });
    } finally {
      job.processed += 1;
    }
  }

  job.currentFile = null;
  appendLogEntries(scope, logEntries, user);
}

// --- drift report -------------------------------------------------------------------
// Tags that are meant to differ from phone to phone, so they are left out of a
// comparison unless the caller says otherwise.
const DEFAULT_DRIFT_IGNORE = [
  "Station_Display_Name", "Station_Name",
  "Extension_*", "User_ID_*", "Auth_ID_*", "Password_*", "Display_Name_*", "Short_Name_*",
  "Extended_Function_*"
];
const MAX_DRIFT_DIFFERENCES_PER_FILE = 40;

/** "A, B_*  C" -> ["A", "B_*", "C"]. Commas, semicolons and whitespace all separate. */
function parseTagList(text) {
  if (Array.isArray(text)) {
    return text.map((t) => String(t).trim()).filter(Boolean);
  }
  return String(text == null ? "" : text).split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
}

/** A test for "is this tag named by any of these patterns" (case-insensitive, * wildcard). */
function buildTagMatcher(patterns) {
  const list = parseTagList(patterns);
  if (list.length > 200) {
    throw new Error("Too many tag patterns (200 at most).");
  }
  const tests = list.map((pattern) => {
    if (pattern.length > MAX_SEARCH_PATTERN_LENGTH) {
      throw new Error(`Tag patterns are limited to ${MAX_SEARCH_PATTERN_LENGTH} characters.`);
    }
    return new RegExp(`^${pattern.split("*").map(escapeRegex).join(".*")}$`, "i");
  });
  const matcher = (key) => tests.some((re) => re.test(key));
  matcher.patterns = list;
  return matcher;
}

/**
 * How one phone's config differs from a baseline's, limited to the tags asked for
 * (all of them when `include` is empty) and leaving out the ignored ones.
 */
function compareToBaseline(baselineEntries, entries, { include, ignore } = {}) {
  const wanted = include && include.patterns.length ? include : null;
  return diffEntriesForLog(baselineEntries, entries)
    .filter((change) => (!wanted || wanted(change.key)) && !(ignore && ignore(change.key)))
    .map((change) => ({ tag: change.key, baseline: change.before, value: change.after }));
}

/** Read-only: every phone compared against one baseline phone. */
async function runDriftJob(job) {
  const { criteria, remoteDir, fileNames: requested } = job.request;
  const include = buildTagMatcher(criteria.include);
  const ignore = buildTagMatcher(criteria.ignore);

  ensureConnected();
  if (!(await pbx.sftp.exists(path.posix.join(remoteDir, criteria.baseline)))) {
    throw new Error(`Baseline file not found: ${criteria.baseline}`);
  }
  const baseContent = await pbx.sftp.get(path.posix.join(remoteDir, criteria.baseline));
  const baselineEntries = xmlToEntries(Buffer.isBuffer(baseContent) ? baseContent.toString("utf8") : String(baseContent)).entries;
  criteria.baselineStation = findStationDisplayNameInEntries(baselineEntries);

  let fileNames = requested;
  if (!fileNames) {
    const remoteList = await pbx.sftp.list(remoteDir);
    fileNames = remoteList
      .filter((item) => item.type !== "d" && /^spa.*\.xml$/i.test(item.name))
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b));
  }
  fileNames = fileNames.filter((name) => name !== criteria.baseline);

  job.total = fileNames.length;
  job.unmatched = 0;

  for (const fileName of fileNames) {
    job.currentFile = fileName;
    ensureConnected();
    try {
      const content = await pbx.sftp.get(path.posix.join(remoteDir, fileName));
      const { entries } = xmlToEntries(Buffer.isBuffer(content) ? content.toString("utf8") : String(content));
      const differences = compareToBaseline(baselineEntries, entries, { include, ignore });

      if (differences.length === 0) {
        job.unmatched += 1;
        continue;
      }

      const redact = (tag, value) => (value && isSensitiveTag(tag) ? REDACTED : value);
      job.results.push({
        name: fileName,
        station: findStationDisplayNameInEntries(entries),
        status: "differs",
        matched: differences.length,
        differences: differences.slice(0, MAX_DRIFT_DIFFERENCES_PER_FILE).map((d) => ({
          tag: d.tag,
          baseline: redact(d.tag, d.baseline),
          value: redact(d.tag, d.value)
        }))
      });
    } catch (error) {
      job.results.push({
        name: fileName,
        station: fileMetadataCache.get(buildCacheKey(fileName))?.stationDisplayName || "",
        status: "error",
        error: error.message
      });
    } finally {
      job.processed += 1;
    }
  }

  job.currentFile = null;
}

function bulkJobIsRunning() {
  const running = bulkJobs.get(activeJobs.get(pbx.key));
  return Boolean(running && running.status === "running");
}

/** Runs a job in the background; the client polls /api/bulk-edit/:jobId for progress. */
function launchJob(job, runner) {
  const key = pbx.key;
  bulkJobs.set(job.id, job);
  activeJobs.set(key, job.id);

  runner(job)
    .then(() => {
      job.status = "done";
    })
    .catch((error) => {
      job.status = "failed";
      job.error = error.message;
    })
    .finally(() => {
      job.finishedAt = Date.now();
      if (activeJobs.get(key) === job.id) {
        activeJobs.delete(key);
      }
    });
}

/** Puts every file a bulk apply changed back to the copy taken just before it. */
async function runRollbackJob(job) {
  const { targets, user } = job.request;

  for (const target of targets) {
    job.currentFile = target.fileName;

    if (!pbx.sftp) {
      job.results.push({ name: target.fileName, station: "", status: "error", error: SKIPPED_CONNECTION_LOST });
      job.processed += 1;
      continue;
    }

    try {
      const result = await restoreSnapshot(target.fileName, target.snapshotId, user);
      job.results.push({
        name: target.fileName,
        station: result.station,
        status: "changed",
        matched: 0,
        previousValues: [],
        newValue: `restored (${result.changes} field${result.changes === 1 ? "" : "s"})`,
        changes: [],
        snapshotId: result.undoSnapshotId,
        ext: result.ext
      });
    } catch (error) {
      job.results.push({
        name: target.fileName,
        station: fileMetadataCache.get(buildCacheKey(target.fileName))?.stationDisplayName || "",
        status: "error",
        error: error.message
      });
    } finally {
      job.processed += 1;
    }
  }

  job.currentFile = null;

  // Optionally tell the rolled-back phones to fetch their (restored) configs.
  if (job.request.resync) {
    await resyncChangedPhones(job);
    const rows = job.results
      .filter((item) => item.resync)
      .map((item) => resyncLogEntry(item.name, item.station, item.resync));
    appendLogEntries(job.request.scope, rows, job.request.user);
  }
}

async function runBulkJob(job) {
  const { fileNames, edits, dryRun, scope, remoteDir } = job.request;

  // Legacy single-edit callers see the familiar fields; multi-edit callers read `changes`.
  const singleEdit = edits.length === 1 ? edits[0] : null;

  for (const fileName of fileNames) {
    job.currentFile = fileName;

    if (!pbx.sftp) {
      job.results.push({ name: fileName, station: "", status: "error", error: SKIPPED_CONNECTION_LOST });
      job.processed += 1;
      continue;
    }
    const remotePath = path.posix.join(remoteDir, fileName);

    try {
      const content = await pbx.sftp.get(remotePath);
      const xmlText = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);
      const { rootKey, entries } = xmlToEntries(xmlText);

      // Identifies the phone in results and logs; file names are MAC addresses.
      const station = findStationDisplayNameInEntries(entries);

      // Apply every edit in turn, carrying the result forward.
      let working = entries;
      let totalMatched = 0;
      let anyMissing = false;
      const changes = [];

      for (const edit of edits) {
        const before = working;
        const applied = applyBulkEdit(before, edit);
        totalMatched += applied.matched;

        if (applied.matched === 0 && edit.mode !== "set") {
          anyMissing = true;
          continue;
        }

        changes.push({
          tag: edit.key,
          before: (applied.previousValues || []).join(", "),
          after: edit.mode === "delete" ? null : edit.value,
          previousValues: applied.previousValues
        });

        working = applied.entries;
      }

      // Every edit was a no-op against a tag that does not exist.
      if (changes.length === 0 && anyMissing) {
        job.results.push({ name: fileName, station, status: "missing", matched: 0, previousValues: [], changes: [] });
        continue;
      }

      // Compare rebuilt-vs-rebuilt so a no-op edit never rewrites (and reformats) a file.
      const currentXml = entriesToXml(rootKey, entries);
      const nextXml = entriesToXml(rootKey, working);

      if (currentXml === nextXml) {
        job.results.push({
          name: fileName,
          station,
          status: "unchanged",
          matched: totalMatched,
          previousValues: changes[0]?.previousValues || [],
          changes
        });
        continue;
      }

      let snapshotId = null;
      if (!dryRun) {
        // The file was already read above; keep those exact bytes before overwriting.
        const snapshot = await snapshotBeforeWrite(scope, fileName, remotePath, {
          user: job.request.user, reason: "bulk", station, xmlText
        });
        snapshotId = snapshot ? snapshot.id : null;

        await pbx.sftp.put(Buffer.from(nextXml, "utf8"), remotePath);
        setFileMetadataCacheEntry(buildCacheKey(fileName), {
          size: Buffer.byteLength(nextXml, "utf8"),
          modified: Date.now(),
          stationDisplayName: findStationDisplayNameInEntries(working),
          extension: findLineExtension(working) || ""
        });
      }

      job.results.push({
        name: fileName,
        station,
        status: "changed",
        matched: totalMatched,
        previousValues: changes[0]?.previousValues || [],
        newValue: singleEdit ? (singleEdit.mode === "delete" ? null : singleEdit.value) : null,
        changes,
        snapshotId,
        ext: findLineExtension(working)
      });
    } catch (error) {
      // One bad file must not abort the rest of the batch. The file could not be read,
      // so fall back to the last known station name from the list cache.
      job.results.push({
        name: fileName,
        station: fileMetadataCache.get(buildCacheKey(fileName))?.stationDisplayName || "",
        status: "error",
        error: error.message
      });
    } finally {
      job.processed += 1;
    }
  }

  job.currentFile = null;

  if (!dryRun && job.request.resync) {
    await resyncChangedPhones(job);
  }

  // Only real writes are auditable events; a preview changed nothing.
  if (!dryRun) {
    const logEntries = [];

    for (const item of job.results) {
      if (item.status === "error") {
        logEntries.push({
          ts: Date.now(),
          action: "bulk-set",
          file: item.name,
          station: item.station || "",
          tag: singleEdit ? singleEdit.key : "(multiple)",
          before: "",
          after: null,
          status: "error",
          error: item.error || null
        });
        continue;
      }

      if (item.status !== "changed") {
        continue;
      }

      // One log row per tag actually changed, so a Quick action that writes two
      // tags is recorded as two auditable changes rather than one vague entry.
      for (const change of item.changes || []) {
        const edit = edits.find((e) => e.key === change.tag);
        logEntries.push({
          ts: Date.now(),
          action: edit && edit.mode === "delete" ? "bulk-delete" : "bulk-set",
          file: item.name,
          station: item.station || "",
          tag: change.tag,
          before: change.before,
          after: change.after,
          status: "changed",
          error: null,
          snapshotId: item.snapshotId || null
        });
      }

      if (item.resync) {
        logEntries.push(resyncLogEntry(item.name, item.station, item.resync));
      }
    }

    appendLogEntries(scope, logEntries, job.request.user);
  }
}

app.post("/api/bulk-edit", (req, res) => {
  // Previews are read-only and fine for viewers; applying is not. Checked before
  // anything else so the answer is the same whether or not a PBX is connected.
  if (req.body?.dryRun === false && req.user?.role === "viewer") {
    return res.status(403).json({ error: "This account is read-only: you can preview a bulk edit but not apply it." });
  }

  try {
    ensureConnected();
    pruneBulkJobs();

    if (bulkJobIsRunning()) {
      return res.status(409).json({ error: "A bulk edit is already running. Wait for it to finish." });
    }

    const { dryRun } = req.body || {};

    // Two request shapes: a single tag edit (the Bulk Edit panel), or a list of
    // them (a Quick action, which usually writes more than one tag).
    const rawEdits = Array.isArray(req.body?.edits) && req.body.edits.length > 0
      ? req.body.edits
      : [{ key: req.body?.key, value: req.body?.value, attributes: req.body?.attributes, mode: req.body?.mode }];

    if (!Array.isArray(req.body?.fileNames) || req.body.fileNames.length === 0) {
      return res.status(400).json({ error: "Select at least one file." });
    }

    const edits = [];
    for (const raw of rawEdits) {
      const targetKey = String(raw?.key || "").trim();
      const editMode = String(raw?.mode || "set");

      if (!targetKey) {
        return res.status(400).json({ error: "Tag name is required." });
      }
      if (!BULK_EDIT_MODES.has(editMode)) {
        return res.status(400).json({ error: `Unknown mode: ${editMode}` });
      }

      edits.push({
        key: targetKey,
        mode: editMode,
        value: editMode === "delete" ? "" : (raw?.value == null ? "" : String(raw.value)),
        attributes: normalizeAttributeOverride(raw?.attributes)
      });
    }

    const duplicate = edits.map((e) => e.key).find((k, i, all) => all.indexOf(k) !== i);
    if (duplicate) {
      return res.status(400).json({ error: `The same tag appears twice in one request: ${duplicate}` });
    }

    const fileNames = req.body.fileNames.map((name) => sanitizeFileName(name));
    const isDryRun = dryRun !== false;
    const primary = edits[0];

    const job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "running",
      dryRun: isDryRun,
      key: primary.key,
      mode: primary.mode,
      editCount: edits.length,
      total: fileNames.length,
      processed: 0,
      currentFile: null,
      results: [],
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
      request: {
        fileNames,
        edits,
        dryRun: isDryRun,
        // Only an apply can resync, and only when asked to.
        resync: !isDryRun && req.body?.resync === true,
        resyncCommand: pbx.connection.resyncCommand,
        remoteDir: pbx.connection.remoteDir,
        scope: buildLogScope(pbx.connection),
        // Captured now: the job outlives the request that started it.
        user: req.user ? req.user.username : ""
      }
    };

    launchJob(job, runBulkJob);

    return res.status(202).json({ jobId: job.id, total: job.total, dryRun: isDryRun });
  } catch (error) {
    return sendError(res, error);
  }
});

// Searches every config on the PBX. Read-only, so any signed-in role may run it.
app.post("/api/search", (req, res) => {
  try {
    ensureConnected();
    pruneBulkJobs();

    let criteria;
    try {
      criteria = buildSearchCriteria(req.body || {});
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    if (bulkJobIsRunning()) {
      return res.status(409).json({ error: "A bulk edit is already running. Wait for it to finish." });
    }

    const job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "running",
      dryRun: true,
      key: criteria.tag,
      mode: "find",
      editCount: 0,
      total: 0,
      processed: 0,
      currentFile: null,
      results: [],
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
      request: {
        criteria: { tag: criteria.tag, value: criteria.value, mode: criteria.mode },
        remoteDir: pbx.connection.remoteDir,
        scope: buildLogScope(pbx.connection),
        user: req.user ? req.user.username : ""
      }
    };

    launchJob(job, runSearchJob);
    return res.status(202).json({ jobId: job.id, dryRun: true });
  } catch (error) {
    return sendError(res, error);
  }
});

// Creates many phones from a list in one job. A dry run (the default) only checks the
// list, so the operator sees every problem before anything is written.
app.post("/api/provision", authGuard.requireWriter, (req, res) => {
  try {
    ensureConnected();
    pruneBulkJobs();

    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return res.status(400).json({ error: "The list has no phones in it." });
    }
    if (rows.length > MAX_PROVISION_ROWS) {
      return res.status(400).json({ error: `A list can hold at most ${MAX_PROVISION_ROWS} phones; this one has ${rows.length}.` });
    }

    let source;
    try {
      if (req.body?.source?.templateId) {
        source = { templateId: String(req.body.source.templateId) };
      } else {
        source = { file: sanitizeFileName(String(req.body?.source?.file || "")) };
      }
    } catch {
      return res.status(400).json({ error: "Choose a phone or a template to copy from." });
    }
    if (bulkJobIsRunning()) {
      return res.status(409).json({ error: "A bulk edit is already running. Wait for it to finish." });
    }

    const isDryRun = req.body?.dryRun !== false;
    const job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "running",
      dryRun: isDryRun,
      key: source.file || source.templateId,
      mode: "provision",
      editCount: 0,
      total: rows.length,
      processed: 0,
      currentFile: null,
      results: [],
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
      request: {
        rows,
        source,
        dryRun: isDryRun,
        remoteDir: pbx.connection.remoteDir,
        scope: buildLogScope(pbx.connection),
        user: req.user ? req.user.username : ""
      }
    };

    launchJob(job, runProvisionJob);
    return res.status(202).json({ jobId: job.id, total: job.total, dryRun: isDryRun });
  } catch (error) {
    return sendError(res, error);
  }
});

// Compares every phone (or the ones named) with a baseline phone. Read-only, so any
// signed-in role may run it.
app.post("/api/drift", (req, res) => {
  try {
    ensureConnected();
    pruneBulkJobs();

    let baseline;
    let fileNames = null;
    let ignoreList;
    try {
      baseline = sanitizeFileName(String(req.body?.baseline || ""));
      // Absent means the usual per-phone tags; an empty list means ignore nothing.
      ignoreList = req.body?.ignore === undefined ? DEFAULT_DRIFT_IGNORE : parseTagList(req.body.ignore);
      buildTagMatcher(req.body?.include);
      buildTagMatcher(ignoreList);
      if (Array.isArray(req.body?.fileNames) && req.body.fileNames.length > 0) {
        fileNames = req.body.fileNames.map((name) => sanitizeFileName(name));
      }
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    if (bulkJobIsRunning()) {
      return res.status(409).json({ error: "A bulk edit is already running. Wait for it to finish." });
    }

    const job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "running",
      dryRun: true,
      key: baseline,
      mode: "drift",
      editCount: 0,
      total: 0,
      processed: 0,
      currentFile: null,
      results: [],
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
      request: {
        criteria: { baseline, baselineStation: "", include: parseTagList(req.body?.include), ignore: ignoreList },
        fileNames,
        remoteDir: pbx.connection.remoteDir,
        scope: buildLogScope(pbx.connection),
        user: req.user ? req.user.username : ""
      }
    };

    launchJob(job, runDriftJob);
    return res.status(202).json({ jobId: job.id, dryRun: true });
  } catch (error) {
    return sendError(res, error);
  }
});

app.get("/api/drift/defaults", (req, res) => {
  res.json({ ignore: DEFAULT_DRIFT_IGNORE });
});

// Undoes a completed apply as one job, so the same progress UI applies.
app.post("/api/bulk-edit/:jobId/rollback", authGuard.requireWriter, (req, res) => {
  try {
    ensureConnected();
    pruneBulkJobs();

    const source = bulkJobs.get(String(req.params.jobId || ""));
    if (!source) {
      return res.status(404).json({ error: "Job not found or expired." });
    }
    if (source.dryRun || source.status !== "done" || source.request.rollbackOf) {
      return res.status(400).json({ error: "Only a completed apply can be rolled back." });
    }

    const scope = buildLogScope(pbx.connection);
    if (source.request.scope?.key !== scope.key) {
      return res.status(409).json({ error: "That batch was applied to a different server. Connect to it first." });
    }
    if (bulkJobIsRunning()) {
      return res.status(409).json({ error: "A bulk edit is already running. Wait for it to finish." });
    }

    const targets = source.results
      .filter((item) => item.status === "changed" && item.snapshotId)
      .map((item) => ({ fileName: item.name, snapshotId: item.snapshotId }));

    if (targets.length === 0) {
      return res.status(400).json({ error: "Nothing in that batch can be rolled back." });
    }

    const job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "running",
      dryRun: false,
      key: source.key,
      mode: "rollback",
      editCount: 0,
      total: targets.length,
      processed: 0,
      currentFile: null,
      results: [],
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
      request: {
        rollbackOf: source.id,
        targets,
        scope,
        // Off unless asked, like the apply's own tick box.
        resync: req.body?.resync === true,
        resyncCommand: pbx.connection.resyncCommand,
        user: req.user ? req.user.username : ""
      }
    };

    launchJob(job, runRollbackJob);

    return res.status(202).json({ jobId: job.id, total: job.total, dryRun: false, rollbackOf: source.id });
  } catch (error) {
    return sendError(res, error);
  }
});

app.get("/api/bulk-edit/:jobId", (req, res) => {
  const job = bulkJobs.get(String(req.params.jobId || ""));
  if (!job) {
    return res.status(404).json({ error: "Job not found or expired." });
  }

  return res.json(jobToJson(job));
});

// Lists every server we hold history for, including ones not currently connected.
app.get("/api/logs", (req, res) => {
  const log = loadChangeLog();
  const savedById = new Map(loadServers().map((s) => [s.id, s]));

  const scopes = Object.entries(log).map(([key, bucket]) => {
    const entries = Array.isArray(bucket?.entries) ? bucket.entries : [];
    // Prefer the saved profile's current name so renames show up here.
    const saved = bucket?.profileId ? savedById.get(bucket.profileId) : null;

    return {
      key,
      label: saved?.name || bucket?.label || key,
      host: saved?.host || bucket?.host || "",
      remoteDir: saved?.remoteDir || bucket?.remoteDir || "",
      entryCount: entries.length,
      lastActivity: entries.length ? entries[entries.length - 1].ts : null
    };
  });

  scopes.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

  const current = buildLogScope(pbx.connection);
  res.json({ scopes, currentScopeKey: current ? current.key : null });
});

app.get("/api/logs/:scopeKey", (req, res) => {
  const key = String(req.params.scopeKey || "");
  const bucket = loadChangeLog()[key];

  if (!bucket) {
    return res.json({ key, label: key, entries: [] });
  }

  const entries = Array.isArray(bucket.entries) ? bucket.entries : [];
  return res.json({
    key,
    label: bucket.label || key,
    host: bucket.host || "",
    remoteDir: bucket.remoteDir || "",
    // Newest first for display.
    entries: [...entries].reverse()
  });
});

app.delete("/api/logs/:scopeKey", authGuard.requireWriter, (req, res) => {
  const key = String(req.params.scopeKey || "");
  const log = loadChangeLog();

  if (!log[key]) {
    return res.json({ ok: true, cleared: 0 });
  }

  const cleared = Array.isArray(log[key].entries) ? log[key].entries.length : 0;
  delete log[key];
  saveChangeLog(log);

  return res.json({ ok: true, cleared });
});

app.get("/api/servers", (req, res) => {
  const servers = loadServers().sort((a, b) => a.name.localeCompare(b.name));
  res.json({ servers });
});

app.post("/api/servers", authGuard.requireWriter, (req, res) => {
  try {
    const profile = sanitizeServerProfile(req.body || {});
    const servers = loadServers();
    const idx = servers.findIndex((s) => s.id === profile.id);

    if (idx >= 0) {
      servers[idx] = profile;
    } else {
      servers.push(profile);
    }

    saveServers(servers);
    res.json({ ok: true, profile });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/servers/:id", authGuard.requireWriter, (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) {
    return res.status(400).json({ error: "Server id is required." });
  }

  const servers = loadServers();
  const next = servers.filter((s) => s.id !== id);
  saveServers(next);
  // A connection made from that profile has nothing to belong to any more.
  closeLink(`profile:${id}`, "its server profile was deleted").catch(() => {});
  res.json({ ok: true });
});

app.get("/api/templates", (req, res) => {
  const defaults = getDefaultTemplate();
  const custom = loadTemplates()
    .map((t) => ({ id: t.id, name: t.name, rootKey: t.rootKey }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json({ templates: [defaults, ...custom] });
});

app.get("/api/templates/:id", (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) {
    return res.status(400).json({ error: "Template id is required." });
  }

  if (id === "default") {
    return res.json(getDefaultTemplate());
  }

  const template = loadTemplates().find((t) => t.id === id);
  if (!template) {
    return res.status(404).json({ error: "Template not found." });
  }

  return res.json(template);
});

app.post("/api/templates", authGuard.requireWriter, (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const rootKey = String(req.body?.rootKey || "flat-profile").trim() || "flat-profile";
    const entries = normalizeEntries(req.body?.entries || []);

    if (!name) {
      return res.status(400).json({ error: "Template name is required." });
    }

    const templates = loadTemplates();
    const id = String(req.body?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    const next = { id, name, rootKey, entries };

    const idx = templates.findIndex((t) => t.id === id);
    if (idx >= 0) {
      templates[idx] = next;
    } else {
      templates.push(next);
    }

    saveTemplates(templates);
    res.json({ ok: true, template: { id: next.id, name: next.name, rootKey: next.rootKey } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.post("/api/connect", async (req, res) => {
  const { profileId, host, port, username, password, remoteDir } = req.body || {};

  let target = null;

  if (profileId) {
    const servers = loadServers();
    target = servers.find((s) => s.id === String(profileId));

    if (!target) {
      return res.status(400).json({ error: "Saved PBX server not found." });
    }
  } else {
    if (!host || !username || !remoteDir) {
      return res.status(400).json({ error: "host, username, and remoteDir are required for direct connection." });
    }

    target = {
      host: String(host),
      port: Number(port) || 22,
      username: String(username),
      remoteDir: String(remoteDir),
      auth: req.body?.auth === "key" ? "key" : "password"
    };
  }

  // A saved profile decides how it signs in; the request cannot override that.
  const useKey = target.auth === "key";
  let privateKey = null;
  if (useKey) {
    privateKey = sshKey.privateKey();
    if (!privateKey) {
      return res.status(400).json({ error: "This server signs in with the app's SSH key, but no key exists yet. An administrator can create one under Settings." });
    }
  } else if (!password) {
    return res.status(400).json({ error: "password is required." });
  }

  // Other PBXs stay connected. A link to this same PBX, if there is one, is replaced
  // only once the new connection is up, so a mistyped password costs nothing.
  const targetKey = target.id ? `profile:${target.id}` : `host:${target.host}|dir:${target.remoteDir}`;
  const sid = sessionIdOf(req);

  const client = new SftpClient();
  const hostPort = Number(target.port) || 22;
  const hostKey = hostKeys.verifierFor(target.host, hostPort);

  try {
    try {
      await client.connect({
        host: target.host,
        port: hostPort,
        username: target.username,
        ...(useKey ? { privateKey } : { password }),
        readyTimeout: 15000,
        // A PBX that stops answering is noticed within about 45 seconds rather than
        // at the next click, and idle sessions are kept alive through firewalls.
        keepaliveInterval: 15000,
        keepaliveCountMax: 3,
        hostVerifier: hostKey.verifier
      });
    } catch (error) {
      // ssh2 only says "verification failed"; the store knows what actually differed.
      if (hostKey.outcome.status === "mismatch") {
        throw hostKeys.mismatchError(target.host, hostPort, hostKey.outcome);
      }
      if (useKey && /authentication methods failed/i.test(error.message || "")) {
        throw new Error(`${target.host} did not accept the app's SSH key for ${target.username}. Add the public key shown under Settings to that user's ~/.ssh/authorized_keys on the PBX.`);
      }
      throw error;
    }

    const exists = await client.exists(target.remoteDir);
    if (!exists) {
      await client.end();
      return res.status(400).json({ error: `Remote directory does not exist: ${target.remoteDir}` });
    }

    const connection = {
      host: target.host,
      port: Number(target.port) || 22,
      username: target.username,
      remoteDir: target.remoteDir,
      profileId: target.id || null,
      profileName: target.name || null,
      // Used by the Quick editor when building speed dial and BLF targets.
      sipServer: target.sipServer || "",
      resyncCommand: resolveResyncCommand(target.resyncCommand),
      statusCommand: resolveStatusCommand(target.statusCommand),
      defaultModel: normalizeModelChoice(target.defaultModel),
      auth: useKey ? "key" : "password",
      hostKey: { fingerprint: hostKey.outcome.fingerprint, status: hostKey.outcome.status }
    };
    const previous = links.get(targetKey);
    const link = { key: targetKey, sftp: client, connection };
    links.set(targetKey, link);
    lostLinks.delete(targetKey);
    registrationCaches.delete(targetKey);
    watchConnection(link);
    if (previous) {
      deliberatelyClosed.add(previous.sftp);
      previous.sftp.end().catch(() => {});
    }

    // This session now works on that PBX; others stay where they are.
    sessionPbx.set(sid, targetKey);
    pbxContext.getStore().key = targetKey;

    return res.json({
      ok: true,
      message: `Connected to ${target.host}`,
      connection,
      connections: describeLinks(targetKey)
    });
  } catch (error) {
    try {
      await client.end();
    } catch (_) {
      // Ignore close errors.
    }

    if (error.code === "HOST_KEY_MISMATCH") {
      // The host is not the one remembered: an existing link to it is not kept either.
      await closeLink(targetKey, "its SSH host key changed");
      if (sessionPbx.get(sid) === targetKey) {
        sessionPbx.set(sid, "");
        pbxContext.getStore().key = null;
      }
      return res.status(409).json({
        error: error.message,
        hostKeyMismatch: true,
        host: error.host,
        port: error.port,
        expected: error.expected,
        actual: error.actual
      });
    }

    return res.status(500).json({ error: error.message || "Connection failed." });
  }
});

// The app's SSH key. Everyone may see the public half (it is what gets installed on the
// PBX); only administrators create or remove it. The private half never leaves the server.
app.get("/api/ssh-key", (req, res) => {
  res.json(sshKey.info());
});

app.post("/api/ssh-key", authGuard.requireAdmin, (req, res) => {
  try {
    res.json({ ok: true, ...sshKey.generate({ replace: req.body?.replace === true }) });
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
});

app.delete("/api/ssh-key", authGuard.requireAdmin, (req, res) => {
  try {
    res.json({ ok: true, removed: sshKey.remove() });
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
});

// The audit log is for administrators, and there is no route that clears it.
app.get("/api/audit", authGuard.requireAdmin, (req, res) => {
  res.json({ keep: auditLog.keep, entries: auditLog.list({ limit: Number(req.query.limit) || 1000 }) });
});

// Remembered SSH host keys. Forgetting one is an administrator action because it is
// the only way to make the app accept a changed key.
app.get("/api/known-hosts", authGuard.requireAdmin, (req, res) => {
  res.json({ hosts: hostKeys.list() });
});

app.post("/api/known-hosts/forget", authGuard.requireAdmin, (req, res) => {
  const host = String(req.body?.host || "").trim();
  if (!host) {
    return res.status(400).json({ error: "host is required." });
  }

  const port = Number(req.body?.port) || 22;
  const forgotten = hostKeys.forget(host, port);
  res.json({ ok: true, forgotten, host, port });
});

app.get("/api/status", (req, res) => {
  const connection = pbx.connection;
  const lost = pbx.lastDisconnect;
  res.json({
    connected: Boolean(connection),
    connection,
    // Present only when this session's connection ended without it asking.
    lastDisconnect: connection ? null : lost,
    lostMessage: !connection && lost ? connectionLostMessage(lost) : null,
    // Every PBX connected right now, whoever connected it.
    connections: describeLinks(pbx.key)
  });
});

// Moves this session onto a PBX that is already connected. No password is asked for:
// the connection is shared by everyone signed in, exactly as the single one was.
app.post("/api/connection/select", (req, res) => {
  const key = String(req.body?.key || "");
  const link = links.get(key);
  if (!link) {
    return res.status(404).json({ error: "That PBX is no longer connected." });
  }
  sessionPbx.set(sessionIdOf(req), key);
  req.auditTarget = link.connection.profileName || link.connection.host;
  return res.json({ ok: true, message: `Now working on ${req.auditTarget}`, connection: link.connection, connections: describeLinks(key) });
});

// The browser builds its Quick editor forms from this, so the recipes stay
// defined in one place rather than duplicated in the UI.
app.get("/api/quick/schema", (req, res) => {
  res.json(quickSchema());
});

app.get("/api/files", async (req, res) => {
  try {
    ensureConnected();

    const remoteList = await pbx.sftp.list(pbx.connection.remoteDir);
    const xmlFiles = remoteList
      .filter((item) => item.type !== "d" && /^spa.*\.xml$/i.test(item.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    const files = [];
    for (const item of xmlFiles) {
      const cacheKey = buildCacheKey(item.name);
      const cached = fileMetadataCache.get(cacheKey);

      // Entries cached before extensions were tracked are re-read once.
      if (cached && cached.size === item.size && cached.modified === item.modifyTime && cached.extension !== undefined) {
        files.push({
          name: item.name,
          size: item.size,
          modified: item.modifyTime,
          stationDisplayName: cached.stationDisplayName || "",
          extension: cached.extension || ""
        });
        continue;
      }

      const remotePath = path.posix.join(pbx.connection.remoteDir, item.name);
      let stationDisplayName = "";
      let extension = "";

      try {
        const content = await pbx.sftp.get(remotePath);
        const xmlText = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);
        stationDisplayName = extractStationDisplayName(xmlText);
        extension = findLineExtension(xmlToEntries(xmlText).entries) || "";
      } catch (_) {
        stationDisplayName = "";
      }

      setFileMetadataCacheEntry(cacheKey, {
        size: item.size,
        modified: item.modifyTime,
        stationDisplayName,
        extension
      });

      files.push({
        name: item.name,
        size: item.size,
        modified: item.modifyTime,
        stationDisplayName,
        extension
      });
    }

    // The phone model each file is recorded as, for listings that show it.
    const models = loadPhoneModels();
    for (const file of files) {
      file.model = normalizeModelChoice(models[buildCacheKey(file.name)]);
    }

    res.json({ files });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/files/:name", async (req, res) => {
  try {
    ensureConnected();

    const fileName = sanitizeFileName(req.params.name);
    const remotePath = path.posix.join(pbx.connection.remoteDir, fileName);

    const content = await pbx.sftp.get(remotePath);
    const xmlText = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);

    const { rootKey, entries } = xmlToEntries(xmlText);

    res.json({ fileName, rootKey, entries, xmlText, version: contentVersion(xmlText), model: getPhoneModel(fileName) });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/files/:name/model", (req, res) => {
  try {
    ensureConnected();
    const fileName = sanitizeFileName(req.params.name);
    res.json({ fileName, model: getPhoneModel(fileName), profileDefault: pbx.connection.defaultModel || null });
  } catch (error) {
    sendError(res, error);
  }
});

app.put("/api/files/:name/model", authGuard.requireWriter, (req, res) => {
  try {
    ensureConnected();
    const fileName = sanitizeFileName(req.params.name);
    const wanted = req.body?.model ? req.body : null;
    if (wanted && !normalizeModelChoice(wanted)) {
      return res.status(400).json({ error: "Unknown phone model." });
    }
    const model = setPhoneModel(fileName, wanted);
    res.json({ ok: true, fileName, model });
  } catch (error) {
    sendError(res, error);
  }
});

// --- retire and replace ---------------------------------------------------------
// Removes a phone's config from the PBX. The file is kept as a version first, so the
// Restore button on its change-log row brings the phone back exactly as it was.
app.delete("/api/files/:name", authGuard.requireWriter, async (req, res) => {
  try {
    ensureConnected();
    if (bulkJobIsRunning()) {
      return res.status(409).json({ error: "A bulk edit is running. Wait for it to finish." });
    }

    const fileName = sanitizeFileName(req.params.name);
    const remotePath = path.posix.join(pbx.connection.remoteDir, fileName);
    const scope = buildLogScope(pbx.connection);
    const user = req.user ? req.user.username : "";

    if (!(await pbx.sftp.exists(remotePath))) {
      return res.status(404).json({ error: `File not found: ${fileName}` });
    }

    // Throws if the copy cannot be kept, in which case nothing is deleted.
    const snapshot = await snapshotBeforeWrite(scope, fileName, remotePath, { user, reason: "delete" });
    const entries = xmlToEntries(snapshot.xmlText).entries;
    const station = findStationDisplayNameInEntries(entries);

    await pbx.sftp.delete(remotePath);
    deleteFileMetadataCacheEntry(buildCacheKey(fileName));

    appendLogEntries(scope, [{
      ts: Date.now(),
      action: "delete",
      file: fileName,
      station,
      tag: null,
      before: `${entries.length} field${entries.length === 1 ? "" : "s"}`,
      after: "Deleted from the PBX. Restore brings it back.",
      status: "changed",
      error: null,
      snapshotId: snapshot.id
    }], user);

    return res.json({ ok: true, message: `Deleted ${fileName}`, fileName, station, snapshotId: snapshot.id });
  } catch (error) {
    return sendError(res, error);
  }
});

// A phone whose hardware was swapped: same config, new MAC, so a new file name. The
// file is renamed on the PBX (keeping its ownership and permissions) and its history
// and model follow it. A copy stays under the old name so that can be restored too.
app.post("/api/files/:name/replace", authGuard.requireWriter, async (req, res) => {
  try {
    ensureConnected();
    if (bulkJobIsRunning()) {
      return res.status(409).json({ error: "A bulk edit is running. Wait for it to finish." });
    }

    const source = sanitizeFileName(req.params.name);
    const fileName = sanitizeFileName(String(req.body?.fileName || ""));
    if (!PHONE_FILE_PATTERN.test(fileName)) {
      return res.status(400).json({ error: "The new file must be named spa<MAC>.xml so the phone can request it." });
    }
    if (fileName.toLowerCase() === source.toLowerCase()) {
      return res.status(400).json({ error: "The new MAC is the same as the current one." });
    }

    const sourcePath = path.posix.join(pbx.connection.remoteDir, source);
    const targetPath = path.posix.join(pbx.connection.remoteDir, fileName);
    if (!(await pbx.sftp.exists(sourcePath))) {
      return res.status(404).json({ error: `File not found: ${source}` });
    }
    if (await pbx.sftp.exists(targetPath)) {
      return res.status(400).json({ error: `File already exists: ${fileName}` });
    }

    const scope = buildLogScope(pbx.connection);
    const user = req.user ? req.user.username : "";
    const content = await pbx.sftp.get(sourcePath);
    const xmlText = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);
    const entries = xmlToEntries(xmlText).entries;
    const station = findStationDisplayNameInEntries(entries);

    await pbx.sftp.rename(sourcePath, targetPath);

    // History and model follow the phone to its new name...
    const movedVersions = snapshots.move(scope.key, source, fileName);
    const model = getPhoneModel(source);
    if (model) {
      setPhoneModel(fileName, model);
      setPhoneModel(source, null);
    }
    // ...and one copy is left under the old name, so that file can be put back.
    const oldCopy = snapshots.capture({ scopeKey: scope.key, fileName: source, content: xmlText, user, reason: "replace", station });

    deleteFileMetadataCacheEntry(buildCacheKey(source));
    setFileMetadataCacheEntry(buildCacheKey(fileName), {
      size: Buffer.byteLength(xmlText, "utf8"),
      modified: Date.now(),
      stationDisplayName: station,
      extension: findLineExtension(entries) || ""
    });

    const ts = Date.now();
    appendLogEntries(scope, [
      {
        ts,
        action: "replace",
        file: fileName,
        station,
        tag: null,
        before: source,
        after: `${fileName} (same config; ${movedVersions} earlier version${movedVersions === 1 ? "" : "s"} carried over)`,
        status: "changed",
        error: null,
        snapshotId: null
      },
      {
        ts,
        action: "delete",
        file: source,
        station,
        tag: null,
        before: null,
        after: `Removed: replaced by ${fileName}. Restore brings the old file back.`,
        status: "changed",
        error: null,
        snapshotId: oldCopy.id
      }
    ], user);

    return res.json({ ok: true, message: `Replaced ${source} with ${fileName}`, fileName, source, station, movedVersions });
  } catch (error) {
    return sendError(res, error);
  }
});

// Registered ahead of /api/files/:name, which would otherwise swallow "clone" as a file name.
app.post("/api/files/clone", authGuard.requireWriter, async (req, res) => {
  try {
    ensureConnected();

    const source = sanitizeFileName(String(req.body?.source || ""));
    const fileName = sanitizeFileName(String(req.body?.fileName || ""));
    if (!PHONE_FILE_PATTERN.test(fileName)) {
      return res.status(400).json({ error: "The new file must be named spa<MAC>.xml so the phone can request it." });
    }
    if (fileName.toLowerCase() === source.toLowerCase()) {
      return res.status(400).json({ error: "The new file needs a different name from the phone it is cloned from." });
    }

    const sourcePath = path.posix.join(pbx.connection.remoteDir, source);
    const targetPath = path.posix.join(pbx.connection.remoteDir, fileName);
    if (!(await pbx.sftp.exists(sourcePath))) {
      return res.status(404).json({ error: `Source file not found: ${source}` });
    }
    if (await pbx.sftp.exists(targetPath)) {
      return res.status(400).json({ error: `File already exists: ${fileName}` });
    }

    const content = await pbx.sftp.get(sourcePath);
    const { rootKey, entries: sourceEntries } = xmlToEntries(Buffer.isBuffer(content) ? content.toString("utf8") : String(content));

    let entries;
    try {
      entries = buildClonedEntries(sourceEntries, {
        ext: req.body?.ext,
        displayName: req.body?.displayName,
        password: req.body?.password,
        station: req.body?.station
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const xml = entriesToXml(rootKey || "flat-profile", entries);
    await pbx.sftp.put(Buffer.from(xml, "utf8"), targetPath);

    const stationDisplayName = findStationDisplayNameInEntries(entries);
    setFileMetadataCacheEntry(buildCacheKey(fileName), {
      size: Buffer.byteLength(xml, "utf8"),
      modified: Date.now(),
      stationDisplayName,
      extension: findLineExtension(entries) || ""
    });

    appendLogEntries(buildLogScope(pbx.connection), [{
      ts: Date.now(),
      action: "create",
      file: fileName,
      station: stationDisplayName,
      tag: null,
      before: null,
      after: `Cloned from ${source} (${entries.length} field${entries.length === 1 ? "" : "s"}), line 1 = ${String(req.body.ext).trim()}`,
      status: "changed",
      error: null,
      snapshotId: null
    }], req.user ? req.user.username : "");

    // A clone is the same kind of phone as its source unless told otherwise.
    const sourceModel = getPhoneModel(source);
    if (sourceModel) {
      setPhoneModel(fileName, sourceModel);
    }

    return res.json({ ok: true, message: `Created ${fileName} from ${source}`, fileName, source });
  } catch (error) {
    return sendError(res, error);
  }
});

app.post("/api/files/:name", authGuard.requireWriter, async (req, res) => {
  try {
    ensureConnected();

    const fileName = sanitizeFileName(req.params.name);
    const rootKey = String(req.body?.rootKey || "flat-profile").trim() || "flat-profile";
    const entries = normalizeEntries(req.body?.entries || []);

    const xml = entriesToXml(rootKey, entries);
    const remotePath = path.posix.join(pbx.connection.remoteDir, fileName);

    const scope = buildLogScope(pbx.connection);
    const user = req.user ? req.user.username : "";

    // Read the file as it is now. Null means a brand new file.
    let currentXml = null;
    if (await pbx.sftp.exists(remotePath)) {
      const existing = await pbx.sftp.get(remotePath);
      currentXml = Buffer.isBuffer(existing) ? existing.toString("utf8") : String(existing);
    }

    // Refuse to overwrite a change made since the editor loaded the file. Checked
    // before anything is stored so a refused save leaves no trace.
    const expectedVersion = req.body?.expectedVersion ? String(req.body.expectedVersion) : null;
    if (expectedVersion && currentXml !== null && contentVersion(currentXml) !== expectedVersion) {
      const last = lastLoggedWrite(scope, fileName);
      const by = last
        ? ` The last write through this app was by ${last.user || "an unknown user"} at ${new Date(last.ts).toISOString()}.`
        : "";
      return res.status(409).json({
        error: `${fileName} changed on the PBX since you opened it, so your version was not saved.${by} Reload to see the current file.`,
        conflict: true,
        currentVersion: contentVersion(currentXml),
        lastWrite: last
      });
    }

    // Keep the file as it is now. It is what Restore brings back, and it is the
    // "before" side of the field-level diff in the log.
    const snapshot = currentXml === null
      ? null
      : await snapshotBeforeWrite(scope, fileName, remotePath, { user, reason: "save", xmlText: currentXml });
    const previousEntries = snapshot ? xmlToEntries(snapshot.xmlText).entries : null;

    await pbx.sftp.put(Buffer.from(xml, "utf8"), remotePath);

    const stationDisplayName = findStationDisplayNameInEntries(entries);
    setFileMetadataCacheEntry(buildCacheKey(fileName), {
      size: Buffer.byteLength(xml, "utf8"),
      modified: Date.now(),
      stationDisplayName,
      extension: findLineExtension(entries) || ""
    });

    // Identify the phone by its station name as it was before this save, falling back to
    // the new value when the file is new or had no name set.
    const loggedStation = findStationDisplayNameInEntries(previousEntries || []) || stationDisplayName;

    const logEntries = (previousEntries === null
      ? [{
          ts: Date.now(),
          action: "save",
          file: fileName,
          station: loggedStation,
          tag: null,
          before: null,
          after: `${entries.length} field${entries.length === 1 ? "" : "s"} (new file)`,
          status: "changed",
          error: null
        }]
      : buildSaveLogEntries(fileName, diffEntriesForLog(previousEntries, entries), loggedStation)
    ).map((entry) => ({ ...entry, snapshotId: snapshot ? snapshot.id : null }));

    appendLogEntries(scope, logEntries, user);

    res.json({ ok: true, message: `Saved ${fileName}`, fileName, version: contentVersion(xml) });
  } catch (error) {
    sendError(res, error);
  }
});

// --- version history ---------------------------------------------------------
app.get("/api/files/:name/history", (req, res) => {
  try {
    ensureConnected();
    const fileName = sanitizeFileName(req.params.name);
    const scope = buildLogScope(pbx.connection);

    res.json({ fileName, keep: SNAPSHOT_KEEP, versions: snapshots.list(scope.key, fileName) });
  } catch (error) {
    sendError(res, error);
  }
});

// One version in full, plus what restoring it would change on the PBX right now.
app.get("/api/files/:name/history/:id", async (req, res) => {
  try {
    ensureConnected();
    const fileName = sanitizeFileName(req.params.name);
    const scope = buildLogScope(pbx.connection);
    const snapshot = snapshots.read(scope.key, fileName, String(req.params.id || ""));

    if (!snapshot) {
      return res.status(404).json({ error: "No such version exists for this server." });
    }

    const restored = xmlToEntries(snapshot.content);
    const remotePath = path.posix.join(pbx.connection.remoteDir, fileName);
    let current = null;

    if (await pbx.sftp.exists(remotePath)) {
      const content = await pbx.sftp.get(remotePath);
      current = xmlToEntries(Buffer.isBuffer(content) ? content.toString("utf8") : String(content)).entries;
    }

    const { content, ...version } = snapshot;
    res.json({
      fileName,
      version,
      rootKey: restored.rootKey,
      entries: restored.entries,
      xmlText: content,
      currentExists: current !== null,
      diff: current ? diffEntriesForLog(current, restored.entries) : []
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.post("/api/files/:name/restore", authGuard.requireWriter, async (req, res) => {
  try {
    ensureConnected();

    if (bulkJobIsRunning()) {
      return res.status(409).json({ error: "A bulk edit is running. Wait for it to finish." });
    }

    const fileName = sanitizeFileName(req.params.name);
    const snapshotId = String(req.body?.snapshotId || "");
    if (!snapshotId) {
      return res.status(400).json({ error: "snapshotId is required." });
    }

    const result = await restoreSnapshot(fileName, snapshotId, req.user ? req.user.username : "");
    res.json({ ok: true, message: `Restored ${fileName}`, ...result });
  } catch (error) {
    sendError(res, error);
  }
});

// --- registration status -----------------------------------------------------
// The PBX is asked at most every few seconds however often the browser polls.
const REGISTRATION_TTL_MS = 5000;
const registrationCaches = new Map();

async function fetchRegistrations(force = false) {
  const scopeKey = pbx.key;
  const now = Date.now();
  const cached = registrationCaches.get(scopeKey);
  if (!force && cached && now - cached.fetchedAt < REGISTRATION_TTL_MS) {
    return cached;
  }

  const command = pbx.connection.statusCommand;
  const output = await execOverSsh(pbx.sftp.client, command);
  const parsed = parseRegistrations(`${output.stdout}${output.stderr ? `\n${output.stderr}` : ""}`);

  const fresh = {
    scopeKey,
    fetchedAt: now,
    command,
    format: parsed.format,
    exitCode: output.code,
    contacts: parsed.contacts,
    // Raw output only when nothing could be parsed, so the reason is visible.
    output: parsed.format === "unknown" ? `${output.stdout}${output.stderr}`.trim().slice(0, 2000) : ""
  };
  registrationCaches.set(scopeKey, fresh);
  return fresh;
}

app.get("/api/registrations", async (req, res) => {
  try {
    ensureConnected();
    const data = await fetchRegistrations(req.query.refresh === "1");

    // Map every known file to its phone's status via the cached line 1 extension.
    const scope = `${buildCacheScope()}/`;
    const files = {};
    let withExtension = 0;
    let online = 0;
    for (const [key, meta] of fileMetadataCache.entries()) {
      if (!key.startsWith(scope) || !meta || !meta.extension) {
        continue;
      }
      const fileName = key.slice(scope.length);
      const status = statusForExtension(data.contacts, meta.extension);
      files[fileName] = status;
      withExtension += 1;
      if (status.status === "online") {
        online += 1;
      }
    }

    res.json({
      fetchedAt: data.fetchedAt,
      command: data.command,
      format: data.format,
      contacts: Object.keys(data.contacts).length,
      output: data.output,
      summary: { withExtension, online },
      files
    });
  } catch (error) {
    sendError(res, error);
  }
});

// --- resync -----------------------------------------------------------------
app.post("/api/files/:name/resync", authGuard.requireWriter, async (req, res) => {
  try {
    ensureConnected();
    const fileName = sanitizeFileName(req.params.name);
    const result = await resyncPhone(fileName, req.user ? req.user.username : "");

    if (result.status === "skipped") {
      return res.status(400).json({ error: `Cannot resync ${fileName}: ${result.detail}.`, ...result });
    }
    if (result.status === "failed") {
      return res.status(502).json({ error: `Resync failed: ${result.detail}`, ...result });
    }

    const who = result.station ? `${result.station} (${result.ext})` : result.ext;
    return res.json({ ok: true, message: `Resync sent to ${who}`, ...result });
  } catch (error) {
    return sendError(res, error);
  }
});

// Runs the resync command for a typed extension and shows exactly what the PBX said,
// for working out group membership, sudo, or PJSIP-vs-chan_sip problems.
app.post("/api/resync/test", authGuard.requireWriter, async (req, res) => {
  try {
    ensureConnected();
    const ext = String(req.body?.ext || "").trim();
    const template = resolveResyncCommand(req.body?.resyncCommand ?? pbx.connection.resyncCommand);
    const command = buildResyncCommand(template, ext);
    const output = await execOverSsh(pbx.sftp.client, command);
    const verdict = classifyResyncOutput(output);

    return res.json({ ok: verdict.ok, command, code: output.code, stdout: output.stdout, stderr: output.stderr, detail: verdict.detail });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/api/files", authGuard.requireWriter, async (req, res) => {
  try {
    ensureConnected();

    const fileName = sanitizeFileName(req.body?.fileName || "");
    const rootKey = String(req.body?.rootKey || "flat-profile").trim() || "flat-profile";
    const entries = normalizeEntries(req.body?.entries || []);

    const remotePath = path.posix.join(pbx.connection.remoteDir, fileName);
    const exists = await pbx.sftp.exists(remotePath);
    if (exists) {
      return res.status(400).json({ error: `File already exists: ${fileName}` });
    }

    const xml = entriesToXml(rootKey, entries);
    await pbx.sftp.put(Buffer.from(xml, "utf8"), remotePath);

    const stationDisplayName = findStationDisplayNameInEntries(entries);
    setFileMetadataCacheEntry(buildCacheKey(fileName), {
      size: Buffer.byteLength(xml, "utf8"),
      modified: Date.now(),
      stationDisplayName,
      extension: findLineExtension(entries) || ""
    });

    appendLogEntries(buildLogScope(pbx.connection), [{
      ts: Date.now(),
      action: "create",
      file: fileName,
      station: stationDisplayName,
      tag: null,
      before: null,
      after: `${entries.length} field${entries.length === 1 ? "" : "s"}`,
      status: "changed",
      error: null,
      snapshotId: null
    }], req.user ? req.user.username : "");

    res.json({ ok: true, message: `Created ${fileName}`, fileName });
  } catch (error) {
    sendError(res, error);
  }
});

app.delete("/api/connection", authGuard.requireWriter, async (req, res) => {
  const key = pbx.key;
  const link = pbx.link;
  const sid = sessionIdOf(req);

  // This session asked, so it is simply on no PBX afterwards (and is not moved onto
  // another one by itself). Anyone else on the link is told who closed it.
  sessionPbx.set(sid, "");
  if (key) {
    lostLinks.delete(key);
  }
  if (link) {
    req.auditTarget = link.connection.profileName || link.connection.host;
    await closeLink(key, `disconnected by ${req.user ? req.user.username : "another user"}`);
  }
  res.json({ ok: true, connections: describeLinks(null) });
});

// Only boot when run directly, so tests can require the pure helpers below
// without starting a listener.
if (require.main === module) {
  ensureDataStore();
  loadFileMetadataCache();

  let tlsOptions = null;
  try {
    tlsOptions = resolveTlsOptions({ dataDir: DATA_DIR });
  } catch (error) {
    // Failing loudly beats silently falling back to plain HTTP when TLS was asked for.
    console.error(`\n  !! TLS could not be configured: ${error.message}\n`);
    process.exit(1);
  }

  const scheme = tlsOptions ? "https" : "http";
  const server = tlsOptions
    ? require("https").createServer({ key: tlsOptions.key, cert: tlsOptions.cert }, app)
    : require("http").createServer(app);

  server.listen(PORT, () => {
    console.log(`PBX MPP Config Manager running at ${scheme}://localhost:${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);

    if (tlsOptions) {
      console.log(`TLS: on (${tlsOptions.mode}) - ${tlsOptions.detail}`);
      if (tlsOptions.mode === "self-signed") {
        console.log("     Self-signed: fine for a reverse proxy upstream, but browsers "
          + "connecting directly will warn.");
      }
    } else {
      console.log("TLS: off (plain HTTP)");
    }

    // Say so explicitly: a missing template silently yields an empty "Default Template".
    const templatePath = resolveDefaultTemplatePath();
    console.log(templatePath
      ? `Default template: ${templatePath}`
      : "Default template: none found - 'Default Template' will be empty. "
        + "Set DEFAULT_TEMPLATE_PATH or place default-template.xml in the data directory.");

    if (!authGuard.hasUsers()) {
      console.log("Accounts: none yet - open the app to create the first administrator.");
    } else {
      console.log(`Accounts: ${authGuard.loadUsers().length} user(s) configured.`);
    }

    if (authGuard.cookieSecure) {
      console.log("Session cookie: Secure (requires HTTPS end to end - sign-in fails over plain HTTP)");
    } else if (tlsOptions) {
      console.log("Session cookie: not Secure - this app is serving HTTPS, so set COOKIE_SECURE=true");
    } else {
      console.log("Session cookie: not Secure (fine on loopback; set COOKIE_SECURE=true behind HTTPS)");
    }

    if (authGuard.trustProxyAuth) {
      console.warn(
        `\n  !! TRUST_PROXY_AUTH is ON. Anyone who can reach this port directly can\n`
        + `     impersonate any user by sending the '${authGuard.proxyUserHeader}' header.\n`
        + `     Only run this way when a reverse proxy in front strips that header from\n`
        + `     client requests and sets it itself, and the app is not otherwise reachable.\n`
      );
    }
  });
}

module.exports = {
  app,
  applyBulkEdit,
  buildSearchCriteria,
  matchEntries,
  planProvisionRows,
  parseTagList,
  buildTagMatcher,
  compareToBaseline,
  DEFAULT_DRIFT_IGNORE,
  buildClonedEntries,
  entriesToXml,
  extractStationDisplayName,
  findStationDisplayNameInEntries,
  normalizeAttributeOverride,
  normalizeEntries,
  resolveDefaultTemplatePath,
  sanitizeFileName,
  sanitizeServerProfile,
  buildLogScope,
  buildSaveLogEntries,
  diffEntriesForLog,
  isSensitiveTag,
  redactSensitiveEntry,
  xmlToEntries,
  BULK_EDIT_MODES
};
















