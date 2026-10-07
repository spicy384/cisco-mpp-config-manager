/**
 * Regenerates the README screenshots: `npm run screenshots`. Starts a mock PBX (the
 * SFTP server used by the tests) and the app on a throwaway data directory with a few
 * phones and some history, drives it with Chromium and writes PNGs to docs/screenshots.
 * Nothing here touches the real data/ directory or a real PBX.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("@playwright/test");

const PROJECT = path.join(__dirname, "..");
const OUT = path.join(PROJECT, "docs", "screenshots");
const PORT = Number(process.env.SCREENSHOT_PORT) || 3993;
const BASE = `http://127.0.0.1:${PORT}`;

let startMockSftp;
try {
  ({ startMockSftp } = require(path.join(PROJECT, "test", "helpers", "mock-sftp")));
} catch {
  console.error("test/helpers/mock-sftp.js is needed to stand in for a PBX; the test directory is not in the repository.");
  process.exit(1);
}

// Key 1 is the registered line, key 2 a speed dial to reception, key 3 a BLF on the kitchen.
const phone = (station, ext, proxy = "10.0.0.1:5060") => `<flat-profile>
  <Station_Display_Name ua="na">${station}</Station_Display_Name>
  <Proxy_1_ ua="na">${proxy}</Proxy_1_>
  <Extension_1_ ua="na">1</Extension_1_>
  <Display_Name_1_ ua="na">${station.split(" - ")[0]}</Display_Name_1_>
  <User_ID_1_ ua="na">${ext}</User_ID_1_>
  <Password_1_ ua="na">s3cret-${ext}</Password_1_>
  <Short_Name_1_ ua="na">${ext}</Short_Name_1_>
  <Extension_2_ ua="na">Disabled</Extension_2_>
  <Extended_Function_2_ ua="na">fnc=sd;ext=7002@pbx.example.com:5060;nme=Reception</Extended_Function_2_>
  <Extension_3_ ua="na">Disabled</Extension_3_>
  <Extended_Function_3_ ua="na">fnc=blf;sub=7003@pbx.example.com:5060;nme=Kitchen</Extended_Function_3_>
  <Time_Zone ua="na">GMT</Time_Zone>
  <Primary_NTP_Server ua="na">0.pool.ntp.org</Primary_NTP_Server>
  <Admin_Passwd ua="rw">12345</Admin_Passwd>
</flat-profile>`;

const PHONES = [
  ["spa0011223300a1.xml", "Front Desk - 7001", "7001"],
  ["spa0011223300a2.xml", "Reception 2 - 7002", "7002"],
  ["spa0011223300a3.xml", "Kitchen - 7003", "7003"],
  ["spa0011223300a4.xml", "Lobby - 7004", "7004"],
  ["spa0011223300a5.xml", "Warehouse - 7005", "7005", "10.0.0.2:5060"],
  ["spa0011223300a6.xml", "Meeting Room - 7006", "7006"]
];

let cookie = null;
let csrf = null;
async function req(p, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (cookie) headers.Cookie = cookie;
  if (csrf) headers["X-CSRF-Token"] = csrf;
  const res = await fetch(`${BASE}${p}`, { ...options, headers });
  const sc = res.headers.get("set-cookie");
  if (sc) { const m = sc.match(/pbx_session=([^;]*)/); if (m) cookie = `pbx_session=${m[1]}`; }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${p} -> ${res.status} ${JSON.stringify(body)}`);
  return body;
}

async function waitForServer() {
  for (let i = 0; i < 100; i += 1) {
    try {
      const r = await fetch(`${BASE}/api/auth/me`);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("the server did not start");
}

(async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pbx-shots-"));
  fs.mkdirSync(OUT, { recursive: true });
  const mock = await startMockSftp({ files: Object.fromEntries(PHONES.map(([file, station, ext, proxy]) => [file, phone(station, ext, proxy)])) });
  mock.setContacts([
    { ext: "7001", ip: "192.168.7.11", state: "Avail", rtt: 12.5 },
    { ext: "7002", ip: "192.168.7.12", state: "Avail", rtt: 9.1 },
    { ext: "7003", ip: "192.168.7.13", state: "Unavail" },
    { ext: "7004", ip: "192.168.7.14", state: "Avail", rtt: 31.7 }
  ]);
  const server = spawn(process.execPath, ["server.js"], {
    cwd: PROJECT,
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir },
    stdio: ["ignore", "ignore", "inherit"]
  });
  let browser;
  try {
    await waitForServer();

    // An administrator, a saved PBX profile that is connected, and some history to show.
    const setup = await req("/api/auth/setup", { method: "POST", body: JSON.stringify({ username: "admin", password: "correct-horse-battery" }) });
    csrf = setup.csrfToken;
    await req("/api/servers", { method: "POST", body: JSON.stringify({ name: "Branch office", host: "10.20.0.5", port: 22, username: "pbxadmin", remoteDir: "/tftpboot" }) });
    const saved = await req("/api/servers", { method: "POST", body: JSON.stringify({ name: "Head office PBX", host: "127.0.0.1", port: mock.port, username: "test", remoteDir: "/tftpboot", sipServer: "pbx.example.com:5060" }) });
    await req("/api/connect", { method: "POST", body: JSON.stringify({ profileId: saved.profile.id, password: "test" }) });
    for (const proxy of ["10.0.0.2:5060", "10.0.0.1:5060"]) {
      const cur = await req(`/api/files/${PHONES[0][0]}`);
      const entries = cur.entries.map((e) => (e.key === "Proxy_1_" ? { ...e, value: proxy } : e));
      await req(`/api/files/${PHONES[0][0]}`, { method: "POST", body: JSON.stringify({ rootKey: "flat-profile", entries }) });
    }
    const job = await req("/api/bulk-edit", { method: "POST", body: JSON.stringify({ fileNames: PHONES.slice(0, 4).map((p) => p[0]), key: "Time_Zone", value: "GMT+01:00", mode: "set", dryRun: false }) });
    for (;;) { const j = await req(`/api/bulk-edit/${job.jobId}`); if (j.status !== "running") break; await new Promise((r) => setTimeout(r, 50)); }
    await req("/api/users", { method: "POST", body: JSON.stringify({ username: "helpdesk", password: "helpdesk-long-password", role: "user" }) });

    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
    // Toast messages would land on top of the panels.
    await page.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "#toasts { display: none !important; }"; document.head.appendChild(s); }));
    const shot = async (name, locator) => {
      const file = path.join(OUT, `${name}.png`);
      if (locator) await locator.screenshot({ path: file });
      else await page.screenshot({ path: file });
      console.log(`wrote docs/screenshots/${name}.png`);
    };
    // The site header is sticky; for a shot of one panel it must not sit on top of it.
    const panel = async (name, selector) => {
      const el = page.locator(selector).first();
      const style = await page.addStyleTag({ content: "header { position: static !important; }" });
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      await shot(name, el);
      await style.evaluate((node) => node.remove());
    };
    const attempt = async (what, fn) => {
      try {
        await fn();
      } catch (error) {
        console.error(`skipped ${what}: ${error.message.split("\n")[0]}`);
      }
    };

    // Sign in (the account exists), then past the first-run two-factor prompt.
    await page.goto(`${BASE}/#configuration`);
    await page.fill("#auth-username", "admin");
    await page.fill("#auth-password", "correct-horse-battery");
    await page.locator("#auth-login-form button[type=submit]").click();
    await page.locator("#enrol-skip").click({ timeout: 15000 });
    await page.locator("#file-list li").first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(500);

    // Configuration: the connected PBX, its phones, and one open in the Quick editor.
    await page.locator("#file-list li .file-details").first().click();
    await page.locator("#tab-quick").click();
    await page.locator("#quick-buttons").waitFor({ timeout: 15000 });
    await page.waitForTimeout(600);
    await page.evaluate("window.scrollTo(0, 0)");
    await shot("configuration");
    await attempt("editor", () => panel("editor", "section.panel:has(> .panel-head h2:text-is('Editor')), section.panel:has(h2:text-is('Editor'))"));

    // Bulk Edit with a preview across four phones.
    await attempt("bulk edit", async () => {
      for (const box of (await page.locator("#file-list li .file-check").all()).slice(0, 4)) await box.check();
      await page.fill("#bulk-key", "Time_Zone");
      await page.fill("#bulk-value", "GMT-05:00");
      await page.locator("#bulk-preview-btn").click();
      await page.locator("#bulk-results tr, #bulk-results li, #bulk-results .bulk-row").first().waitFor({ timeout: 15000 });
      await page.waitForTimeout(400);
      await panel("bulk-edit", "#bulk-panel");
    });

    // Reporting: registrations, drift against the baseline, the change log.
    await page.locator("#page-nav .page-link[data-page=reporting]").click();
    await attempt("phones", async () => {
      await page.locator("#phones-refresh-btn").click();
      await page.waitForTimeout(1200);
      await panel("phones", "#phones-panel");
    });
    await attempt("drift", async () => {
      await page.locator("#drift-btn").click();
      await page.locator("#drift-results tr, #drift-results li, #drift-results .drift-row").first().waitFor({ timeout: 20000 });
      await page.waitForTimeout(400);
      await panel("drift", "#drift-panel");
    });
    await attempt("change log", async () => {
      await page.locator("#log-results tr, #log-results li").first().waitFor({ timeout: 15000 });
      await panel("change-log", "#log-panel");
    });

    // Settings: saved servers, and the version panel after a live check.
    await page.locator("#page-nav .page-link[data-page=settings]").click();
    await attempt("servers", async () => {
      await page.locator("#server-select").waitFor({ timeout: 15000 });
      await page.waitForTimeout(400);
      await panel("servers", "#servers-panel");
    });
    await attempt("version", async () => {
      await page.locator("#version-check-now").click();
      await page.waitForTimeout(2500);
      await panel("version", "#version-panel");
    });

    // Dark theme, top of the configuration page.
    await page.locator("#page-nav .page-link[data-page=configuration]").click();
    await page.locator("#theme-toggle").click();
    await page.evaluate("window.scrollTo(0, 0)");
    await page.waitForTimeout(500);
    await shot("configuration-dark");
  } finally {
    if (browser) await browser.close();
    server.kill();
    mock.close();
    await new Promise((r) => setTimeout(r, 300));
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
