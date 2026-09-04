/**
 * Which phones are actually registered, read from the PBX over SSH:
 *
 *   asterisk -rx "pjsip show contacts"      (PJSIP, the default)
 *   asterisk -rx "sip show peers"           (chan_sip)
 *
 * Both outputs are parsed into one shape keyed by extension. A file's line 1
 * extension then says whether that phone is online, from which address.
 */

const DEFAULT_STATUS_COMMAND = 'asterisk -rx "pjsip show contacts"';

// online: registered and answering qualify (or not qualified at all).
// unreachable: registered but not answering qualify.
// unknown: Asterisk has a contact but no verdict yet.
// unregistered: no contact at all (filled in by the caller for extensions it knows).
const STATUS = { online: "online", unreachable: "unreachable", unknown: "unknown", unregistered: "unregistered" };

function validateStatusCommand(template) {
  const command = String(template == null ? "" : template).trim();
  if (!command) {
    return "";
  }
  if (command.length > 500) {
    throw new Error("Registration status command is too long.");
  }
  if (/[\r\n]/.test(command)) {
    throw new Error("Registration status command must be a single line.");
  }
  return command;
}

function resolveStatusCommand(template) {
  return validateStatusCommand(template) || DEFAULT_STATUS_COMMAND;
}

function hostFromUri(uri) {
  const text = String(uri || "");
  // Bracketed IPv6 first, since its colons would otherwise read as the port separator.
  const m = text.match(/@\[([^\]]+)\](?::(\d+))?/) || text.match(/@([^:;>\s]+)(?::(\d+))?/);
  return m ? { ip: m[1], port: m[2] ? Number(m[2]) : null } : { ip: "", port: null };
}

function parsePjsipContacts(output) {
  const contacts = {};
  const line = /^\s*Contact:\s+(\S+?)\/(\S+)\s+(\S+)\s+(\w+)\s+(\S+)\s*$/;

  for (const raw of String(output || "").split(/\r?\n/)) {
    const m = raw.match(line);
    if (!m || m[1] === "<Aor") {
      continue;
    }
    const [, aor, uri, , state, rttText] = m;
    const rtt = Number(rttText);
    const status = /^(Avail|NonQual)$/i.test(state)
      ? STATUS.online
      : (/^Unavail$/i.test(state) ? STATUS.unreachable : STATUS.unknown);
    const { ip, port } = hostFromUri(uri);

    // A phone with two contacts (rare) is online if any of them is.
    const existing = contacts[aor];
    if (existing && existing.status === STATUS.online && status !== STATUS.online) {
      continue;
    }
    contacts[aor] = { ext: aor, status, state, ip, port, rtt: Number.isFinite(rtt) ? rtt : null, uri };
  }

  return contacts;
}

function parseSipPeers(output) {
  const contacts = {};
  // Name/username  Host  Dyn  Forcerport  Comedia  ACL  Port  Status  Description
  const line = /^(\S+?)(?:\/\S+)?\s+(\S+)\s.*?\s(\d+)\s+(OK|UNREACHABLE|UNKNOWN|Unmonitored|LAGGED)\b(?:\s*\(([\d.]+) ms\))?/;

  for (const raw of String(output || "").split(/\r?\n/)) {
    if (/^Name\/username/i.test(raw) || /sip peers \[/i.test(raw)) {
      continue;
    }
    const m = raw.match(line);
    if (!m) {
      continue;
    }
    const [, name, host, portText, state, rttText] = m;
    const unspecified = /unspecified/i.test(host);
    const status = unspecified
      ? STATUS.unregistered
      : (/^(OK|Unmonitored|LAGGED)$/.test(state) ? STATUS.online : (state === "UNREACHABLE" ? STATUS.unreachable : STATUS.unknown));
    contacts[name] = {
      ext: name,
      status,
      state,
      ip: unspecified ? "" : host,
      port: Number(portText) || null,
      rtt: rttText ? Number(rttText) : null,
      uri: ""
    };
  }

  return contacts;
}

/** Picks the parser by what the output looks like. */
function parseRegistrations(output) {
  const text = String(output || "");
  if (/^\s*Contact:/m.test(text)) {
    return { format: "pjsip", contacts: parsePjsipContacts(text) };
  }
  if (/^Name\/username/m.test(text)) {
    return { format: "chan_sip", contacts: parseSipPeers(text) };
  }
  return { format: "unknown", contacts: {} };
}

/** Status for one extension: what the PBX said, or unregistered if it said nothing. */
function statusForExtension(contacts, ext) {
  if (!ext) {
    return null;
  }
  return contacts[ext] || { ext, status: STATUS.unregistered, state: "", ip: "", port: null, rtt: null, uri: "" };
}

module.exports = {
  DEFAULT_STATUS_COMMAND,
  STATUS,
  validateStatusCommand,
  resolveStatusCommand,
  parsePjsipContacts,
  parseSipPeers,
  parseRegistrations,
  statusForExtension,
  hostFromUri
};
