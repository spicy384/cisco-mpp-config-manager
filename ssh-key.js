const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { utils } = require("ssh2");

/**
 * The app's own SSH key, for signing in to a PBX without anyone typing its password.
 *
 * The private key stays on the server: it is generated into <dataDir>/ssh/ (or read
 * from SSH_KEY_FILE when one is supplied) and never sent to a browser. Only the
 * public half is shown, to be installed in authorized_keys on the PBX.
 */

const KEY_COMMENT = "pbx-mpp-config-manager";

function describeKey(privateText) {
  const parsed = utils.parseKey(privateText);
  if (parsed instanceof Error) {
    throw new Error(`The SSH private key could not be read: ${parsed.message}`);
  }
  const key = Array.isArray(parsed) ? parsed[0] : parsed;
  const blob = key.getPublicSSH();
  const digest = crypto.createHash("sha256").update(blob).digest("base64").replace(/=+$/, "");
  return {
    type: key.type,
    publicKey: `${key.type} ${blob.toString("base64")} ${key.comment || KEY_COMMENT}`,
    // Same form as `ssh-keygen -lf`, so it can be compared on the PBX.
    fingerprint: `SHA256:${digest}`
  };
}

function createSshKeyStore({ dataDir, suppliedPath = process.env.SSH_KEY_FILE || "" }) {
  const dir = path.join(dataDir, "ssh");
  const generatedPath = path.join(dir, "id_ed25519");
  const supplied = String(suppliedPath || "").trim();

  function privatePath() {
    return supplied || generatedPath;
  }

  /** The private key for a connection, or null when there is none. */
  function privateKey() {
    try {
      return fs.readFileSync(privatePath(), "utf8");
    } catch {
      return null;
    }
  }

  /** What may be shown to users: never the private key. */
  function info() {
    const text = privateKey();
    if (!text) {
      return { exists: false, source: supplied ? "supplied" : "generated", problem: supplied ? `SSH_KEY_FILE (${supplied}) could not be read.` : null };
    }
    try {
      const stat = fs.statSync(privatePath());
      return { exists: true, source: supplied ? "supplied" : "generated", createdAt: stat.mtimeMs, ...describeKey(text) };
    } catch (error) {
      return { exists: false, source: supplied ? "supplied" : "generated", problem: error.message };
    }
  }

  /** Makes a new ed25519 key. Refuses to replace one unless told to: that locks the app out of every PBX using it. */
  function generate({ replace = false } = {}) {
    if (supplied) {
      throw new Error("The SSH key is supplied through SSH_KEY_FILE, so the app does not manage it.");
    }
    if (fs.existsSync(generatedPath) && !replace) {
      throw new Error("An SSH key already exists. Replacing it stops key sign-in on every PBX until the new public key is installed.");
    }

    const pair = utils.generateKeyPairSync("ed25519", { comment: KEY_COMMENT });
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(generatedPath, pair.private, { encoding: "utf8", mode: 0o600 });
    fs.writeFileSync(`${generatedPath}.pub`, `${pair.public}\n`, "utf8");
    return info();
  }

  function remove() {
    if (supplied) {
      throw new Error("The SSH key is supplied through SSH_KEY_FILE, so the app does not manage it.");
    }
    const existed = fs.existsSync(generatedPath);
    fs.rmSync(generatedPath, { force: true });
    fs.rmSync(`${generatedPath}.pub`, { force: true });
    return existed;
  }

  return { dir, info, privateKey, generate, remove, supplied: Boolean(supplied) };
}

module.exports = { createSshKeyStore, describeKey, KEY_COMMENT };
