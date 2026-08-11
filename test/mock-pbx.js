/**
 * Development helper: starts a fake PBX over SFTP so you can click through the UI
 * (bulk edit, progress bar, change log) without touching a real phone system.
 *
 *   npm run mock-pbx
 *
 * Then connect the app to the printed host/port with any username and password.
 * Files are in-memory only; restarting resets them.
 */
const { startMockSftp } = require("./helpers/mock-sftp");

// Number(x) || default would swallow a deliberate 0, so check for the var explicitly.
const LATENCY_MS = process.env.MOCK_LATENCY_MS === undefined ? 400 : Number(process.env.MOCK_LATENCY_MS);
const FILE_COUNT = Number(process.env.MOCK_FILE_COUNT) || 8;
// Loopback by default. Set MOCK_HOST=0.0.0.0 only when something off-box (a container)
// must reach it, and stop it afterwards - it accepts any credentials.
const HOST = process.env.MOCK_HOST || "127.0.0.1";

const STATIONS = [
  "Front Desk", "Kitchen", "Lobby", "Boardroom",
  "Reception", "Warehouse", "IT Helpdesk", "Accounts",
  "Workshop", "Dispatch", "Sales", "Support"
];

const xml = (station, ext) => `<flat-profile>
  <Station_Display_Name ua="na">${station} - ${ext}</Station_Display_Name>
  <Proxy_1_ ua="na">10.0.0.1:5060</Proxy_1_>
  <Admin_Passwd ua="na">secret</Admin_Passwd>
  <Voice_Mail_Number ua="na">*97</Voice_Mail_Number>
  <User_ID_1_ ua="na">${ext}</User_ID_1_>
</flat-profile>`;

const files = {};
for (let i = 0; i < FILE_COUNT; i += 1) {
  const station = STATIONS[i % STATIONS.length];
  const ext = 7001 + i;
  files[`spa${String(i + 1).padStart(3, "0")}.xml`] = xml(station, ext);
}

startMockSftp({ files, latencyMs: LATENCY_MS, host: HOST }).then((mock) => {
  console.log("Mock PBX (SFTP) running");
  console.log(`  Bind:          ${HOST}${HOST === "0.0.0.0" ? "  (reachable off-box - accepts ANY credentials)" : ""}`);
  console.log(`  Host:          127.0.0.1`);
  console.log(`  Port:          ${mock.port}`);
  console.log(`  Username:      anything`);
  console.log(`  Password:      anything`);
  console.log(`  Remote Dir:    /tftpboot`);
  console.log(`  Files:         ${Object.keys(files).length}`);
  console.log(`  Latency:       ${LATENCY_MS}ms per file (so progress is visible)`);
  console.log("\nPress Ctrl+C to stop.");
});
