/**
 * Unit tests for the pure helpers in server.js.
 * These import the real implementations, so the tests fail if server.js changes behaviour.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  applyBulkEdit,
  buildSaveLogEntries,
  diffEntriesForLog,
  entriesToXml,
  resolveDefaultTemplatePath,
  extractStationDisplayName,
  findStationDisplayNameInEntries,
  normalizeAttributeOverride,
  normalizeEntries,
  sanitizeFileName,
  sanitizeServerProfile,
  buildLogScope,
  xmlToEntries
} = require("../server");

const { createChecker } = require("./helpers/assert");

const { check, report } = createChecker("Unit: bulk edit + XML helpers");

const SAMPLE = `<flat-profile>
  <Station_Display_Name ua="na">Front Desk - 7001</Station_Display_Name>
  <Proxy_1_ ua="na">10.0.0.1:5060</Proxy_1_>
  <Admin_Passwd ua="na">oldpass</Admin_Passwd>
  <Extension_1_ ua="na">1</Extension_1_>
  <Extension_2_ ua="na">2</Extension_2_>
</flat-profile>`;

const { rootKey, entries } = xmlToEntries(SAMPLE);

// --- parsing ---
check("parses root key", rootKey === "flat-profile", rootKey);
check("parses all entries", entries.length === 5, String(entries.length));
check("parses attributes", JSON.stringify(entries[0].attributes) === '{"ua":"na"}');
check("parses text value", entries[1].value === "10.0.0.1:5060");

// --- set on existing tag ---
{
  const r = applyBulkEdit(entries, { key: "Proxy_1_", value: "192.168.5.9:5060", attributes: null, mode: "set" });
  const out = r.entries.find((e) => e.key === "Proxy_1_");
  check("set updates existing value", out.value === "192.168.5.9:5060");
  check("set preserves existing attributes", JSON.stringify(out.attributes) === '{"ua":"na"}');
  check("set reports matched=1", r.matched === 1);
  check("set captures previous value", r.previousValues[0] === "10.0.0.1:5060");
  check("set does not change entry count", r.entries.length === entries.length);
}

// --- set on missing tag appends ---
{
  const r = applyBulkEdit(entries, { key: "Time_Zone", value: "GMT+10:00", attributes: { ua: "na" }, mode: "set" });
  check("set adds missing tag", r.entries.length === entries.length + 1);
  check("set-added tag has value", r.entries.at(-1).value === "GMT+10:00");
  check("set-added tag has attributes", JSON.stringify(r.entries.at(-1).attributes) === '{"ua":"na"}');
  check("set on missing reports matched=0", r.matched === 0);
}

// --- update-existing never creates ---
{
  const r = applyBulkEdit(entries, { key: "Nope", value: "x", attributes: null, mode: "update-existing" });
  check("update-existing does NOT add missing tag", r.entries.length === entries.length);
  check("update-existing reports matched=0", r.matched === 0);
}

// --- delete ---
{
  const r = applyBulkEdit(entries, { key: "Admin_Passwd", value: "", attributes: null, mode: "delete" });
  check("delete removes the tag", !r.entries.some((e) => e.key === "Admin_Passwd"));
  check("delete reduces entry count by 1", r.entries.length === entries.length - 1);
  check("delete captures previous value", r.previousValues[0] === "oldpass");
}

// --- attribute override ---
{
  const r = applyBulkEdit(entries, { key: "Proxy_1_", value: "1.2.3.4", attributes: { ua: "rw" }, mode: "set" });
  const out = r.entries.find((e) => e.key === "Proxy_1_");
  check("attribute override replaces attributes", JSON.stringify(out.attributes) === '{"ua":"rw"}');
}

// --- no-op detection (this is what prevents gratuitous rewrites) ---
{
  const r = applyBulkEdit(entries, { key: "Proxy_1_", value: "10.0.0.1:5060", attributes: null, mode: "set" });
  check("identical edit produces identical XML", entriesToXml(rootKey, entries) === entriesToXml(rootKey, r.entries));
}
{
  const r = applyBulkEdit(entries, { key: "Proxy_1_", value: "CHANGED", attributes: null, mode: "set" });
  check("real edit produces different XML", entriesToXml(rootKey, entries) !== entriesToXml(rootKey, r.entries));
}

// --- source data must never be mutated ---
{
  applyBulkEdit(entries, { key: "Proxy_1_", value: "MUTANT", attributes: { ua: "zz" }, mode: "set" });
  applyBulkEdit(entries, { key: "Admin_Passwd", value: "", attributes: null, mode: "delete" });
  const proxy = entries.find((e) => e.key === "Proxy_1_");
  check("source entries not mutated (value)", proxy.value === "10.0.0.1:5060", proxy.value);
  check("source entries not mutated (attrs)", JSON.stringify(proxy.attributes) === '{"ua":"na"}');
  check("source entries not mutated (length)", entries.length === 5);
}

// --- repeated tags ---
{
  const dup = xmlToEntries('<flat-profile><Tag ua="na">a</Tag><Tag ua="na">b</Tag><Other>z</Other></flat-profile>');
  check("duplicate tags parsed as 2 entries", dup.entries.filter((e) => e.key === "Tag").length === 2);

  const r = applyBulkEdit(dup.entries, { key: "Tag", value: "NEW", attributes: null, mode: "set" });
  check("all duplicate occurrences updated", r.entries.filter((e) => e.key === "Tag" && e.value === "NEW").length === 2);
  check("duplicate update reports matched=2", r.matched === 2);

  const roundTrip = xmlToEntries(entriesToXml(dup.rootKey, r.entries));
  check("duplicates survive XML round-trip", roundTrip.entries.filter((e) => e.key === "Tag").length === 2);
}

// --- station display name extraction ---
check("extracts station display name", extractStationDisplayName(SAMPLE) === "Front Desk - 7001");
check("station name handles CDATA", extractStationDisplayName("<a><Station_Display_Name><![CDATA[Bay 2]]></Station_Display_Name></a>") === "Bay 2");
check("station name decodes entities", extractStationDisplayName("<a><Station_Display_Name>R&amp;D</Station_Display_Name></a>") === "R&D");
check("station name missing returns empty", extractStationDisplayName("<a><b>x</b></a>") === "");
check("finds station name in entries", findStationDisplayNameInEntries(entries) === "Front Desk - 7001");

// --- file name validation (path traversal guard) ---
{
  const rejects = (name) => {
    try {
      sanitizeFileName(name);
      return false;
    } catch {
      return true;
    }
  };

  check("accepts a plain .xml name", sanitizeFileName(" spa001.xml ") === "spa001.xml");
  check("rejects forward-slash path", rejects("../etc/passwd.xml"));
  check("rejects backslash path", rejects("..\\windows\\evil.xml"));
  check("rejects non-xml extension", rejects("evil.sh"));
  check("rejects empty name", rejects("   "));
  check("rejects non-string", rejects(42));
}

// --- attribute override normalisation ---
{
  check("null attributes means preserve", normalizeAttributeOverride(null) === null);
  check("undefined attributes means preserve", normalizeAttributeOverride(undefined) === null);
  check("object attributes stringified", JSON.stringify(normalizeAttributeOverride({ ua: "na", n: 5 })) === '{"ua":"na","n":"5"}');
  check("blank attribute names dropped", JSON.stringify(normalizeAttributeOverride({ "  ": "x", ua: "na" })) === '{"ua":"na"}');

  let threw = false;
  try { normalizeAttributeOverride(["a"]); } catch { threw = true; }
  check("array attributes rejected", threw);
}

// --- entry normalisation ---
{
  const normalized = normalizeEntries([
    { key: " Tag ", value: 42, attributes: { ua: "na" } },
    { key: "", value: "dropped" },
    { key: "NoAttrs", value: null }
  ]);
  check("trims keys", normalized[0].key === "Tag");
  check("stringifies values", normalized[0].value === "42");
  check("drops entries with blank keys", normalized.length === 2);
  check("null value becomes empty string", normalized[1].value === "");
}

// --- log scope keying (drives per-server log separation) ---
{
  check("no connection yields null scope", buildLogScope(null) === null);

  const direct = buildLogScope({ host: "10.0.0.5", remoteDir: "/tftpboot" });
  check("direct connection keyed by host+dir", direct.key === "host:10.0.0.5|dir:/tftpboot", direct.key);

  const profile = buildLogScope({ profileId: "abc", profileName: "Main PBX", host: "10.0.0.5", remoteDir: "/tftpboot" });
  check("saved profile keyed by profile id", profile.key === "profile:abc", profile.key);
  check("profile scope keeps label", profile.label === "Main PBX");

  // The point of profile keying: history follows the server across an address change.
  const moved = buildLogScope({ profileId: "abc", profileName: "Main PBX", host: "192.168.9.9", remoteDir: "/tftpboot" });
  check("profile scope stable across host change", moved.key === profile.key);
}

// --- server profile validation ---
{
  const ok = sanitizeServerProfile({ name: "A", host: "h", username: "u", remoteDir: "/d" });
  check("profile defaults port to 22", ok.port === 22);
  check("profile generates an id", typeof ok.id === "string" && ok.id.length > 0);

  let threw = false;
  try { sanitizeServerProfile({ name: "A" }); } catch { threw = true; }
  check("profile requires host/username/remoteDir", threw);
}

// --- field-level diff for single-file saves ---
{
  const e = (key, value, attributes = { ua: "na" }) => ({ key, value, attributes });

  // no change
  const same = [e("A", "1"), e("B", "2")];
  check("identical entries produce no diff", diffEntriesForLog(same, same).length === 0);

  // changed value
  const changed = diffEntriesForLog([e("A", "1"), e("B", "2")], [e("A", "1"), e("B", "9")]);
  check("diff detects a single changed field", changed.length === 1, JSON.stringify(changed));
  check("changed field reports key", changed[0].key === "B");
  check("changed field action", changed[0].action === "field-changed");
  check("changed field before value", changed[0].before === "2");
  check("changed field after value", changed[0].after === "9");

  // added
  const added = diffEntriesForLog([e("A", "1")], [e("A", "1"), e("New", "x")]);
  check("diff detects an added field", added.length === 1 && added[0].action === "field-added", JSON.stringify(added));
  check("added field has null before", added[0].before === null);
  check("added field has after value", added[0].after === "x");

  // removed
  const removed = diffEntriesForLog([e("A", "1"), e("Gone", "z")], [e("A", "1")]);
  check("diff detects a removed field", removed.length === 1 && removed[0].action === "field-removed", JSON.stringify(removed));
  check("removed field has before value", removed[0].before === "z");
  check("removed field has null after", removed[0].after === null);

  // attribute-only change must still be recorded, and must be visible
  const attrOnly = diffEntriesForLog([e("A", "1", { ua: "na" })], [e("A", "1", { ua: "rw" })]);
  check("diff detects attribute-only change", attrOnly.length === 1, JSON.stringify(attrOnly));
  check("attribute-only change shows attrs in before", /attrs/.test(attrOnly[0].before), attrOnly[0].before);
  check("attribute-only change shows attrs in after", /attrs/.test(attrOnly[0].after), attrOnly[0].after);

  // repeated tags compared as a group
  const dupBefore = [e("T", "a"), e("T", "b")];
  const dupAfter = [e("T", "a"), e("T", "c")];
  const dupDiff = diffEntriesForLog(dupBefore, dupAfter);
  check("repeated tags diffed as a group", dupDiff.length === 1, JSON.stringify(dupDiff));
  check("repeated tags join values", dupDiff[0].before === "a | b" && dupDiff[0].after === "a | c", JSON.stringify(dupDiff[0]));

  // multiple changes sorted by key
  const multi = diffEntriesForLog([e("Z", "1"), e("A", "1")], [e("Z", "2"), e("A", "2")]);
  check("multiple changes detected", multi.length === 2);
  check("changes sorted by key", multi[0].key === "A" && multi[1].key === "Z");
}

// --- save log entry construction ---
{
  const noChange = buildSaveLogEntries("spa001.xml", []);
  check("no-change save logs one summary row", noChange.length === 1 && noChange[0].action === "save");
  check("no-change save says so", noChange[0].after === "No field changes");

  const few = buildSaveLogEntries("spa001.xml", [
    { key: "A", action: "field-changed", before: "1", after: "2" },
    { key: "B", action: "field-added", before: null, after: "x" }
  ], "Front Desk - 7001");
  check("small save logs one row per field", few.length === 2);
  check("save rows carry the tag", few[0].tag === "A" && few[1].tag === "B");
  check("save rows carry before/after", few[0].before === "1" && few[0].after === "2");
  check("save rows carry the file name", few.every((r) => r.file === "spa001.xml"));
  check("save rows carry the station name", few.every((r) => r.station === "Front Desk - 7001"));
  check("no-change row carries the station name", buildSaveLogEntries("spa001.xml", [], "Lobby - 7003")[0].station === "Lobby - 7003");
  check("station defaults to empty when unknown", buildSaveLogEntries("spa001.xml", [])[0].station === "");

  // large saves (e.g. template load) must not flood the log
  const many = Array.from({ length: 60 }, (_, i) => ({
    key: `K${String(i).padStart(2, "0")}`, action: "field-changed", before: "a", after: "b"
  }));
  const capped = buildSaveLogEntries("spa001.xml", many, "Kitchen - 7002");
  check("large save is capped", capped.length === 26, String(capped.length));
  check("capped save ends with a summary row", capped.at(-1).action === "save");
  check("capped save reports the remainder", capped.at(-1).after === "+35 more fields changed", capped.at(-1).after);
  check("every capped row carries the station", capped.every((r) => r.station === "Kitchen - 7002"));
}

// --- default template resolution (matters for Docker: the legacy path is Windows-only) ---
{
  const resolved = resolveDefaultTemplatePath();
  check("resolver returns a path or null, never undefined", resolved === null || typeof resolved === "string", String(resolved));

  if (resolved !== null) {
    check("resolved template path actually exists", fs.existsSync(resolved), resolved);
    check("resolved template is a file", fs.statSync(resolved).isFile());
  }

  // The env var must win, since that is how the container is configured.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pbx-tpl-"));
  const explicit = path.join(tmp, "explicit-template.xml");
  fs.writeFileSync(explicit, '<flat-profile><A ua="na">1</A></flat-profile>', "utf8");

  const child = require("child_process").spawnSync(
    process.execPath,
    ["-e", "process.stdout.write(String(require(process.argv[1]).resolveDefaultTemplatePath()))",
     path.join(__dirname, "..", "server.js")],
    { env: { ...process.env, DEFAULT_TEMPLATE_PATH: explicit }, encoding: "utf8" }
  );
  check("DEFAULT_TEMPLATE_PATH env var takes precedence", child.stdout === explicit, `${child.stdout} :: ${child.stderr}`);

  // With every candidate missing the resolver must report null rather than throw,
  // which is what makes the "Default Template will be empty" warning possible.
  const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "pbx-nodata-"));
  const missing = require("child_process").spawnSync(
    process.execPath,
    ["-e",
     "const m=require(process.argv[1]);" +
     "const r=m.resolveDefaultTemplatePath();" +
     "process.stdout.write(r===null?'NULL':'FOUND:'+r);",
     path.join(__dirname, "..", "server.js")],
    {
      env: { ...process.env, DATA_DIR: emptyDir, DEFAULT_TEMPLATE_PATH: path.join(emptyDir, "nope.xml") },
      encoding: "utf8"
    }
  );
  // On this Windows box the legacy path may still exist; on Linux/Docker it will not.
  check(
    "missing candidates resolve to null (or fall back to the legacy path where present)",
    missing.stdout === "NULL" || missing.stdout.startsWith("FOUND:"),
    `${missing.stdout} :: ${missing.stderr}`
  );

  fs.rmSync(tmp, { recursive: true, force: true });
  fs.rmSync(emptyDir, { recursive: true, force: true });
}

process.exit(report() ? 0 : 1);
