const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * Keeps a copy of every phone config as it was just before this app overwrote it,
 * so any change made here can be undone. Copies are stored per PBX (by change-log
 * scope key) and per file, newest last, pruned to `keep` versions per file:
 *
 *   <dataDir>/snapshots/<scope>/<file>.xml/index.json   what is kept, in order
 *   <dataDir>/snapshots/<scope>/<file>.xml/<id>.xml     the exact bytes read from the PBX
 */

const DEFAULT_KEEP = 20;
const ID_PATTERN = /^\d+-[0-9a-f]{6}$/;

/** Scope keys contain ':' '|' and '/', none of which can be directory names on every OS. */
function scopeDirName(scopeKey) {
  const key = String(scopeKey);
  const slug = key.replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "scope";
  const hash = crypto.createHash("sha1").update(key).digest("hex").slice(0, 8);
  return `${slug}-${hash}`;
}

function assertSafeFileName(fileName) {
  const name = String(fileName || "");
  if (!name || name === "." || name === ".." || /[/\\]/.test(name)) {
    throw new Error("Invalid file name.");
  }
  return name;
}

function createSnapshotStore({ dataDir, keep = DEFAULT_KEEP }) {
  const root = path.join(dataDir, "snapshots");
  const limit = Number.isInteger(keep) && keep > 0 ? keep : DEFAULT_KEEP;

  function fileDir(scopeKey, fileName) {
    return path.join(root, scopeDirName(scopeKey), assertSafeFileName(fileName));
  }

  function readIndex(dir) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeIndex(dir, index) {
    fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(index, null, 2), "utf8");
  }

  /**
   * Stores `content` as the latest version of a file. Throws on any failure: the
   * caller must not go ahead with a write that could not be made undoable.
   */
  function capture({ scopeKey, fileName, content, user = "", reason = "save", station = "" }) {
    const dir = fileDir(scopeKey, fileName);
    fs.mkdirSync(dir, { recursive: true });

    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(String(content), "utf8");
    const ts = Date.now();
    const id = `${ts}-${crypto.randomBytes(3).toString("hex")}`;
    const entry = {
      id,
      ts,
      user: String(user || ""),
      reason: String(reason || "save"),
      station: String(station || ""),
      size: buffer.length,
      sha256: crypto.createHash("sha256").update(buffer).digest("hex")
    };

    const contentPath = path.join(dir, `${id}.xml`);
    fs.writeFileSync(contentPath, buffer);

    try {
      const index = [...readIndex(dir), entry];
      const dropped = index.splice(0, Math.max(0, index.length - limit));
      writeIndex(dir, index);

      for (const old of dropped) {
        try {
          fs.unlinkSync(path.join(dir, `${old.id}.xml`));
        } catch {
          // Already gone; nothing to prune.
        }
      }
    } catch (error) {
      // Do not leave an unindexed copy behind.
      try {
        fs.unlinkSync(contentPath);
      } catch {
        // Nothing more to do.
      }
      throw error;
    }

    return entry;
  }

  /** Versions of one file, newest first. */
  function list(scopeKey, fileName) {
    return readIndex(fileDir(scopeKey, fileName)).slice().reverse();
  }

  /** One version with its content, or null if this server has no such version. */
  function read(scopeKey, fileName, id) {
    if (!ID_PATTERN.test(String(id || ""))) {
      return null;
    }

    const dir = fileDir(scopeKey, fileName);
    const entry = readIndex(dir).find((item) => item.id === id);
    if (!entry) {
      return null;
    }

    try {
      return { ...entry, content: fs.readFileSync(path.join(dir, `${id}.xml`), "utf8") };
    } catch {
      return null;
    }
  }

  return { root, keep: limit, capture, list, read };
}

module.exports = { createSnapshotStore, scopeDirName, DEFAULT_KEEP };
