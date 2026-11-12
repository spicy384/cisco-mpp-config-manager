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
// What is kept of a command's output, per stream. Anything a resync or status command
// has to say fits many times over; a command that prints without end must not be able
// to fill the app's memory.
const MAX_EXEC_OUTPUT_BYTES = 64 * 1024;

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

/** Collects a stream's output up to a limit, then keeps reading (so the command is not stalled) but drops the rest. */
function boundedCollector(maxBytes) {
  const chunks = [];
  let kept = 0;
  let truncated = false;
  return {
    add(chunk) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), "utf8");
      const room = maxBytes - kept;
      if (room <= 0) {
        truncated = truncated || buffer.length > 0;
        return;
      }
      if (buffer.length > room) {
        chunks.push(buffer.subarray(0, room));
        kept += room;
        truncated = true;
        return;
      }
      chunks.push(buffer);
      kept += buffer.length;
    },
    text() {
      return Buffer.concat(chunks).toString("utf8");
    },
    get truncated() {
      return truncated;
    }
  };
}

/**
 * Runs one command on the PBX over an ssh2 client and collects what it printed, up to
 * `maxOutputBytes` per stream. On a timeout the channel is closed, so a command that
 * hangs does not keep a session open on the PBX for the life of the connection.
 */
function execOverSsh(sshClient, command, { timeoutMs = EXEC_TIMEOUT_MS, maxOutputBytes = MAX_EXEC_OUTPUT_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let channel = null;
    const closeChannel = () => {
      if (!channel) {
        return;
      }
      try {
        if (typeof channel.close === "function") {
          channel.close();
        } else if (typeof channel.destroy === "function") {
          channel.destroy();
        }
      } catch {
        // Already gone.
      }
    };
    const finish = (fn, value) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        fn(value);
      }
    };
    const timer = setTimeout(
      () => {
        finish(reject, new Error(`The PBX did not finish the resync command within ${Math.round(timeoutMs / 1000)}s.`));
        closeChannel();
      },
      timeoutMs
    );

    sshClient.exec(command, (error, stream) => {
      if (error) {
        return finish(reject, error);
      }

      channel = stream;
      // The channel opened only after the wait ran out: nobody is listening any more.
      if (settled) {
        closeChannel();
        return undefined;
      }

      const stdout = boundedCollector(maxOutputBytes);
      const stderr = boundedCollector(maxOutputBytes);
      let code = null;

      stream.on("data", (chunk) => { stdout.add(chunk); });
      stream.stderr.on("data", (chunk) => { stderr.add(chunk); });
      stream.on("exit", (exitCode) => { code = exitCode; });
      stream.on("close", (closeCode) => {
        finish(resolve, {
          code: code == null ? closeCode : code,
          stdout: stdout.text(),
          stderr: stderr.text(),
          truncated: stdout.truncated || stderr.truncated
        });
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
  MAX_EXEC_OUTPUT_BYTES,
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
