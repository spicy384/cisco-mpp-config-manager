/**
 * End-to-end tests: boots the real server and drives it over a real SFTP
 * connection to an in-memory mock PBX.
 *
 * The app's data/ directory is backed up to the OS temp dir before the run and
 * restored afterwards, so tests never disturb real saved servers or logs.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { startMockSftp } = require("./helpers/mock-sftp");
const { createChecker } = require("./helpers/assert");

const PROJECT = path.join(__dirname, "..");
const DATA_DIR = path.join(PROJECT, "data");
const BACKUP_DIR = path.join(os.tmpdir(), `pbx-data-backup-${process.pid}`);
const APP_PORT = Number(process.env.TEST_PORT) || 3987;

const { check, report } = createChecker("E2E: bulk edit, progress, change log");

const xml = (station, proxy, extra = "") => `<flat-profile>
  <Station_Display_Name ua="na">${station}</Station_Display_Name>
  <Proxy_1_ ua="na">${proxy}</Proxy_1_>
  <Admin_Passwd ua="na">secret</Admin_Passwd>${extra}
</flat-profile>`;

async function req(pathname, options = {}) {
  const res = await fetch(`http://127.0.0.1:${APP_PORT}${pathname}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

/** Bulk edit is a job: POST starts it, GET polls until it settles. */
async function runBulk(payload, { pollMs = 25 } = {}) {
  const start = await req("/api/bulk-edit", { method: "POST", body: JSON.stringify(payload) });
  if (start.status !== 202) {
    return { start, job: null };
  }

  for (;;) {
    const poll = await req(`/api/bulk-edit/${start.body.jobId}`);
    if (poll.body.status !== "running") {
      return { start, job: poll.body };
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

async function waitForServer(tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${APP_PORT}/api/status`);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`app server did not start on port ${APP_PORT}`);
}

(async () => {
  if (fs.existsSync(DATA_DIR)) {
    fs.cpSync(DATA_DIR, BACKUP_DIR, { recursive: true });
  }

  const mock = await startMockSftp({
    files: {
      "spa001.xml": xml("Front Desk - 7001", "10.0.0.1:5060"),
      "spa002.xml": xml("Kitchen - 7002", "10.0.0.1:5060"),
      "spa003.xml": xml("Lobby - 7003", "10.0.0.9:5060"),
      "spa004.xml": xml("Office - 7004", "10.0.0.1:5060", '\n  <Time_Zone ua="na">GMT</Time_Zone>'),
      "phonebook.xml": "<x>not a spa file</x>"
    }
  });

  const app = spawn("node", ["server.js"], {
    cwd: PROJECT,
    env: { ...process.env, PORT: String(APP_PORT) },
    stdio: ["ignore", "pipe", "pipe"]
  });
  app.stderr.on("data", (d) => console.error("[app stderr]", d.toString().trim()));

  try {
    await waitForServer();

    // --- connect ---
    const conn = await req("/api/connect", {
      method: "POST",
      body: JSON.stringify({
        host: "127.0.0.1", port: mock.port, username: "test",
        password: "test", remoteDir: "/tftpboot"
      })
    });
    check("connect succeeds", conn.status === 200, JSON.stringify(conn.body));
    if (conn.status !== 200) throw new Error("cannot continue without a connection");

    // --- list ---
    const list = await req("/api/files");
    const names = (list.body.files || []).map((f) => f.name);
    check("lists only spa*.xml files", JSON.stringify(names) === '["spa001.xml","spa002.xml","spa003.xml","spa004.xml"]', JSON.stringify(names));
    check("station display name parsed", list.body.files[0].stationDisplayName === "Front Desk - 7001");

    const targets = ["spa001.xml", "spa002.xml", "spa003.xml", "spa004.xml"];

    // === preview must not write ===
    const writesBefore = mock.writes.length;
    const { start: previewStart, job: preview } = await runBulk(
      { fileNames: targets, key: "Proxy_1_", value: "192.168.50.5:5060", mode: "set", dryRun: true }
    );
    check("preview start returns 202 + jobId", previewStart.status === 202 && !!previewStart.body.jobId, JSON.stringify(previewStart.body));
    check("preview job completes", preview.status === "done", preview.status);
    check("preview performs ZERO writes", mock.writes.length === writesBefore, `writes=${mock.writes.length - writesBefore}`);
    check("preview reports dryRun:true", preview.dryRun === true);
    check("preview: 4 files would change", (preview.summary?.changed || 0) === 4, JSON.stringify(preview.summary));
    check("preview processed == total", preview.processed === preview.total && preview.total === 4);

    const p1 = preview.results.find((r) => r.name === "spa001.xml");
    check("preview shows previous value", p1.previousValues[0] === "10.0.0.1:5060", JSON.stringify(p1));
    check("preview shows new value", p1.newValue === "192.168.50.5:5060");
    check("mock store untouched by preview", mock.store.get("spa001.xml").includes("10.0.0.1:5060"));

    // === apply ===
    const { job: apply } = await runBulk(
      { fileNames: targets, key: "Proxy_1_", value: "192.168.50.5:5060", mode: "set", dryRun: false }
    );
    check("apply job completes", apply.status === "done", apply.status);
    check("apply reports dryRun:false", apply.dryRun === false);
    check("apply changed 4 files", (apply.summary?.changed || 0) === 4, JSON.stringify(apply.summary));
    check("apply performed 4 writes", mock.writes.length - writesBefore === 4, `writes=${mock.writes.length - writesBefore}`);

    for (const name of targets) {
      const content = mock.store.get(name);
      check(`${name} has new proxy value`, content.includes("192.168.50.5:5060"));
      check(`${name} preserved ua attribute`, /<Proxy_1_ ua="na">192\.168\.50\.5:5060<\/Proxy_1_>/.test(content));
    }
    check("unrelated tag preserved", mock.store.get("spa001.xml").includes("Front Desk - 7001"));
    check("unrelated Admin_Passwd preserved", mock.store.get("spa001.xml").includes("secret"));
    check("extra Time_Zone tag preserved", mock.store.get("spa004.xml").includes('<Time_Zone ua="na">GMT</Time_Zone>'));

    // === idempotency: re-applying the same value must not rewrite ===
    const writesBeforeNoop = mock.writes.length;
    const { job: noop } = await runBulk(
      { fileNames: targets, key: "Proxy_1_", value: "192.168.50.5:5060", mode: "set", dryRun: false }
    );
    check("re-apply reports 0 changed", (noop.summary?.changed || 0) === 0, JSON.stringify(noop.summary));
    check("re-apply reports 4 unchanged", (noop.summary?.unchanged || 0) === 4, JSON.stringify(noop.summary));
    check("re-apply performs ZERO writes", mock.writes.length === writesBeforeNoop);

    // === modes ===
    const { job: upd } = await runBulk(
      { fileNames: targets, key: "Nonexistent_Tag", value: "x", mode: "update-existing", dryRun: true }
    );
    check("update-existing reports all missing", (upd.summary?.missing || 0) === 4, JSON.stringify(upd.summary));
    check("update-existing changes nothing", (upd.summary?.changed || 0) === 0);

    const { job: created } = await runBulk(
      { fileNames: ["spa001.xml"], key: "Time_Zone", value: "GMT+10:00", attributes: { ua: "na" }, mode: "set", dryRun: false }
    );
    check("set creates missing tag", (created.summary?.changed || 0) === 1, JSON.stringify(created.summary));
    check("created tag present in file", /<Time_Zone ua="na">GMT\+10:00<\/Time_Zone>/.test(mock.store.get("spa001.xml")));

    const { job: del } = await runBulk(
      { fileNames: ["spa002.xml"], key: "Admin_Passwd", mode: "delete", dryRun: false }
    );
    check("delete reports 1 changed", (del.summary?.changed || 0) === 1, JSON.stringify(del.summary));
    check("deleted tag gone from file", !mock.store.get("spa002.xml").includes("Admin_Passwd"));
    check("delete left other tags intact", mock.store.get("spa002.xml").includes("Kitchen - 7002"));

    await runBulk({ fileNames: ["spa003.xml"], key: "Proxy_1_", value: "1.1.1.1", attributes: { ua: "rw" }, mode: "set", dryRun: false });
    check("attribute override applied", /<Proxy_1_ ua="rw">1\.1\.1\.1<\/Proxy_1_>/.test(mock.store.get("spa003.xml")));

    // === validation / safety ===
    check("rejects empty file list", (await req("/api/bulk-edit", { method: "POST", body: JSON.stringify({ fileNames: [], key: "X", mode: "set" }) })).status === 400);
    check("rejects blank tag", (await req("/api/bulk-edit", { method: "POST", body: JSON.stringify({ fileNames: ["spa001.xml"], key: "  ", mode: "set" }) })).status === 400);
    check("rejects unknown mode", (await req("/api/bulk-edit", { method: "POST", body: JSON.stringify({ fileNames: ["spa001.xml"], key: "X", mode: "nuke" }) })).status === 400);
    check("rejects path traversal in filename", (await req("/api/bulk-edit", { method: "POST", body: JSON.stringify({ fileNames: ["../../etc/passwd.xml"], key: "X", mode: "set" }) })).status >= 400);
    check("rejects non-.xml filename", (await req("/api/bulk-edit", { method: "POST", body: JSON.stringify({ fileNames: ["evil.sh"], key: "X", mode: "set" }) })).status >= 400);

    // dryRun must default to true: a malformed client must not write by accident
    const writesBeforeDefault = mock.writes.length;
    const { job: omitted } = await runBulk({ fileNames: ["spa004.xml"], key: "Proxy_1_", value: "9.9.9.9", mode: "set" });
    check("omitted dryRun defaults to preview (fail-safe)", omitted.dryRun === true);
    check("omitted dryRun performs no writes", mock.writes.length === writesBeforeDefault);

    // === per-file error isolation ===
    const { job: mixed } = await runBulk(
      { fileNames: ["spa001.xml", "ghost.xml"], key: "Proxy_1_", value: "7.7.7.7", mode: "set", dryRun: false }
    );
    check("batch continues past a failing file", (mixed.summary?.changed || 0) === 1 && (mixed.summary?.error || 0) === 1, JSON.stringify(mixed.summary));
    check("good file still written despite sibling error", mock.store.get("spa001.xml").includes("7.7.7.7"));

    // === progress reporting ===
    mock.setLatency(120);
    const slowStart = await req("/api/bulk-edit", {
      method: "POST",
      body: JSON.stringify({ fileNames: targets, key: "Proxy_1_", value: "5.5.5.5", mode: "set", dryRun: true })
    });
    check("slow job starts with 202", slowStart.status === 202);
    check("start response reports total up-front", slowStart.body.total === 4, JSON.stringify(slowStart.body));

    const observed = [];
    for (;;) {
      const poll = await req(`/api/bulk-edit/${slowStart.body.jobId}`);
      observed.push({ processed: poll.body.processed, status: poll.body.status, current: poll.body.currentFile });
      if (poll.body.status !== "running") break;
      await new Promise((r) => setTimeout(r, 60));
    }
    check("progress observable mid-flight", observed.some((o) => o.status === "running" && o.processed > 0 && o.processed < 4), JSON.stringify(observed));
    check("currentFile reported while running", observed.some((o) => o.status === "running" && !!o.current));
    check("progress is monotonic", observed.every((o, i) => i === 0 || o.processed >= observed[i - 1].processed));
    check("final poll reports full progress", observed.at(-1).processed === 4 && observed.at(-1).status === "done");

    // single shared SFTP connection => one job at a time
    const c1 = await req("/api/bulk-edit", { method: "POST", body: JSON.stringify({ fileNames: targets, key: "Proxy_1_", value: "6.6.6.6", mode: "set", dryRun: true }) });
    const c2 = await req("/api/bulk-edit", { method: "POST", body: JSON.stringify({ fileNames: targets, key: "Proxy_1_", value: "7.7.7.7", mode: "set", dryRun: true }) });
    check("second concurrent job rejected with 409", c2.status === 409, `${c2.status} ${JSON.stringify(c2.body)}`);
    for (;;) {
      const p = await req(`/api/bulk-edit/${c1.body.jobId}`);
      if (p.body.status !== "running") break;
      await new Promise((r) => setTimeout(r, 60));
    }
    mock.setLatency(0);

    check("unknown jobId returns 404", (await req("/api/bulk-edit/does-not-exist")).status === 404);

    // === change log ===
    // NOTE: the log may already contain real scopes from normal use of the app, so every
    // assertion below targets this test's own scope rather than assuming an empty log.
    const scopeKey = "host:127.0.0.1|dir:/tftpboot";
    const logs = await req("/api/logs");
    const testScope = (logs.body.scopes || []).find((s) => s.key === scopeKey);
    check("log includes a scope for this server", !!testScope, JSON.stringify(logs.body.scopes));
    check("log scope keyed by host+dir for direct connection", testScope.key === scopeKey, testScope.key);
    check("log reports currentScopeKey while connected", logs.body.currentScopeKey === scopeKey);

    const entries = (await req(`/api/logs/${encodeURIComponent(scopeKey)}`)).body.entries || [];
    check("log has entries", entries.length > 0, String(entries.length));
    check("log newest-first", entries.length < 2 || entries[0].ts >= entries[1].ts);

    const bulkSets = entries.filter((e) => e.action === "bulk-set");
    const bulkDels = entries.filter((e) => e.action === "bulk-delete");
    check("log recorded bulk-set actions", bulkSets.length > 0);
    check("log recorded bulk-delete action", bulkDels.length === 1, String(bulkDels.length));
    check("bulk-delete entry names the tag", bulkDels[0].tag === "Admin_Passwd");
    check("bulk-delete records before value", bulkDels[0].before === "secret");

    const proxyEntry = bulkSets.find((e) => e.after === "192.168.50.5:5060");
    check("log records before -> after", proxyEntry && proxyEntry.before === "10.0.0.1:5060", JSON.stringify(proxyEntry));
    check("log records the file name", proxyEntry && /^spa00\d\.xml$/.test(proxyEntry.file));

    // Station name identifies the phone, since file names are MAC addresses.
    check("bulk log records the station name", /^(Front Desk|Kitchen|Lobby|Office) - 700\d$/.test(proxyEntry.station || ""), JSON.stringify(proxyEntry));
    // Successful rows always identify the phone...
    check("every successful bulk-set row has a station", bulkSets.filter((e) => e.status !== "error").every((e) => e.station.length > 0), JSON.stringify(bulkSets.map((e) => `${e.file}=${e.station}`)));
    // ...but a file that could not be read has no knowable station, so it is blank rather than wrong.
    const ghostRow = bulkSets.find((e) => e.file === "ghost.xml");
    check("unreadable file logs a blank station rather than a wrong one", ghostRow && ghostRow.station === "", JSON.stringify(ghostRow));
    check("bulk-delete row has a station", bulkDels[0].station === "Kitchen - 7002", JSON.stringify(bulkDels[0]));

    // station comes from the file, so it must match the right file
    const spa003Entry = bulkSets.find((e) => e.file === "spa003.xml");
    check("station matches its own file", spa003Entry.station === "Lobby - 7003", JSON.stringify(spa003Entry));

    check("preview runs are NOT logged", !entries.some((e) => e.after === "5.5.5.5" || e.after === "9.9.9.9"));
    check("failed file logged as error", entries.some((e) => e.status === "error" && e.file === "ghost.xml"));
    check("unchanged files not logged", entries.filter((e) => e.status === "unchanged").length === 0);

    // === single-file save records a real field-level diff ===
    // spa004 currently holds Proxy_1_, Station_Display_Name, Admin_Passwd, Time_Zone.
    const beforeSave = (await req(`/api/logs/${encodeURIComponent(scopeKey)}`)).body.entries.length;
    const current = await req("/api/files/spa004.xml");
    const edited = current.body.entries
      .filter((e) => e.key !== "Admin_Passwd")                                  // remove a field
      .map((e) => (e.key === "Station_Display_Name" ? { ...e, value: "Renamed Desk" } : e)); // change a field
    edited.push({ key: "New_Setting", value: "hello", attributes: { ua: "na" } });  // add a field

    await req("/api/files/spa004.xml", {
      method: "POST",
      body: JSON.stringify({ rootKey: "flat-profile", entries: edited })
    });

    const afterSave = (await req(`/api/logs/${encodeURIComponent(scopeKey)}`)).body.entries || [];
    const saveRows = afterSave.slice(0, afterSave.length - beforeSave);
    check("save logged one row per changed field", saveRows.length === 3, `${saveRows.length}: ${JSON.stringify(saveRows.map(r => r.action))}`);

    const changedRow = saveRows.find((r) => r.action === "field-changed");
    check("save logs the changed field's tag", changedRow?.tag === "Station_Display_Name", JSON.stringify(changedRow));
    check("save logs the before value", changedRow?.before === "Office - 7004", JSON.stringify(changedRow));
    check("save logs the after value", changedRow?.after === "Renamed Desk", JSON.stringify(changedRow));

    // This save renamed the station itself; the log must identify the phone by its
    // pre-edit name, which is how the operator knew it when they made the change.
    check("save rows record the station name", saveRows.every((r) => r.station === "Office - 7004"), JSON.stringify(saveRows.map((r) => r.station)));

    const addedRow = saveRows.find((r) => r.action === "field-added");
    check("save logs an added field", addedRow?.tag === "New_Setting" && addedRow?.after === "hello", JSON.stringify(addedRow));
    check("added field has no before value", addedRow?.before === null);

    const removedRow = saveRows.find((r) => r.action === "field-removed");
    check("save logs a removed field", removedRow?.tag === "Admin_Passwd", JSON.stringify(removedRow));
    check("removed field records its old value", removedRow?.before === "secret", JSON.stringify(removedRow));
    check("removed field has no after value", removedRow?.after === null);

    check("no blank-tag summary row for a normal save", !saveRows.some((r) => r.tag === null), JSON.stringify(saveRows));

    // saving with nothing changed should say exactly that
    const beforeNoop = (await req(`/api/logs/${encodeURIComponent(scopeKey)}`)).body.entries.length;
    const unchanged = await req("/api/files/spa004.xml");
    await req("/api/files/spa004.xml", {
      method: "POST",
      body: JSON.stringify({ rootKey: "flat-profile", entries: unchanged.body.entries })
    });
    const afterNoop = (await req(`/api/logs/${encodeURIComponent(scopeKey)}`)).body.entries || [];
    check("no-change save logs a single row", afterNoop.length === beforeNoop + 1);
    check("no-change save says 'No field changes'", afterNoop[0].after === "No field changes", JSON.stringify(afterNoop[0]));

    // === create is still a summary (there is no previous version to diff) ===
    await req("/api/files", {
      method: "POST",
      body: JSON.stringify({ fileName: "spa999.xml", rootKey: "flat-profile", entries: [{ key: "A", value: "1", attributes: {} }] })
    });
    const after2 = (await req(`/api/logs/${encodeURIComponent(scopeKey)}`)).body.entries || [];
    check("file create logged", after2.some((e) => e.action === "create" && e.file === "spa999.xml"));

    // a created file carries whatever station name it was created with
    await req("/api/files", {
      method: "POST",
      body: JSON.stringify({
        fileName: "spa998.xml",
        rootKey: "flat-profile",
        entries: [{ key: "Station_Display_Name", value: "Brand New Phone", attributes: { ua: "na" } }]
      })
    });
    const afterCreate = (await req(`/api/logs/${encodeURIComponent(scopeKey)}`)).body.entries || [];
    check("create logs its station name", afterCreate[0].station === "Brand New Phone", JSON.stringify(afterCreate[0]));

    // preview results carry the station too, so you can see which phones you are about to touch
    const { job: stationPreview } = await runBulk(
      { fileNames: ["spa003.xml"], key: "Proxy_1_", value: "3.3.3.3", mode: "set", dryRun: true }
    );
    check("preview results include the station", stationPreview.results[0].station === "Lobby - 7003", JSON.stringify(stationPreview.results[0]));

    // a file with no station name must not break anything
    const { job: noStation } = await runBulk(
      { fileNames: ["spa999.xml"], key: "A", value: "2", mode: "set", dryRun: true }
    );
    check("file without a station name yields empty string", noStation.results[0].station === "", JSON.stringify(noStation.results[0]));

    // === log survives disconnect and lives on disk ===
    // Re-read here: every step above may have appended, so an earlier count would be stale.
    const finalCount = ((await req(`/api/logs/${encodeURIComponent(scopeKey)}`)).body.entries || []).length;

    await req("/api/connection", { method: "DELETE" });
    const afterDisconnect = await req("/api/logs");
    check("log survives disconnect", (afterDisconnect.body.scopes || []).some((s) => s.key === scopeKey), JSON.stringify(afterDisconnect.body.scopes));
    check("currentScopeKey null when disconnected", afterDisconnect.body.currentScopeKey === null);
    check("log readable while disconnected", ((await req(`/api/logs/${encodeURIComponent(scopeKey)}`)).body.entries || []).length === finalCount);

    const onDisk = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "change-log.json"), "utf8"));
    check("log persisted to change-log.json", Array.isArray(onDisk[scopeKey]?.entries) && onDisk[scopeKey].entries.length === finalCount, `disk=${onDisk[scopeKey]?.entries?.length} api=${finalCount}`);

    // === clearing ===
    const otherScopesBefore = ((await req("/api/logs")).body.scopes || []).filter((s) => s.key !== scopeKey).length;
    const cleared = await req(`/api/logs/${encodeURIComponent(scopeKey)}`, { method: "DELETE" });
    check("clear reports count removed", cleared.body.cleared === finalCount, `cleared=${cleared.body.cleared} expected=${finalCount}`);

    const afterClear = (await req("/api/logs")).body.scopes || [];
    check("cleared scope is gone", !afterClear.some((s) => s.key === scopeKey), JSON.stringify(afterClear));
    // Clearing one server's log must not touch any other server's history.
    check("other servers' logs untouched by clear", afterClear.length === otherScopesBefore, `${afterClear.length} vs ${otherScopesBefore}`);

    // === bulk edit refuses to run while disconnected ===
    const disconnected = await req("/api/bulk-edit", { method: "POST", body: JSON.stringify({ fileNames: ["spa001.xml"], key: "X", mode: "set" }) });
    check("bulk edit rejected when not connected", disconnected.status === 500 && /not connected/i.test(disconnected.body.error || ""), JSON.stringify(disconnected.body));
  } finally {
    app.kill();
    await mock.close();

    // Always put the user's real data back.
    if (fs.existsSync(BACKUP_DIR)) {
      fs.rmSync(DATA_DIR, { recursive: true, force: true });
      fs.cpSync(BACKUP_DIR, DATA_DIR, { recursive: true });
      fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
      console.log("\n(data/ restored)");
    }
  }

  process.exit(report() ? 0 : 1);
})().catch((error) => {
  console.error("FATAL", error);
  // Best-effort restore if we blew up before the finally block.
  if (fs.existsSync(BACKUP_DIR)) {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
    fs.cpSync(BACKUP_DIR, DATA_DIR, { recursive: true });
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    console.error("(data/ restored after failure)");
  }
  process.exit(1);
});
