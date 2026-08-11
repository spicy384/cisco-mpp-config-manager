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

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text"
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  format: true,
  suppressEmptyNode: false
});

let sftp = null;
let connection = null;
const fileMetadataCache = new Map();

function buildCacheScope() {
  if (connection?.profileId) {
    return `profile:${connection.profileId}`;
  }

  return `host:${connection?.host || ""}|dir:${connection?.remoteDir || ""}`;
}

function buildCacheKey(fileName) {
  return `${buildCacheScope()}/${fileName}`;
}
function ensureConnected() {
  if (!sftp || !connection) {
    throw new Error("Not connected. Use the Connect button first.");
  }
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

function appendLogEntries(scope, entries) {
  if (!scope || !Array.isArray(entries) || entries.length === 0) {
    return;
  }

  const log = loadChangeLog();
  const existing = log[scope.key];
  const bucket = existing && Array.isArray(existing.entries) ? existing : { entries: [] };

  // Refresh the label each time so renaming a profile updates the log viewer.
  bucket.label = scope.label;
  bucket.host = scope.host;
  bucket.remoteDir = scope.remoteDir;
  bucket.profileId = scope.profileId;
  bucket.entries = [...bucket.entries, ...entries].slice(-MAX_LOG_ENTRIES_PER_SCOPE);

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

  if (!name || !host || !username || !remoteDir) {
    throw new Error("name, host, username, and remoteDir are required.");
  }

  return {
    id: String(input?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    name,
    host,
    port,
    username,
    remoteDir
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
let activeBulkJobId = null;
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
    finishedAt: job.finishedAt || null
  };
}

async function runBulkJob(job) {
  const { fileNames, key, value, attributes, mode, dryRun, scope, remoteDir } = job.request;

  for (const fileName of fileNames) {
    job.currentFile = fileName;
    const remotePath = path.posix.join(remoteDir, fileName);

    try {
      const content = await sftp.get(remotePath);
      const xmlText = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);
      const { rootKey, entries } = xmlToEntries(xmlText);

      // Identifies the phone in results and logs; file names are MAC addresses.
      const station = findStationDisplayNameInEntries(entries);
      const edit = applyBulkEdit(entries, { key, value, attributes, mode });

      if (edit.matched === 0 && mode !== "set") {
        job.results.push({ name: fileName, station, status: "missing", matched: 0, previousValues: [] });
        continue;
      }

      // Compare rebuilt-vs-rebuilt so a no-op edit never rewrites (and reformats) a file.
      const currentXml = entriesToXml(rootKey, entries);
      const nextXml = entriesToXml(rootKey, edit.entries);

      if (currentXml === nextXml) {
        job.results.push({
          name: fileName,
          station,
          status: "unchanged",
          matched: edit.matched,
          previousValues: edit.previousValues
        });
        continue;
      }

      if (!dryRun) {
        await sftp.put(Buffer.from(nextXml, "utf8"), remotePath);
        setFileMetadataCacheEntry(buildCacheKey(fileName), {
          size: Buffer.byteLength(nextXml, "utf8"),
          modified: Date.now(),
          stationDisplayName: findStationDisplayNameInEntries(edit.entries)
        });
      }

      job.results.push({
        name: fileName,
        station,
        status: "changed",
        matched: edit.matched,
        previousValues: edit.previousValues,
        newValue: mode === "delete" ? null : value
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

  // Only real writes are auditable events; a preview changed nothing.
  if (!dryRun) {
    const logEntries = job.results
      .filter((item) => item.status === "changed" || item.status === "error")
      .map((item) => ({
        ts: Date.now(),
        action: mode === "delete" ? "bulk-delete" : "bulk-set",
        file: item.name,
        station: item.station || "",
        tag: key,
        before: (item.previousValues || []).join(", "),
        after: item.status === "error" ? null : (mode === "delete" ? null : value),
        status: item.status,
        error: item.error || null
      }));

    appendLogEntries(scope, logEntries);
  }
}

app.post("/api/bulk-edit", (req, res) => {
  try {
    ensureConnected();
    pruneBulkJobs();

    const running = activeBulkJobId && bulkJobs.get(activeBulkJobId);
    if (running && running.status === "running") {
      return res.status(409).json({ error: "A bulk edit is already running. Wait for it to finish." });
    }

    const { key, value, attributes, mode, dryRun } = req.body || {};
    const targetKey = String(key || "").trim();
    const editMode = String(mode || "set");

    if (!targetKey) {
      return res.status(400).json({ error: "Tag name is required." });
    }

    if (!BULK_EDIT_MODES.has(editMode)) {
      return res.status(400).json({ error: `Unknown mode: ${editMode}` });
    }

    if (!Array.isArray(req.body?.fileNames) || req.body.fileNames.length === 0) {
      return res.status(400).json({ error: "Select at least one file." });
    }

    const fileNames = req.body.fileNames.map((name) => sanitizeFileName(name));
    const attributeOverride = normalizeAttributeOverride(attributes);
    const newValue = editMode === "delete" ? "" : (value == null ? "" : String(value));
    const isDryRun = dryRun !== false;

    const job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "running",
      dryRun: isDryRun,
      key: targetKey,
      mode: editMode,
      total: fileNames.length,
      processed: 0,
      currentFile: null,
      results: [],
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
      request: {
        fileNames,
        key: targetKey,
        value: newValue,
        attributes: attributeOverride,
        mode: editMode,
        dryRun: isDryRun,
        remoteDir: connection.remoteDir,
        scope: buildLogScope(connection)
      }
    };

    bulkJobs.set(job.id, job);
    activeBulkJobId = job.id;

    // Kick off in the background; the client polls /api/bulk-edit/:jobId for progress.
    runBulkJob(job)
      .then(() => {
        job.status = "done";
      })
      .catch((error) => {
        job.status = "failed";
        job.error = error.message;
      })
      .finally(() => {
        job.finishedAt = Date.now();
        if (activeBulkJobId === job.id) {
          activeBulkJobId = null;
        }
      });

    return res.status(202).json({ jobId: job.id, total: job.total, dryRun: isDryRun });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

  const current = buildLogScope(connection);
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

app.delete("/api/logs/:scopeKey", (req, res) => {
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

app.post("/api/servers", (req, res) => {
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

app.delete("/api/servers/:id", (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) {
    return res.status(400).json({ error: "Server id is required." });
  }

  const servers = loadServers();
  const next = servers.filter((s) => s.id !== id);
  saveServers(next);
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

app.post("/api/templates", (req, res) => {
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

  if (!password) {
    return res.status(400).json({ error: "password is required." });
  }

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
      remoteDir: String(remoteDir)
    };
  }

  if (sftp) {
    try {
      await sftp.end();
    } catch (_) {
      // Ignore close errors when re-connecting.
    }
  }

  const client = new SftpClient();

  try {
    await client.connect({
      host: target.host,
      port: Number(target.port) || 22,
      username: target.username,
      password,
      readyTimeout: 15000
    });

    const exists = await client.exists(target.remoteDir);
    if (!exists) {
      await client.end();
      return res.status(400).json({ error: `Remote directory does not exist: ${target.remoteDir}` });
    }

    sftp = client;
    connection = {
      host: target.host,
      port: Number(target.port) || 22,
      username: target.username,
      remoteDir: target.remoteDir,
      profileId: target.id || null,
      profileName: target.name || null
    };

    return res.json({
      ok: true,
      message: `Connected to ${target.host}`,
      connection
    });
  } catch (error) {
    try {
      await client.end();
    } catch (_) {
      // Ignore close errors.
    }

    return res.status(500).json({ error: error.message || "Connection failed." });
  }
});

app.get("/api/status", (req, res) => {
  res.json({ connected: Boolean(connection), connection });
});

app.get("/api/files", async (req, res) => {
  try {
    ensureConnected();

    const remoteList = await sftp.list(connection.remoteDir);
    const xmlFiles = remoteList
      .filter((item) => item.type !== "d" && /^spa.*\.xml$/i.test(item.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    const files = [];
    for (const item of xmlFiles) {
      const cacheKey = buildCacheKey(item.name);
      const cached = fileMetadataCache.get(cacheKey);

      if (cached && cached.size === item.size && cached.modified === item.modifyTime) {
        files.push({
          name: item.name,
          size: item.size,
          modified: item.modifyTime,
          stationDisplayName: cached.stationDisplayName || ""
        });
        continue;
      }

      const remotePath = path.posix.join(connection.remoteDir, item.name);
      let stationDisplayName = "";

      try {
        const content = await sftp.get(remotePath);
        const xmlText = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);
        stationDisplayName = extractStationDisplayName(xmlText);
      } catch (_) {
        stationDisplayName = "";
      }

      setFileMetadataCacheEntry(cacheKey, {
        size: item.size,
        modified: item.modifyTime,
        stationDisplayName
      });

      files.push({
        name: item.name,
        size: item.size,
        modified: item.modifyTime,
        stationDisplayName
      });
    }

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/files/:name", async (req, res) => {
  try {
    ensureConnected();

    const fileName = sanitizeFileName(req.params.name);
    const remotePath = path.posix.join(connection.remoteDir, fileName);

    const content = await sftp.get(remotePath);
    const xmlText = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);

    const { rootKey, entries } = xmlToEntries(xmlText);

    res.json({ fileName, rootKey, entries, xmlText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/files/:name", async (req, res) => {
  try {
    ensureConnected();

    const fileName = sanitizeFileName(req.params.name);
    const rootKey = String(req.body?.rootKey || "flat-profile").trim() || "flat-profile";
    const entries = normalizeEntries(req.body?.entries || []);

    const xml = entriesToXml(rootKey, entries);
    const remotePath = path.posix.join(connection.remoteDir, fileName);

    // Read the current version first so the log can record a real field-level diff.
    // A failure here (e.g. the file does not exist yet) must not block the save.
    let previousEntries = null;
    try {
      const existing = await sftp.get(remotePath);
      const existingXml = Buffer.isBuffer(existing) ? existing.toString("utf8") : String(existing);
      previousEntries = xmlToEntries(existingXml).entries;
    } catch {
      previousEntries = null;
    }

    await sftp.put(Buffer.from(xml, "utf8"), remotePath);

    const stationDisplayName = findStationDisplayNameInEntries(entries);
    setFileMetadataCacheEntry(buildCacheKey(fileName), {
      size: Buffer.byteLength(xml, "utf8"),
      modified: Date.now(),
      stationDisplayName
    });

    // Identify the phone by its station name as it was before this save, falling back to
    // the new value when the file could not be read or had no name set.
    const loggedStation = findStationDisplayNameInEntries(previousEntries || []) || stationDisplayName;

    const logEntries = previousEntries === null
      ? [{
          ts: Date.now(),
          action: "save",
          file: fileName,
          station: loggedStation,
          tag: null,
          before: null,
          after: `${entries.length} field${entries.length === 1 ? "" : "s"} (previous version unavailable)`,
          status: "changed",
          error: null
        }]
      : buildSaveLogEntries(fileName, diffEntriesForLog(previousEntries, entries), loggedStation);

    appendLogEntries(buildLogScope(connection), logEntries);

    res.json({ ok: true, message: `Saved ${fileName}`, fileName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/files", async (req, res) => {
  try {
    ensureConnected();

    const fileName = sanitizeFileName(req.body?.fileName || "");
    const rootKey = String(req.body?.rootKey || "flat-profile").trim() || "flat-profile";
    const entries = normalizeEntries(req.body?.entries || []);

    const remotePath = path.posix.join(connection.remoteDir, fileName);
    const exists = await sftp.exists(remotePath);
    if (exists) {
      return res.status(400).json({ error: `File already exists: ${fileName}` });
    }

    const xml = entriesToXml(rootKey, entries);
    await sftp.put(Buffer.from(xml, "utf8"), remotePath);

    const stationDisplayName = findStationDisplayNameInEntries(entries);
    setFileMetadataCacheEntry(buildCacheKey(fileName), {
      size: Buffer.byteLength(xml, "utf8"),
      modified: Date.now(),
      stationDisplayName
    });

    appendLogEntries(buildLogScope(connection), [{
      ts: Date.now(),
      action: "create",
      file: fileName,
      station: stationDisplayName,
      tag: null,
      before: null,
      after: `${entries.length} field${entries.length === 1 ? "" : "s"}`,
      status: "changed",
      error: null
    }]);

    res.json({ ok: true, message: `Created ${fileName}`, fileName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/connection", async (req, res) => {
  if (!sftp) {
    connection = null;
    return res.json({ ok: true });
  }

  try {
    await sftp.end();
  } catch (_) {
    // Ignore close errors.
  }

  sftp = null;
  connection = null;
  res.json({ ok: true });
});

// Only boot when run directly, so tests can require the pure helpers below
// without starting a listener.
if (require.main === module) {
  ensureDataStore();
  loadFileMetadataCache();

  app.listen(PORT, () => {
    console.log(`PBX MPP Config Manager running at http://localhost:${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);

    // Say so explicitly: a missing template silently yields an empty "Default Template".
    const templatePath = resolveDefaultTemplatePath();
    console.log(templatePath
      ? `Default template: ${templatePath}`
      : "Default template: none found - 'Default Template' will be empty. "
        + "Set DEFAULT_TEMPLATE_PATH or place default-template.xml in the data directory.");
  });
}

module.exports = {
  app,
  applyBulkEdit,
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
  xmlToEntries,
  BULK_EDIT_MODES
};
















