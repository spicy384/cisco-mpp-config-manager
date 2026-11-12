const crypto = require("crypto");
const path = require("path");

const { readJsonFile, writeJsonFile } = require("./json-store");

/**
 * SSH host key store using trust-on-first-use, the same model as OpenSSH's
 * known_hosts: the first connection to a host records its key fingerprint, and
 * every later connection must present the same key or it is refused before the
 * password is sent.
 *
 * The store is read strictly: a known-hosts.json that exists but cannot be parsed
 * refuses every connection until it is repaired. Reading it as "nothing known yet"
 * would quietly accept whatever key each host presents next, which is exactly the
 * moment an intercepted connection needs.
 */

class HostKeyStoreError extends Error {
  constructor(cause) {
    super(
      "The remembered SSH host keys (known-hosts.json) cannot be read, so no PBX connection is "
        + `made until that file is repaired or restored: ${cause && cause.message ? cause.message : cause}`
    );
    this.name = "HostKeyStoreError";
    this.code = "HOST_KEY_STORE_UNREADABLE";
    this.status = 503;
  }
}

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

  /** Every remembered key. A missing file is an empty store; an unreadable one throws. */
  function load() {
    let parsed;
    try {
      parsed = readJsonFile(file, {});
    } catch (error) {
      throw new HostKeyStoreError(error);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new HostKeyStoreError(new Error("it does not hold an object keyed by host:port"));
    }
    return parsed;
  }

  // Atomic (json-store.js), so a crash or a full disk mid-write cannot leave a
  // truncated file behind.
  function save(map) {
    writeJsonFile(file, map);
  }

  /** Throws a HostKeyStoreError when the store cannot be read; callers check before dialling. */
  function assertReadable() {
    load();
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
    const outcome = { status: null, fingerprint: null, expected: null, error: null };

    const verifier = (keyBuffer) => {
      const actual = fingerprintOf(keyBuffer);
      outcome.fingerprint = actual;

      // This runs inside the SSH handshake, where a throw would surface as an opaque
      // protocol error. A store that cannot be read or written refuses the key instead,
      // and the caller reports why from the outcome.
      try {
        const map = load();
        const known = Object.prototype.hasOwnProperty.call(map, id) ? map[id] : null;
        const now = new Date().toISOString();

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
      } catch (error) {
        outcome.status = "error";
        outcome.error = error instanceof HostKeyStoreError ? error : new HostKeyStoreError(error);
        return false;
      }
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

  return { file, list, get, forget, verifierFor, mismatchError, assertReadable };
}

module.exports = { createHostKeyStore, fingerprintOf, hostKeyId, HostKeyMismatchError, HostKeyStoreError };
