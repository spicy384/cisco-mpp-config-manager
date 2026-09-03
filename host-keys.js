const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * SSH host key store using trust-on-first-use, the same model as OpenSSH's
 * known_hosts: the first connection to a host records its key fingerprint, and
 * every later connection must present the same key or it is refused before the
 * password is sent.
 */

class HostKeyMismatchError extends Error {
  constructor({ host, port, expected, actual }) {
    super(
      `Host key for ${host}:${port} has changed. This happens if the PBX was rebuilt, ` +
        "or if something is intercepting the connection. An administrator can forget the " +
        "stored key if the change is expected."
    );
    this.name = "HostKeyMismatchError";
    this.code = "HOST_KEY_MISMATCH";
    this.host = host;
    this.port = port;
    this.expected = expected;
    this.actual = actual;
  }
}

/** Same format as `ssh-keygen -lf`, so fingerprints can be compared against the PBX. */
function fingerprintOf(keyBuffer) {
  const digest = crypto.createHash("sha256").update(keyBuffer).digest("base64");
  return `SHA256:${digest.replace(/=+$/, "")}`;
}

function hostKeyId(host, port) {
  return `${String(host || "").trim().toLowerCase()}:${Number(port) || 22}`;
}

function createHostKeyStore({ dataDir }) {
  const file = path.join(dataDir, "known-hosts.json");

  function load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function save(map) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(map, null, 2), "utf8");
  }

  function list() {
    return Object.entries(load()).map(([id, record]) => ({ id, ...record }));
  }

  function get(host, port) {
    return load()[hostKeyId(host, port)] || null;
  }

  function forget(host, port) {
    const map = load();
    const id = hostKeyId(host, port);
    const existed = Boolean(map[id]);
    delete map[id];
    save(map);
    return existed;
  }

  /**
   * Builds the `hostVerifier` for one ssh2 connection. `outcome` is filled in during
   * the handshake so the caller can tell a first connection from a known one, or
   * raise a HostKeyMismatchError when ssh2 reports the failed verification.
   */
  function verifierFor(host, port) {
    const id = hostKeyId(host, port);
    const outcome = { status: null, fingerprint: null, expected: null };

    const verifier = (keyBuffer) => {
      const actual = fingerprintOf(keyBuffer);
      const map = load();
      const known = map[id];
      const now = new Date().toISOString();
      outcome.fingerprint = actual;

      if (!known) {
        map[id] = { fingerprint: actual, firstSeen: now, lastSeen: now };
        save(map);
        outcome.status = "new";
        return true;
      }

      if (known.fingerprint === actual) {
        map[id] = { ...known, lastSeen: now };
        save(map);
        outcome.status = "known";
        return true;
      }

      outcome.status = "mismatch";
      outcome.expected = known.fingerprint;
      return false;
    };

    return { verifier, outcome };
  }

  function mismatchError(host, port, outcome) {
    return new HostKeyMismatchError({
      host,
      port: Number(port) || 22,
      expected: outcome.expected,
      actual: outcome.fingerprint
    });
  }

  return { file, list, get, forget, verifierFor, mismatchError };
}

module.exports = { createHostKeyStore, fingerprintOf, hostKeyId, HostKeyMismatchError };
