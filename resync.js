/**
 * Telling a phone to fetch its configuration. Cisco MPP phones re-provision when
 * they receive a SIP NOTIFY with Event: check-sync, which Asterisk sends with
 *
 *   asterisk -rx "pjsip send notify cisco-check-cfg endpoint 1001"
 *
 * That runs on the PBX over the SSH connection the app already holds. The
 * command is a per-server template so a PBX on chan_sip, or one where the SSH
 * user needs sudo, can still be driven.
 */

const DEFAULT_RESYNC_COMMAND = 'asterisk -rx "pjsip send notify cisco-check-cfg endpoint {ext}"';
// What an earlier release stored in profiles saved with a blank template. It named a
// NOTIFY type Asterisk does not ship, so it is treated as "use the default".
const LEGACY_DEFAULT_RESYNC_COMMAND = 'asterisk -rx "pjsip send notify cisco-check-sync endpoint {ext}"';
const EXEC_TIMEOUT_MS = 20000;

// The extension is the only thing interpolated into a shell command, so it is
// held to characters that can never break out of the quoting around it.
const EXT_PATTERN = /^[0-9A-Za-z_.-]{1,64}$/;

// Asterisk exits 0 even when the CLI command itself failed, so success has to be
// judged from what it printed.
const FAILURE_OUTPUT = /unable|no such|not found|error|failed|invalid|denied|cannot|refused/i;

/**
 * Checks a template and returns it, or "" when blank so callers can tell "use the
 * default" apart from a command someone typed. Resolve with `resolveResyncCommand`.
 */
function validateResyncCommand(template) {
  const command = String(template == null ? "" : template).trim();
  if (!command || command === LEGACY_DEFAULT_RESYNC_COMMAND) {
    return "";
  }
  if (command.length > 500) {
    throw new Error("Resync command is too long.");
  }
  if (/[\r\n]/.test(command)) {
    throw new Error("Resync command must be a single line.");
  }
  if (!command.includes("{ext}")) {
    throw new Error("Resync command must contain {ext}, which is replaced with the phone's extension.");
  }
  return command;
}

function resolveResyncCommand(template) {
  return validateResyncCommand(template) || DEFAULT_RESYNC_COMMAND;
}

function isValidExtension(ext) {
  return EXT_PATTERN.test(String(ext == null ? "" : ext));
}

function buildResyncCommand(template, ext) {
  const command = resolveResyncCommand(template);
  const extension = String(ext == null ? "" : ext).trim();
  if (!isValidExtension(extension)) {
    throw new Error(`Extension "${extension}" contains characters that cannot be sent to the PBX.`);
  }
  return command.split("{ext}").join(extension);
}

/** The extension registered on line 1, which is what Asterisk knows the phone as. */
function findLineExtension(entries, line = 1) {
  const list = Array.isArray(entries) ? entries : [];
  const enabled = list.find((e) => e && e.key === `Extension_${line}_`);
  if (enabled && /^disabled$/i.test(String(enabled.value || "").trim())) {
    return null;
  }
  const userId = list.find((e) => e && e.key === `User_ID_${line}_`);
  const ext = userId ? String(userId.value == null ? "" : userId.value).trim() : "";
  return ext || null;
}

function classifyResyncOutput({ code, stdout = "", stderr = "" }) {
  const out = `${stdout}`.trim();
  const err = `${stderr}`.trim();
  const combined = [out, err].filter(Boolean).join("\n");

  if (code !== 0 && code !== null && code !== undefined) {
    return { ok: false, detail: combined || `command exited with status ${code}` };
  }
  if (err) {
    return { ok: false, detail: combined };
  }
  if (FAILURE_OUTPUT.test(out)) {
    return { ok: false, detail: out };
  }
  return { ok: true, detail: out };
}

/** Runs one command on the PBX over an ssh2 client and collects what it printed. */
function execOverSsh(sshClient, command, { timeoutMs = EXEC_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        fn(value);
      }
    };
    const timer = setTimeout(
      () => finish(reject, new Error(`The PBX did not finish the resync command within ${Math.round(timeoutMs / 1000)}s.`)),
      timeoutMs
    );

    sshClient.exec(command, (error, stream) => {
      if (error) {
        return finish(reject, error);
      }

      let stdout = "";
      let stderr = "";
      let code = null;

      stream.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
      stream.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
      stream.on("exit", (exitCode) => { code = exitCode; });
      stream.on("close", (closeCode) => {
        finish(resolve, { code: code == null ? closeCode : code, stdout, stderr });
      });
      stream.on("error", (streamError) => finish(reject, streamError));
      return undefined;
    });
  });
}

/**
 * Sends a resync for one extension. Never throws for a PBX-side failure: the
 * caller records it against the phone so a bulk run continues with the rest.
 */
async function sendResync(sshClient, template, ext) {
  if (!ext) {
    return { status: "skipped", ext: null, detail: "no extension on line 1" };
  }

  let command;
  try {
    command = buildResyncCommand(template, ext);
  } catch (error) {
    return { status: "failed", ext: String(ext), detail: error.message };
  }

  try {
    const result = classifyResyncOutput(await execOverSsh(sshClient, command));
    return {
      status: result.ok ? "sent" : "failed",
      ext: String(ext),
      detail: result.detail,
      command
    };
  } catch (error) {
    return { status: "failed", ext: String(ext), detail: error.message, command };
  }
}

module.exports = {
  DEFAULT_RESYNC_COMMAND,
  LEGACY_DEFAULT_RESYNC_COMMAND,
  EXT_PATTERN,
  validateResyncCommand,
  resolveResyncCommand,
  isValidExtension,
  buildResyncCommand,
  findLineExtension,
  classifyResyncOutput,
  execOverSsh,
  sendResync
};
