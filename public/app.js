const statusEl = document.getElementById("status");
const connectionPanel = document.getElementById("connection-panel");
const connectionSummary = document.getElementById("connection-summary");
const connectedServerNameEl = document.getElementById("connected-server-name");
const connectForm = document.getElementById("connect-form");
const disconnectBtn = document.getElementById("disconnect-btn");
const collapseConnectionBtn = document.getElementById("collapse-connection-btn");
const disconnectMiniBtn = document.getElementById("disconnect-mini-btn");
const connectedFingerprintEl = document.getElementById("connected-fingerprint");
const hostKeyWarning = document.getElementById("host-key-warning");
const hostKeyMessageEl = document.getElementById("host-key-message");
const hostKeyExpectedEl = document.getElementById("host-key-expected");
const hostKeyActualEl = document.getElementById("host-key-actual");
const forgetHostKeyBtn = document.getElementById("forget-host-key-btn");
const hostKeyAdminNote = document.getElementById("host-key-admin-note");
const expandConnectionBtn = document.getElementById("expand-connection-btn");
const refreshBtn = document.getElementById("refresh-btn");
const fileListEl = document.getElementById("file-list");
const filesLoadingEl = document.getElementById("files-loading");
const filesSearchInput = document.getElementById("files-search");
const filesCountEl = document.getElementById("files-count");
const entriesBody = document.getElementById("entries-body");
const fileNameInput = document.getElementById("file-name");
const rootKeyInput = document.getElementById("root-key");
const createSourceSelect = document.getElementById("create-source-select");
const addRowBtn = document.getElementById("add-row");
const saveBtn = document.getElementById("save-btn");
const saveTopBtn = document.getElementById("save-top-btn");
const createBtn = document.getElementById("create-btn");
const createTopBtn = document.getElementById("create-top-btn");
const resetBtn = document.getElementById("reset-btn");
const resetTopBtn = document.getElementById("reset-top-btn");
const showAllTopBtn = document.getElementById("show-all-top-btn");
const showAllBottomBtn = document.getElementById("show-all-bottom-btn");
const hideEmptyBtn = document.getElementById("hide-empty-btn");
const searchInput = document.getElementById("editor-search");
const themeToggleBtn = document.getElementById("theme-toggle");
const templateSelect = document.getElementById("template-select");
const templateNameInput = document.getElementById("template-name");
const loadTemplateBtn = document.getElementById("load-template-btn");
const saveTemplateBtn = document.getElementById("save-template-btn");

const selectAllBtn = document.getElementById("select-all-btn");
const selectNoneBtn = document.getElementById("select-none-btn");
const bulkKeyInput = document.getElementById("bulk-key");
const bulkValueInput = document.getElementById("bulk-value");
const bulkAttrsInput = document.getElementById("bulk-attrs");
const bulkModeSelect = document.getElementById("bulk-mode");
const bulkPreviewBtn = document.getElementById("bulk-preview-btn");
const bulkApplyBtn = document.getElementById("bulk-apply-btn");
const bulkSelectionCountEl = document.getElementById("bulk-selection-count");
const bulkResultsEl = document.getElementById("bulk-results");
const bulkRollbackBtn = document.getElementById("bulk-rollback-btn");
const historyBtn = document.getElementById("history-btn");
const historyPanel = document.getElementById("history-panel");
const historyMetaEl = document.getElementById("history-meta");
const historyListEl = document.getElementById("history-list");
const historyCloseBtn = document.getElementById("history-close-btn");
const resyncCommandInput = document.getElementById("resync-command");
const resyncTestExtInput = document.getElementById("resync-test-ext");
const resyncTestBtn = document.getElementById("resync-test-btn");
const resyncTestOutput = document.getElementById("resync-test-output");
const resyncBtn = document.getElementById("resync-btn");
const resyncTopBtn = document.getElementById("resync-top-btn");
const resyncQuickBtn = document.getElementById("resync-quick-btn");
const bulkResyncInput = document.getElementById("bulk-resync");
const bulkProgressEl = document.getElementById("bulk-progress");
const bulkProgressLabelEl = document.getElementById("bulk-progress-label");
const bulkProgressBarEl = document.getElementById("bulk-progress-bar");

const logScopeSelect = document.getElementById("log-scope-select");
const logSearchInput = document.getElementById("log-search");
const logRefreshBtn = document.getElementById("log-refresh-btn");
const logExportBtn = document.getElementById("log-export-btn");
const logClearBtn = document.getElementById("log-clear-btn");
const logMetaEl = document.getElementById("log-meta");
const logResultsEl = document.getElementById("log-results");

const serverSelect = document.getElementById("server-select");
const serverNameInput = document.getElementById("server-name");
const sipServerInput = document.getElementById("sip-server");
const saveServerBtn = document.getElementById("save-server-btn");
const deleteServerBtn = document.getElementById("delete-server-btn");

const editorCountEl = document.getElementById("editor-count");

const rowTemplate = document.getElementById("row-template");

let currentFile = "";
let hideEmpty = false;
let showAllFields = false;
let baseline = { rootKey: "flat-profile", entries: [] };
let searchQuery = "";
let filesQuery = "";
let servers = [];
let allFiles = [];
let templates = [];
let currentTheme = "light";
let lastConnectionInfo = null;
const selectedFiles = new Set();
// Set once a preview succeeds; cleared whenever the edit or selection changes,
// so "Apply" can never run against a stale preview.
let previewedEdit = null;
let bulkBusy = false;
let logEntries = [];
let logScopes = [];

const IMPORTANT_FIELDS = new Set([
  "Admin_Passwd",
  "Display_Name_1_",
  "Password_1_",
  "Proxy_1_",
  "Short_Name_1_",
  "Station_Display_Name",
  "User_ID_1_",
  "Voice_Mail_Number",
  "Phone_Background",
  "Picture_Download_URL"
]);

for (let i = 1; i <= 16; i += 1) {
  IMPORTANT_FIELDS.add(`Extended_Function_${i}_`);
  IMPORTANT_FIELDS.add(`Extension_${i}_`);
}

function isImportantTag(tag) {
  return IMPORTANT_FIELDS.has(String(tag || "").trim());
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("is-error", isError);
}

function setFilesLoading(isLoading) {
  filesLoadingEl.hidden = !isLoading;
  if (isLoading) {
    filesCountEl.textContent = "Loading...";
  }
}

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.body.classList.toggle("theme-dark", currentTheme === "dark");

  // The button also holds icons, so only the label text is swapped.
  const label = themeToggleBtn.querySelector(".theme-label");
  if (label) {
    label.textContent = currentTheme === "dark" ? "Light Theme" : "Dark Theme";
  }

  localStorage.setItem("pbx-theme", currentTheme);
}

function setConnectionCollapsed(collapsed, connectionData = null) {
  const info = connectionData || lastConnectionInfo;

  connectForm.hidden = collapsed;
  statusEl.hidden = collapsed;
  connectionSummary.hidden = !collapsed;
  collapseConnectionBtn.hidden = collapsed;

  connectionPanel.classList.toggle("collapsed", collapsed);
  document.body.classList.toggle("connection-collapsed", collapsed);

  if (collapsed) {
    const selectedLabel = serverSelect.options[serverSelect.selectedIndex]?.text || "";
    const cleanedSelected = selectedLabel.replace(/ \(.+\)$/, "");
    const displayName = info?.profileName || serverNameInput.value.trim() || cleanedSelected || info?.host || "Connected";
    connectedServerNameEl.textContent = displayName;
    connectedFingerprintEl.textContent = info?.hostKey?.fingerprint || "";
  }
}

// The connection was refused because the PBX presented a different SSH key than the
// one remembered. Show both fingerprints; only an administrator can clear the old one.
let pendingHostKeyMismatch = null;

function showHostKeyWarning(details) {
  pendingHostKeyMismatch = details;
  hostKeyMessageEl.textContent = `${details.host}:${details.port} presented a key that does not match the one remembered from earlier connections.`;
  hostKeyExpectedEl.textContent = details.expected || "(none)";
  hostKeyActualEl.textContent = details.actual || "(unknown)";

  const isAdmin = currentUser?.role === "admin";
  forgetHostKeyBtn.hidden = !isAdmin;
  hostKeyAdminNote.hidden = isAdmin;
  hostKeyWarning.hidden = false;
}

function hideHostKeyWarning() {
  pendingHostKeyMismatch = null;
  hostKeyWarning.hidden = true;
}

let csrfToken = null;
let currentUser = null;

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // A 401 from the sign-in endpoints means "those credentials were wrong", not
    // "your session expired" - only the latter should bounce back to the login screen.
    const isAuthAttempt = path.startsWith("/api/auth/");

    if (!isAuthAttempt && (res.status === 401 || (res.status === 409 && data.setupRequired))) {
      csrfToken = null;
      currentUser = null;
      showAuthOverlay(data.setupRequired ? "setup" : "login");
      throw new Error(data.setupRequired ? "Setup required." : "Your session has expired. Sign in again.");
    }

    // Callers that need more than the message (e.g. the host-key mismatch details)
    // can read the full response from the error.
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

function updateShowAllButtons() {
  const label = showAllFields ? "Show Important Fields" : "Show All Fields";
  showAllTopBtn.textContent = label;
  showAllBottomBtn.textContent = label;
}

function applyRowVisibility() {
  const q = searchQuery.trim().toLowerCase();
  let total = 0;
  let visible = 0;

  for (const row of entriesBody.querySelectorAll("tr")) {
    const tag = row.querySelector(".tag")?.value || "";
    const value = row.querySelector(".value")?.value || "";
    const attrs = row.querySelector(".attrs")?.value || "";

    const important = isImportantTag(tag);
    row.dataset.important = important ? "1" : "0";

    const hideByImportance = !showAllFields && !important;
    const hideByEmpty = hideEmpty && value.trim().length === 0;
    const matchesSearch = !q || tag.toLowerCase().includes(q) || value.toLowerCase().includes(q) || attrs.toLowerCase().includes(q);

    const hidden = hideByImportance || hideByEmpty || !matchesSearch;
    row.classList.toggle("hidden-empty", hidden);

    total += 1;
    if (!hidden) {
      visible += 1;
    }
  }

  updateEditorCount(visible, total);
  hideEmptyBtn.textContent = hideEmpty ? "Show Empty Values" : "Hide Empty Values";
  updateShowAllButtons();
}

function updateEditorCount(visible, total) {
  if (total === 0) {
    editorCountEl.textContent = currentFile ? "0 fields" : "No file loaded";
    return;
  }

  editorCountEl.textContent = visible === total
    ? `${total} field${total === 1 ? "" : "s"}`
    : `${visible} of ${total} fields`;
}

function toggleDeletedRow(row) {
  const isDeleted = row.classList.toggle("deleted");
  const btn = row.querySelector(".remove-row");
  btn.textContent = isDeleted ? "Undo" : "Delete";
  btn.classList.toggle("secondary", isDeleted);
  btn.classList.toggle("danger", !isDeleted);
}

function makeEntryFromRow(row) {
  const attrsText = row.querySelector(".attrs")?.value?.trim() || "";
  let attributes = {};

  if (attrsText) {
    try {
      attributes = JSON.parse(attrsText);
    } catch {
      attributes = {};
    }
  }

  return {
    key: row.querySelector(".tag")?.value || "",
    value: row.querySelector(".value")?.value || "",
    attributes
  };
}

function addRow(entry = { key: "", value: "", attributes: {} }) {
  const row = rowTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".tag").value = entry.key || "";
  row.querySelector(".value").value = entry.value || "";
  row.querySelector(".attrs").value = JSON.stringify(entry.attributes || {});

  row.querySelector(".remove-row").addEventListener("click", () => {
    toggleDeletedRow(row);
  });

  row.querySelector(".duplicate-row").addEventListener("click", () => {
    const copy = addRow(makeEntryFromRow(row));
    row.insertAdjacentElement("afterend", copy);
    applyRowVisibility();
  });

  row.querySelector(".tag").addEventListener("input", applyRowVisibility);
  row.querySelector(".value").addEventListener("input", applyRowVisibility);
  row.querySelector(".attrs").addEventListener("input", applyRowVisibility);

  entriesBody.appendChild(row);
  applyRowVisibility();
  return row;
}

function clearRows() {
  entriesBody.innerHTML = "";
}

function readEntries() {
  return [...entriesBody.querySelectorAll("tr")]
    .filter((tr) => !tr.classList.contains("deleted"))
    .map((tr) => {
      const attrsText = tr.querySelector(".attrs").value.trim();
      let attributes = {};

      if (attrsText) {
        try {
          attributes = JSON.parse(attrsText);
        } catch {
          throw new Error("Attributes must be valid JSON on every row.");
        }
      }

      return {
        key: tr.querySelector(".tag").value.trim(),
        value: tr.querySelector(".value").value,
        attributes
      };
    })
    .filter((entry) => entry.key.length > 0);
}

function setBaseline(rootKey, entries) {
  baseline = {
    rootKey: rootKey || "flat-profile",
    entries: deepClone(entries || [])
  };
}

function loadEntriesIntoEditor(entries) {
  clearRows();
  (entries || []).forEach((entry) => addRow(entry));
  applyRowVisibility();
}

function getFilteredFiles() {
  const q = filesQuery.trim().toLowerCase();
  if (!q) {
    return allFiles;
  }

  return allFiles.filter((file) => {
    const name = String(file.name || "").toLowerCase();
    const station = String(file.stationDisplayName || "").toLowerCase();
    return name.includes(q) || station.includes(q);
  });
}

function makeFileRowDiv(className, text, strong = false) {
  const div = document.createElement("div");
  div.className = className;

  if (strong) {
    const el = document.createElement("strong");
    el.textContent = text;
    div.appendChild(el);
  } else {
    div.textContent = text;
  }

  return div;
}

function renderFileList(files) {
  fileListEl.innerHTML = "";
  filesCountEl.textContent = `${files.length} file${files.length === 1 ? "" : "s"}`;

  for (const file of files) {
    const li = document.createElement("li");
    const station = file.stationDisplayName?.trim() || "(No Station_Display_Name)";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "file-check";
    checkbox.checked = selectedFiles.has(file.name);
    checkbox.title = "Select for bulk edit";
    // Keep ticking the box from also opening the file in the editor.
    checkbox.addEventListener("click", (e) => e.stopPropagation());
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedFiles.add(file.name);
      } else {
        selectedFiles.delete(file.name);
      }
      onSelectionChanged();
    });

    const details = document.createElement("div");
    details.className = "file-details";
    // Station name leads: file names are MAC addresses and identify nothing on their own.
    // textContent throughout: station names come from remote files and must not be parsed as HTML.
    details.appendChild(makeFileRowDiv("file-station", station));
    details.appendChild(makeFileRowDiv("file-name", file.name, true));
    details.appendChild(makeFileRowDiv("file-size", `${(file.size || 0).toLocaleString()} bytes`));

    li.appendChild(checkbox);
    li.appendChild(details);

    if (file.name === currentFile) {
      li.classList.add("active");
    }

    details.addEventListener("click", () => loadFile(file.name));
    fileListEl.appendChild(li);
  }
}

function renderServerOptions() {
  const selected = serverSelect.value;
  serverSelect.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "(Direct connection / no saved server selected)";
  serverSelect.appendChild(emptyOption);

  servers.forEach((server) => {
    const option = document.createElement("option");
    option.value = server.id;
    option.textContent = `${server.name} (${server.host})`;
    serverSelect.appendChild(option);
  });

  serverSelect.value = servers.some((s) => s.id === selected) ? selected : "";
}

function renderTemplateOptions() {
  const templateSelected = templateSelect.value;
  const createSourceSelected = createSourceSelect.value;

  templateSelect.innerHTML = "";
  createSourceSelect.innerHTML = "";

  const blankOpt = document.createElement("option");
  blankOpt.value = "blank";
  blankOpt.textContent = "Blank";
  createSourceSelect.appendChild(blankOpt);

  for (const t of templates) {
    const opt1 = document.createElement("option");
    opt1.value = t.id;
    opt1.textContent = t.name;
    templateSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = t.id;
    opt2.textContent = t.name;
    createSourceSelect.appendChild(opt2);
  }

  templateSelect.value = templates.some((t) => t.id === templateSelected) ? templateSelected : "default";
  createSourceSelect.value = (["blank", ...templates.map((t) => t.id)]).includes(createSourceSelected) ? createSourceSelected : "default";
}

async function refreshServers() {
  const data = await api("/api/servers");
  servers = data.servers || [];
  renderServerOptions();
}

async function refreshTemplates() {
  const data = await api("/api/templates");
  templates = data.templates || [];
  renderTemplateOptions();
}

async function getTemplateById(id) {
  return api(`/api/templates/${encodeURIComponent(id)}`);
}

function fillFormFromServer(serverId) {
  const server = servers.find((s) => s.id === serverId);
  if (!server) {
    return;
  }

  serverNameInput.value = server.name || "";
  connectForm.elements.host.value = server.host || "";
  connectForm.elements.port.value = server.port || 22;
  connectForm.elements.username.value = server.username || "";
  connectForm.elements.remoteDir.value = server.remoteDir || "";
  sipServerInput.value = server.sipServer || "";
  resyncCommandInput.value = server.resyncCommand || "";
}

async function refreshFiles() {
  setFilesLoading(true);
  try {
    const data = await api("/api/files");
    allFiles = data.files || [];

    // Drop selections for files that no longer exist on the server.
    const present = new Set(allFiles.map((file) => file.name));
    for (const name of [...selectedFiles]) {
      if (!present.has(name)) {
        selectedFiles.delete(name);
      }
    }

    renderFileList(getFilteredFiles());
    onSelectionChanged();
  } finally {
    setFilesLoading(false);
  }
}

async function loadFile(name) {
  const data = await api(`/api/files/${encodeURIComponent(name)}`);

  currentFile = data.fileName;
  fileNameInput.value = data.fileName;
  rootKeyInput.value = data.rootKey || "flat-profile";

  showAllFields = false;
  loadEntriesIntoEditor(data.entries || []);
  setBaseline(data.rootKey || "flat-profile", data.entries || []);

  renderFileList(getFilteredFiles());

  // Quick view reads from the editor rows, so refresh it whenever they change.
  if (quickSchemaData && !panelQuick.hidden) {
    renderQuickButtons();
    renderQuickSettings();
  }
  updateQuickScopeHints();

  historyBtn.hidden = false;
  if (!historyPanel.hidden) {
    await refreshHistory();
  }

  setStatus(`Loaded ${data.fileName}`);
}

function resetEditorToBaseline() {
  rootKeyInput.value = baseline.rootKey || "flat-profile";
  loadEntriesIntoEditor(deepClone(baseline.entries || []));
  setStatus("Editor reset to last loaded state.");
}

async function saveCurrentFile() {
  const fileName = fileNameInput.value.trim();
  if (!fileName) {
    setStatus("File name is required.", true);
    return;
  }

  const entries = readEntries();
  const rootKey = rootKeyInput.value.trim() || "flat-profile";

  await api(`/api/files/${encodeURIComponent(fileName)}`, {
    method: "POST",
    body: JSON.stringify({ rootKey, entries })
  });

  currentFile = fileName;
  loadEntriesIntoEditor(entries);
  setBaseline(rootKey, entries);
  renderFileList(getFilteredFiles());
  refreshFiles().catch(() => {});
  refreshLogScopes().catch(() => {});
  setStatus(`Saved ${fileName}`);
}

async function createNewFile() {
  const fileName = fileNameInput.value.trim();
  if (!fileName) {
    setStatus("File name is required.", true);
    return;
  }

  const sourceId = createSourceSelect.value;
  let rootKey = rootKeyInput.value.trim() || "flat-profile";
  let entries = [];

  if (sourceId === "blank") {
    if (!confirm("Create a new config with a blank field set? This will replace the current editor fields.")) {
      return;
    }
    entries = [];
    rootKey = "flat-profile";
  } else {
    const tpl = await getTemplateById(sourceId);
    if (!confirm(`Create a new config using template "${tpl.name}"? This will replace the current editor fields.`)) {
      return;
    }
    entries = deepClone(tpl.entries || []);
    rootKey = String(tpl.rootKey || "flat-profile");
  }

  await api("/api/files", {
    method: "POST",
    body: JSON.stringify({ fileName, rootKey, entries })
  });

  currentFile = fileName;
  showAllFields = false;
  rootKeyInput.value = rootKey;
  loadEntriesIntoEditor(entries);
  setBaseline(rootKey, entries);
  renderFileList(getFilteredFiles());
  refreshFiles().catch(() => {});
  refreshLogScopes().catch(() => {});
  setStatus(`Created ${fileName}`);
}

async function saveTemplate() {
  const name = templateNameInput.value.trim();
  if (!name) {
    setStatus("Template name is required.", true);
    return;
  }

  const entries = readEntries();
  const rootKey = rootKeyInput.value.trim() || "flat-profile";

  await api("/api/templates", {
    method: "POST",
    body: JSON.stringify({ name, rootKey, entries })
  });

  templateNameInput.value = "";
  await refreshTemplates();
  setStatus(`Saved template: ${name}`);
}

async function loadTemplateIntoEditor() {
  const templateId = templateSelect.value;
  if (!templateId) {
    setStatus("Select a template first.", true);
    return;
  }

  if (!confirm("Loading a template will replace all current fields in the editor. Continue?")) {
    return;
  }

  const tpl = await getTemplateById(templateId);
  showAllFields = false;
  rootKeyInput.value = String(tpl.rootKey || "flat-profile");
  loadEntriesIntoEditor(deepClone(tpl.entries || []));
  setBaseline(rootKeyInput.value, readEntries());
  setStatus(`Loaded template: ${tpl.name}`);
}

async function saveServerProfile() {
  const host = connectForm.elements.host.value.trim();
  const port = connectForm.elements.port.value.trim();
  const username = connectForm.elements.username.value.trim();
  const remoteDir = connectForm.elements.remoteDir.value.trim();
  const name = serverNameInput.value.trim();

  if (!name || !host || !username || !remoteDir) {
    setStatus("Server Name, Host, Username, and Remote XML Directory are required to save a PBX server.", true);
    return;
  }

  const payload = {
    id: serverSelect.value || undefined,
    name,
    host,
    port: Number(port) || 22,
    username,
    remoteDir,
    sipServer: sipServerInput.value.trim(),
    resyncCommand: resyncCommandInput.value.trim()
  };

  const data = await api("/api/servers", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  await refreshServers();
  serverSelect.value = data.profile.id;
  setStatus(`Saved server profile: ${data.profile.name}`);
}

async function deleteSelectedServer() {
  const id = serverSelect.value;
  if (!id) {
    setStatus("Select a saved PBX server to delete.", true);
    return;
  }

  await api(`/api/servers/${encodeURIComponent(id)}`, { method: "DELETE" });
  await refreshServers();
  serverNameInput.value = "";
  setStatus("Deleted saved PBX server.");
}

function disconnectFromServer() {
  return api("/api/connection", { method: "DELETE" });
}

function onSelectionChanged() {
  const count = selectedFiles.size;
  bulkSelectionCountEl.textContent = `${count} file${count === 1 ? "" : "s"} selected`;
  if (quickSchemaData) {
    updateQuickScopeHints();
  }
  invalidatePreview();
}

// Any change to the edit or the file set makes an existing preview untrustworthy.
function invalidatePreview() {
  if (!previewedEdit) {
    return;
  }
  previewedEdit = null;
  bulkApplyBtn.disabled = true;
  bulkResultsEl.replaceChildren();
}

function readBulkEditRequest() {
  const key = bulkKeyInput.value.trim();
  if (!key) {
    throw new Error("Enter the tag name to bulk edit.");
  }

  if (selectedFiles.size === 0) {
    throw new Error("Tick at least one file in the XML Files list.");
  }

  const attrsText = bulkAttrsInput.value.trim();
  let attributes = null;

  if (attrsText) {
    try {
      attributes = JSON.parse(attrsText);
    } catch {
      throw new Error("Attributes must be valid JSON (or blank to keep existing).");
    }

    if (typeof attributes !== "object" || Array.isArray(attributes)) {
      throw new Error("Attributes must be a JSON object, e.g. {\"ua\":\"na\"}.");
    }
  }

  return {
    fileNames: [...selectedFiles],
    key,
    value: bulkValueInput.value,
    attributes,
    mode: bulkModeSelect.value
  };
}

const BULK_STATUS_LABEL = {
  changed: "Will change",
  unchanged: "No change needed",
  missing: "Tag not present - skipped",
  error: "Error"
};

function renderBulkResults(data) {
  bulkResultsEl.replaceChildren();
  bulkRollbackBtn.hidden = true;

  const summary = document.createElement("div");
  summary.className = "bulk-summary";
  const counts = data.summary || {};
  const isRollback = data.mode === "rollback";
  const parts = isRollback
    ? [`${counts.changed || 0} restored`, `${counts.error || 0} errors`]
    : [
      `${counts.changed || 0} to change`,
      `${counts.unchanged || 0} already correct`,
      `${counts.missing || 0} skipped`,
      `${counts.error || 0} errors`
    ];
  const heading = isRollback ? "Rolled back" : (data.dryRun ? "Preview" : "Applied");
  summary.textContent = `${heading}: ${parts.join(" | ")}`;
  bulkResultsEl.appendChild(summary);

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const columns = ["Phone", "File", "Status", "Current Value", "New Value"];
  if (data.resync) {
    columns.push("Resync");
  }
  for (const label of columns) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const item of data.results || []) {
    const tr = document.createElement("tr");
    tr.className = `bulk-row-${item.status}`;

    const stationTd = document.createElement("td");
    stationTd.textContent = item.station || "-";
    tr.appendChild(stationTd);

    const nameTd = document.createElement("td");
    nameTd.textContent = item.name;
    tr.appendChild(nameTd);

    const statusTd = document.createElement("td");
    const changedLabel = isRollback ? "Restored" : (data.dryRun ? "Will change" : "Changed");
    statusTd.textContent = item.error || (item.status === "changed" ? changedLabel : BULK_STATUS_LABEL[item.status] || item.status);
    tr.appendChild(statusTd);

    const beforeTd = document.createElement("td");
    beforeTd.textContent = (item.previousValues || []).join(", ");
    tr.appendChild(beforeTd);

    const afterTd = document.createElement("td");
    if (item.status === "changed") {
      afterTd.textContent = data.mode === "delete" ? "(tag removed)" : String(item.newValue ?? "");
    }
    tr.appendChild(afterTd);

    if (data.resync) {
      const resyncTd = document.createElement("td");
      resyncTd.textContent = describeResync(item.resync);
      if (item.resync?.status === "failed") {
        resyncTd.className = "resync-failed";
        resyncTd.title = item.resync.detail || "";
      }
      tr.appendChild(resyncTd);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  bulkResultsEl.appendChild(table);
}

function setBulkBusy(busy, verb = "Working") {
  bulkBusy = busy;
  bulkProgressEl.hidden = !busy;
  bulkPreviewBtn.disabled = busy;
  bulkApplyBtn.disabled = busy || !previewedEdit;
  selectAllBtn.disabled = busy;
  selectNoneBtn.disabled = busy;

  if (busy) {
    bulkProgressBarEl.style.width = "0%";
    bulkProgressLabelEl.textContent = `${verb}...`;
  }
}

function updateBulkProgress(job, verb) {
  if (job.stage === "resync") {
    const total = job.resyncTotal || 0;
    const done = job.resyncDone || 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 100;
    bulkProgressBarEl.style.width = `${pct}%`;
    bulkProgressLabelEl.textContent = job.currentFile
      ? `Resyncing ${done + 1} of ${total}: ${job.currentFile}`
      : `Resyncing ${done} of ${total} (${pct}%)`;
    return;
  }

  const total = job.total || 0;
  const done = job.processed || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  bulkProgressBarEl.style.width = `${pct}%`;
  bulkProgressLabelEl.textContent = job.currentFile
    ? `${verb} ${done + 1} of ${total}: ${job.currentFile}`
    : `${verb} ${done} of ${total} (${pct}%)`;
}

const JOB_POLL_MS = 350;

/** Starts a bulk job and polls it to completion, driving the progress bar. */
async function runBulkJobWithProgress(request, { dryRun, verb }) {
  const start = await api("/api/bulk-edit", {
    method: "POST",
    body: JSON.stringify({ ...request, dryRun })
  });

  return pollJobWithProgress(start.jobId, verb);
}

/** Polls an already-started job to completion, driving the progress bar. */
async function pollJobWithProgress(jobId, verb) {
  const start = { jobId };
  setBulkBusy(true, verb);

  try {
    for (;;) {
      const job = await api(`/api/bulk-edit/${encodeURIComponent(start.jobId)}`);
      updateBulkProgress(job, verb);

      if (job.status !== "running") {
        if (job.status === "failed") {
          throw new Error(job.error || "Bulk edit failed.");
        }
        return job;
      }

      await new Promise((resolve) => setTimeout(resolve, JOB_POLL_MS));
    }
  } finally {
    setBulkBusy(false);
  }
}

async function previewBulkEdit() {
  const request = readBulkEditRequest();
  const job = await runBulkJobWithProgress(request, { dryRun: true, verb: "Previewing" });

  renderBulkResults(job);

  const changeCount = job.summary?.changed || 0;
  if (changeCount > 0) {
    previewedEdit = request;
    bulkApplyBtn.disabled = false;
    setStatus(`Preview ready: ${changeCount} file${changeCount === 1 ? "" : "s"} would change. Review, then Apply.`);
  } else {
    previewedEdit = null;
    bulkApplyBtn.disabled = true;
    setStatus("Preview complete: nothing would change.");
  }
}

async function applyBulkEdit() {
  if (!previewedEdit) {
    setStatus("Preview the change before applying.", true);
    return;
  }

  const request = previewedEdit;
  const fileCount = request.fileNames.length;

  // A Quick action sends several tags at once, so describe them all.
  const action = request.edits
    ? `${request.description || "apply this change"} (${request.edits.map((e) => e.key).join(", ")})`
    : (request.mode === "delete"
      ? `delete tag "${request.key}"`
      : `set "${request.key}" to "${request.value}"`);

  if (!confirm(`Write to the PBX now?\n\nThis will ${action} across ${fileCount} selected file${fileCount === 1 ? "" : "s"}.\n\nA copy of each file is kept first, so the batch can be rolled back afterwards.`)) {
    setStatus("Bulk edit cancelled.");
    return;
  }

  const job = await runBulkJobWithProgress(
    { ...request, resync: bulkResyncInput.checked },
    { dryRun: false, verb: "Applying to" }
  );

  renderBulkResults(job);
  offerBatchRollback(job);
  previewedEdit = null;
  bulkApplyBtn.disabled = true;

  const changed = job.summary?.changed || 0;
  const errors = job.summary?.error || 0;
  const resyncNote = job.resync ? `. ${summarizeResync(job.results)}` : "";
  const resyncFailed = job.resync && (job.results || []).some((item) => item.resync?.status === "failed");
  setStatus(
    `Bulk edit applied to ${changed} file${changed === 1 ? "" : "s"}${errors ? `, ${errors} failed` : ""}${resyncNote}`,
    errors > 0 || resyncFailed
  );

  await refreshFiles();
  await refreshLogScopes();

  // The open file may have just been rewritten underneath the editor.
  if (currentFile && request.fileNames.includes(currentFile)) {
    await loadFile(currentFile);
  }
}

const LOG_ACTION_LABEL = {
  "bulk-set": "Bulk set",
  "bulk-delete": "Bulk delete",
  restore: "Restored version",
  resync: "Resync",
  "field-changed": "Changed field",
  "field-added": "Added field",
  "field-removed": "Removed field",
  save: "Saved file",
  create: "Created file"
};

function formatTimestamp(ts) {
  if (!ts) {
    return "";
  }
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function refreshLogScopes() {
  const data = await api("/api/logs");
  logScopes = data.scopes || [];
  connectedScopeKey = data.currentScopeKey || null;

  const previous = logScopeSelect.value;
  logScopeSelect.replaceChildren();

  if (logScopes.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "(No logged servers yet)";
    logScopeSelect.appendChild(opt);
    logEntries = [];
    renderLogEntries();
    return;
  }

  for (const scope of logScopes) {
    const opt = document.createElement("option");
    opt.value = scope.key;
    const when = scope.lastActivity ? ` - last ${formatTimestamp(scope.lastActivity)}` : "";
    opt.textContent = `${scope.label} (${scope.entryCount})${when}`;
    logScopeSelect.appendChild(opt);
  }

  // Prefer the server we are connected to, then whatever was selected before.
  const preferred = [data.currentScopeKey, previous].find((key) => logScopes.some((s) => s.key === key));
  logScopeSelect.value = preferred || logScopes[0].key;

  await loadLogEntries();
}

async function loadLogEntries() {
  const key = logScopeSelect.value;
  if (!key) {
    logEntries = [];
    renderLogEntries();
    return;
  }

  const data = await api(`/api/logs/${encodeURIComponent(key)}`);
  logEntries = data.entries || [];
  renderLogEntries();
}

function getFilteredLogEntries() {
  const q = logSearchInput.value.trim().toLowerCase();
  if (!q) {
    return logEntries;
  }

  return logEntries.filter((entry) => {
    const haystack = [
      entry.file,
      entry.station,
      entry.user,
      entry.tag,
      entry.before,
      entry.after,
      LOG_ACTION_LABEL[entry.action] || entry.action
    ].map((v) => String(v ?? "").toLowerCase());
    return haystack.some((v) => v.includes(q));
  });
}

function renderLogEntries() {
  const rows = getFilteredLogEntries();
  logResultsEl.replaceChildren();

  const scope = logScopes.find((s) => s.key === logScopeSelect.value);
  if (logEntries.length === 0) {
    logMetaEl.textContent = scope
      ? `No changes recorded yet for ${scope.label}.`
      : "No log entries yet.";
    return;
  }

  logMetaEl.textContent = `${rows.length} of ${logEntries.length} entr${logEntries.length === 1 ? "y" : "ies"}`
    + (scope ? ` for ${scope.label}` : "");

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["When", "User", "Action", "Phone", "File", "Tag", "Before", "After", "Result", ""]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  // Restoring is only possible on the server we are connected to.
  const canRestoreHere = Boolean(connectedScopeKey) && connectedScopeKey === logScopeSelect.value;

  const tbody = document.createElement("tbody");
  for (const entry of rows) {
    const tr = document.createElement("tr");
    tr.className = entry.status === "error" ? "bulk-row-error" : "bulk-row-changed";

    const cells = [
      formatTimestamp(entry.ts),
      // Entries written before authentication existed have no user recorded.
      entry.user || "-",
      LOG_ACTION_LABEL[entry.action] || entry.action,
      // Entries written before station tracking existed have no station field.
      entry.station || "-",
      entry.file || "",
      entry.tag || "",
      entry.before ?? (entry.action === "field-added" ? "(not set)" : ""),
      entry.after ?? (entry.action === "bulk-delete" || entry.action === "field-removed" ? "(removed)" : ""),
      entry.status === "error" ? (entry.error || "Error") : "OK"
    ];

    for (const text of cells) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }

    // Entries written since snapshots existed can put the file back as it was.
    const restoreTd = document.createElement("td");
    restoreTd.className = "restore-cell";
    if (entry.snapshotId && entry.file) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "secondary small";
      btn.textContent = "Restore";
      btn.disabled = !canRestoreHere;
      btn.title = canRestoreHere
        ? "Put the file back as it was before this change"
        : "Connect to this server to restore";
      btn.addEventListener("click", () => {
        restoreVersion(entry.file, entry.snapshotId).catch((error) => setStatus(error.message, true));
      });
      restoreTd.appendChild(btn);
    }
    tr.appendChild(restoreTd);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  logResultsEl.appendChild(table);
}

// --- version history and rollback -------------------------------------------------

let connectedScopeKey = null;
let lastAppliedJob = null;

const SNAPSHOT_REASON_LABEL = {
  save: "before an editor save",
  bulk: "before a bulk edit",
  restore: "before a restore"
};

// Mirrors the server's change-log redaction so a confirm dialog never shows a password.
const SENSITIVE_TAG_RE = /passwd|password|passphrase|secret/i;

function describeVersion(version) {
  const reason = SNAPSHOT_REASON_LABEL[version.reason] || version.reason;
  return `${formatTimestamp(version.ts)} (kept ${reason}${version.user ? ` by ${version.user}` : ""})`;
}

async function refreshHistory() {
  if (!currentFile) {
    historyListEl.replaceChildren();
    historyMetaEl.textContent = "No file loaded";
    return;
  }

  const data = await api(`/api/files/${encodeURIComponent(currentFile)}/history`);
  renderHistory(data);
}

function renderHistory(data) {
  historyListEl.replaceChildren();
  const versions = data.versions || [];
  historyMetaEl.textContent = `${versions.length} of up to ${data.keep} kept for ${data.fileName}`;

  if (versions.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = "No earlier versions yet. One is kept each time this file is written through this app.";
    historyListEl.appendChild(p);
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Version", "Kept", "By", "Phone", "Size", ""]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const version of versions) {
    const tr = document.createElement("tr");
    const cells = [
      formatTimestamp(version.ts),
      SNAPSHOT_REASON_LABEL[version.reason] || version.reason,
      version.user || "-",
      version.station || "-",
      `${version.size} bytes`
    ];
    for (const text of cells) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }

    const actionTd = document.createElement("td");
    actionTd.className = "restore-cell";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "secondary small";
    btn.textContent = "Restore";
    btn.addEventListener("click", () => {
      restoreVersion(data.fileName, version.id).catch((error) => setStatus(error.message, true));
    });
    actionTd.appendChild(btn);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  historyListEl.appendChild(table);
}

/** Shows exactly what would change, then writes the stored version back to the PBX. */
async function restoreVersion(fileName, versionId) {
  const detail = await api(`/api/files/${encodeURIComponent(fileName)}/history/${encodeURIComponent(versionId)}`);
  const diff = detail.diff || [];
  const shown = diff.slice(0, 8).map((change) => {
    const hide = SENSITIVE_TAG_RE.test(change.key);
    const before = hide ? "(hidden)" : (change.before ?? "(not set)");
    const after = hide ? "(hidden)" : (change.after ?? "(removed)");
    return `  ${change.key}: ${before} -> ${after}`;
  });
  if (diff.length > shown.length) {
    shown.push(`  ...and ${diff.length - shown.length} more`);
  }

  let effect;
  if (!detail.currentExists) {
    effect = "The file no longer exists on the PBX; it will be recreated from this version.";
  } else if (diff.length === 0) {
    effect = "The file on the PBX already matches this version field for field.";
  } else {
    effect = `This will change ${diff.length} field${diff.length === 1 ? "" : "s"}:\n${shown.join("\n")}`;
  }

  const ok = confirm(
    `Restore ${fileName} to the version from ${describeVersion(detail.version)}?\n\n${effect}\n\n`
      + "The current file is kept first, so this can be undone."
  );
  if (!ok) {
    setStatus("Restore cancelled.");
    return;
  }

  const result = await api(`/api/files/${encodeURIComponent(fileName)}/restore`, {
    method: "POST",
    body: JSON.stringify({ snapshotId: versionId })
  });

  setStatus(`${result.message || `Restored ${fileName}`} (${result.changes} field${result.changes === 1 ? "" : "s"} changed).`);

  await refreshFiles();
  await refreshLogScopes();
  if (currentFile === fileName) {
    await loadFile(fileName);
  } else if (!historyPanel.hidden) {
    await refreshHistory();
  }
}

function offerBatchRollback(job) {
  const possible = !job.dryRun
    && job.mode !== "rollback"
    && (job.results || []).some((item) => item.status === "changed" && item.snapshotId);
  lastAppliedJob = possible ? job : null;
  bulkRollbackBtn.hidden = !possible;
}

async function rollbackBatch() {
  const job = lastAppliedJob;
  if (!job) {
    return;
  }

  const count = job.results.filter((item) => item.status === "changed" && item.snapshotId).length;
  const ok = confirm(
    `Roll back this batch?\n\n${count} file${count === 1 ? "" : "s"} will be put back to the copy taken just before `
      + "the bulk edit was applied. Anything changed in those files since then is overwritten.\n\n"
      + "The current files are kept first, so each one can still be restored from History."
  );
  if (!ok) {
    setStatus("Roll back cancelled.");
    return;
  }

  const start = await api(`/api/bulk-edit/${encodeURIComponent(job.jobId)}/rollback`, { method: "POST" });
  const result = await pollJobWithProgress(start.jobId, "Rolling back");

  renderBulkResults(result);
  lastAppliedJob = null;

  const restored = result.summary?.changed || 0;
  const errors = result.summary?.error || 0;
  setStatus(`Rolled back ${restored} file${restored === 1 ? "" : "s"}${errors ? `, ${errors} failed` : ""}.`, errors > 0);

  await refreshFiles();
  await refreshLogScopes();
  if (currentFile && job.results.some((item) => item.name === currentFile)) {
    await loadFile(currentFile);
  }
}

historyBtn.addEventListener("click", async () => {
  historyPanel.hidden = !historyPanel.hidden;
  if (!historyPanel.hidden) {
    try {
      await refreshHistory();
    } catch (error) {
      setStatus(error.message, true);
    }
  }
});

historyCloseBtn.addEventListener("click", () => {
  historyPanel.hidden = true;
});

bulkRollbackBtn.addEventListener("click", () => {
  rollbackBatch().catch((error) => setStatus(error.message, true));
});

// --- resync -----------------------------------------------------------------------

function describeResync(result) {
  if (!result) {
    return "";
  }
  if (result.status === "sent") {
    return `Sent to ${result.ext}`;
  }
  if (result.status === "skipped") {
    return `Skipped: ${result.detail}`;
  }
  return `Failed: ${result.detail}`;
}

function summarizeResync(results) {
  const counts = { sent: 0, skipped: 0, failed: 0 };
  for (const item of results || []) {
    if (item.resync && counts[item.resync.status] !== undefined) {
      counts[item.resync.status] += 1;
    }
  }
  const parts = [`Resync: ${counts.sent} sent`];
  if (counts.skipped) {
    parts.push(`${counts.skipped} skipped`);
  }
  if (counts.failed) {
    parts.push(`${counts.failed} failed`);
  }
  return parts.join(", ");
}

/** Tells the open phone to fetch its config. Deliberately separate from Save. */
async function resyncCurrentPhone() {
  if (!currentFile) {
    setStatus("Open a phone from the XML Files list first.", true);
    return;
  }

  const station = baseline.entries?.find((e) => e.key === "Station_Display_Name")?.value || currentFile;
  const unsaved = JSON.stringify(readEntries()) !== JSON.stringify(baseline.entries || []);
  const ok = confirm(
    `Tell ${station} to fetch its configuration from the PBX now?\n\n`
      + (unsaved ? "The editor has unsaved changes; the phone will load what is on the PBX, not what is in the editor.\n\n" : "")
      + "The phone may restart if the change requires it."
  );
  if (!ok) {
    setStatus("Resync cancelled.");
    return;
  }

  const result = await api(`/api/files/${encodeURIComponent(currentFile)}/resync`, { method: "POST" });
  setStatus(result.message || `Resync sent to ${result.ext}`);
  await refreshLogScopes();
}

async function testResync() {
  const ext = resyncTestExtInput.value.trim();
  if (!ext) {
    setStatus("Enter an extension to test the resync command with.", true);
    return;
  }

  resyncTestOutput.hidden = true;
  const result = await api("/api/resync/test", {
    method: "POST",
    body: JSON.stringify({ ext, resyncCommand: resyncCommandInput.value.trim() })
  });

  const lines = [`$ ${result.command}`, `exit status ${result.code}`];
  if (result.stdout.trim()) {
    lines.push(result.stdout.trim());
  }
  if (result.stderr.trim()) {
    lines.push(`stderr: ${result.stderr.trim()}`);
  }
  resyncTestOutput.textContent = lines.join("\n");
  resyncTestOutput.hidden = false;
  setStatus(result.ok ? `Resync command worked for ${ext}.` : `Resync command failed for ${ext}; see the output below.`, !result.ok);
}

for (const btn of [resyncBtn, resyncTopBtn, resyncQuickBtn]) {
  btn.addEventListener("click", () => {
    resyncCurrentPhone().catch((error) => setStatus(error.message, true));
  });
}

resyncTestBtn.addEventListener("click", () => {
  testResync().catch((error) => setStatus(error.message, true));
});

function exportLogCsv() {
  const rows = getFilteredLogEntries();
  if (rows.length === 0) {
    setStatus("Nothing to export.", true);
    return;
  }

  const scope = logScopes.find((s) => s.key === logScopeSelect.value);
  // Prefix a field starting with =,+,-,@ so spreadsheets do not treat it as a formula.
  const cell = (v) => {
    const s = String(v ?? "");
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const header = ["When", "User", "Action", "Phone", "File", "Tag", "Before", "After", "Result"];
  const lines = [header.map(cell).join(",")];

  for (const entry of rows) {
    lines.push([
      formatTimestamp(entry.ts),
      entry.user || "",
      LOG_ACTION_LABEL[entry.action] || entry.action,
      entry.station || "",
      entry.file || "",
      entry.tag || "",
      entry.before ?? "",
      entry.after ?? "",
      entry.status === "error" ? (entry.error || "Error") : "OK"
    ].map(cell).join(","));
  }

  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pbx-change-log-${(scope?.label || "server").replace(/[^\w.-]+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  setStatus(`Exported ${rows.length} log entr${rows.length === 1 ? "y" : "ies"}.`);
}

async function clearCurrentLog() {
  const key = logScopeSelect.value;
  if (!key) {
    setStatus("No log selected.", true);
    return;
  }

  const scope = logScopes.find((s) => s.key === key);
  const label = scope?.label || key;

  if (!confirm(`Permanently delete the change log for "${label}"?\n\nThis removes ${scope?.entryCount || 0} recorded entries and cannot be undone.`)) {
    return;
  }

  const data = await api(`/api/logs/${encodeURIComponent(key)}`, { method: "DELETE" });
  await refreshLogScopes();
  setStatus(`Cleared ${data.cleared} log entr${data.cleared === 1 ? "y" : "ies"} for ${label}.`);
}

connectForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = Object.fromEntries(new FormData(connectForm).entries());
  if (!body.password) {
    setStatus("Password is required to connect.", true);
    return;
  }

  if (body.profileId) {
    delete body.host;
    delete body.port;
    delete body.username;
    delete body.remoteDir;
  }

  hideHostKeyWarning();

  try {
    const data = await api("/api/connect", {
      method: "POST",
      body: JSON.stringify(body)
    });

    if (data.connection?.profileId) {
      serverSelect.value = data.connection.profileId;
      fillFormFromServer(data.connection.profileId);
    }

    lastConnectionInfo = data.connection || null;
    setConnectionCollapsed(true, data.connection || null);

    const hostKey = data.connection?.hostKey;
    setStatus(hostKey?.status === "new"
      ? `${data.message || "Connected"}. First connection: host key ${hostKey.fingerprint} has been remembered.`
      : (data.message || "Connected"));
    await refreshFiles();
    // Switch the log viewer to the server we just connected to.
    await refreshLogScopes();
  } catch (error) {
    if (error.data?.hostKeyMismatch) {
      showHostKeyWarning(error.data);
    }
    setStatus(error.message, true);
  }
});

forgetHostKeyBtn.addEventListener("click", async () => {
  const details = pendingHostKeyMismatch;
  if (!details) {
    return;
  }

  const confirmed = window.confirm(
    `Forget the stored key for ${details.host}:${details.port} and trust the new one?\n\n`
      + "Only do this if you have confirmed the fingerprint on the PBX itself."
  );
  if (!confirmed) {
    return;
  }

  try {
    await api("/api/known-hosts/forget", {
      method: "POST",
      body: JSON.stringify({ host: details.host, port: details.port })
    });
    hideHostKeyWarning();
    // The password is still in the form, so reconnecting is a re-submit.
    connectForm.requestSubmit();
  } catch (error) {
    setStatus(error.message, true);
  }
});

serverSelect.addEventListener("change", () => {
  fillFormFromServer(serverSelect.value);
});

saveServerBtn.addEventListener("click", async () => {
  try {
    await saveServerProfile();
  } catch (error) {
    setStatus(error.message, true);
  }
});

deleteServerBtn.addEventListener("click", async () => {
  try {
    await deleteSelectedServer();
  } catch (error) {
    setStatus(error.message, true);
  }
});

async function handleDisconnectClick() {
  try {
    await disconnectFromServer();
    currentFile = "";
    historyBtn.hidden = true;
    historyPanel.hidden = true;
    connectedScopeKey = null;
    bulkRollbackBtn.hidden = true;
    renderLogEntries();
    fileListEl.innerHTML = "";
    clearRows();
    setBaseline("flat-profile", []);
    filesCountEl.textContent = "0 files";
    allFiles = [];
    selectedFiles.clear();
    onSelectionChanged();
    lastConnectionInfo = null;
    setConnectionCollapsed(false);
    setStatus("Disconnected");
  } catch (error) {
    setStatus(error.message, true);
  }
}

disconnectBtn.addEventListener("click", handleDisconnectClick);
disconnectMiniBtn.addEventListener("click", handleDisconnectClick);

expandConnectionBtn.addEventListener("click", () => {
  setConnectionCollapsed(false, lastConnectionInfo);
});

collapseConnectionBtn.addEventListener("click", () => {
  setConnectionCollapsed(true, lastConnectionInfo);
});

themeToggleBtn.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

refreshBtn.addEventListener("click", async () => {
  try {
    await refreshFiles();
    setStatus("List refreshed");
  } catch (error) {
    setStatus(error.message, true);
  }
});

filesSearchInput.addEventListener("input", () => {
  filesQuery = filesSearchInput.value || "";
  renderFileList(getFilteredFiles());
});

selectAllBtn.addEventListener("click", () => {
  // "Shown" = whatever the current search filter matches, not the whole list.
  for (const file of getFilteredFiles()) {
    selectedFiles.add(file.name);
  }
  renderFileList(getFilteredFiles());
  onSelectionChanged();
});

selectNoneBtn.addEventListener("click", () => {
  selectedFiles.clear();
  renderFileList(getFilteredFiles());
  onSelectionChanged();
});

for (const el of [bulkKeyInput, bulkValueInput, bulkAttrsInput]) {
  el.addEventListener("input", invalidatePreview);
}
bulkModeSelect.addEventListener("change", () => {
  // Value and attributes are meaningless for a delete.
  const isDelete = bulkModeSelect.value === "delete";
  bulkValueInput.disabled = isDelete;
  bulkAttrsInput.disabled = isDelete;
  invalidatePreview();
});

bulkPreviewBtn.addEventListener("click", async () => {
  try {
    await previewBulkEdit();
  } catch (error) {
    setStatus(error.message, true);
  }
});

bulkApplyBtn.addEventListener("click", async () => {
  try {
    await applyBulkEdit();
  } catch (error) {
    setStatus(error.message, true);
  }
});

logScopeSelect.addEventListener("change", async () => {
  try {
    await loadLogEntries();
  } catch (error) {
    setStatus(error.message, true);
  }
});

logSearchInput.addEventListener("input", renderLogEntries);

logRefreshBtn.addEventListener("click", async () => {
  try {
    await refreshLogScopes();
    setStatus("Change log refreshed.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

logExportBtn.addEventListener("click", exportLogCsv);

logClearBtn.addEventListener("click", async () => {
  try {
    await clearCurrentLog();
  } catch (error) {
    setStatus(error.message, true);
  }
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value || "";
  applyRowVisibility();
});

hideEmptyBtn.addEventListener("click", () => {
  hideEmpty = !hideEmpty;
  applyRowVisibility();
});

function toggleShowAllFields() {
  showAllFields = !showAllFields;
  applyRowVisibility();
}

showAllTopBtn.addEventListener("click", toggleShowAllFields);
showAllBottomBtn.addEventListener("click", toggleShowAllFields);

addRowBtn.addEventListener("click", () => addRow());

async function handleSaveClick() {
  try {
    await saveCurrentFile();
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function handleCreateClick() {
  try {
    await createNewFile();
  } catch (error) {
    setStatus(error.message, true);
  }
}

saveBtn.addEventListener("click", handleSaveClick);
saveTopBtn.addEventListener("click", handleSaveClick);

createBtn.addEventListener("click", handleCreateClick);
createTopBtn.addEventListener("click", handleCreateClick);

resetBtn.addEventListener("click", resetEditorToBaseline);
resetTopBtn.addEventListener("click", resetEditorToBaseline);

// Ctrl/Cmd+S saves the open file. Worth having when the editor holds hundreds of
// rows and the Save buttons have scrolled out of reach.
document.addEventListener("keydown", (event) => {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") {
    return;
  }

  event.preventDefault();

  if (!fileNameInput.value.trim()) {
    setStatus("Nothing to save - load or name a file first.", true);
    return;
  }

  handleSaveClick();
});

loadTemplateBtn.addEventListener("click", async () => {
  try {
    await loadTemplateIntoEditor();
  } catch (error) {
    setStatus(error.message, true);
  }
});

saveTemplateBtn.addEventListener("click", async () => {
  try {
    await saveTemplate();
  } catch (error) {
    setStatus(error.message, true);
  }
});

// ===========================================================================
// Quick editor
// ===========================================================================
const tabQuick = document.getElementById("tab-quick");
const tabAdvanced = document.getElementById("tab-advanced");
const panelQuick = document.getElementById("panel-quick");
const panelAdvanced = document.getElementById("panel-advanced");
const quickButtonsEl = document.getElementById("quick-buttons");
const quickSettingsEl = document.getElementById("quick-settings");
const quickWarningEl = document.getElementById("quick-warning");
const quickForm = document.getElementById("quick-button-form");
const quickButtonTitle = document.getElementById("quick-button-title");
const quickTypeSelect = document.getElementById("quick-button-type");
const quickFieldsEl = document.getElementById("quick-button-fields");
const quickPreviewEl = document.getElementById("quick-button-preview");

let quickSchemaData = null;
let quickEditingIndex = null;
// Current values for the button form, keyed by field name.
let quickFieldValues = {};

/** "the open phone" vs "the selected phones". */
function quickScope() {
  return document.querySelector('input[name="quick-scope"]:checked')?.value || "file";
}

function sipServerForQuick() {
  // The saved profile is the source of truth; fall back to what is typed in the form
  // so it works before the profile has been saved.
  return (lastConnectionInfo?.sipServer || sipServerInput.value || "").trim();
}

/** Entries as they currently stand in the Advanced table. */
function readEntriesRaw() {
  return [...entriesBody.querySelectorAll("tr")].map((tr) => ({
    key: tr.querySelector(".tag").value.trim(),
    value: tr.querySelector(".value").value
  })).filter((e) => e.key);
}

function readLineKeyFromEditor(index) {
  return QuickConfig.readLineKey(readEntriesRaw(), index);
}

function renderQuickButtons() {
  if (!quickSchemaData) return;
  quickButtonsEl.replaceChildren();

  for (let i = 1; i <= quickSchemaData.lineKeyCount; i += 1) {
    const state = readLineKeyFromEditor(i);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "quick-button" + (state && state.type !== "unused" ? " is-set" : "");
    if (quickEditingIndex === i) card.classList.add("is-editing");

    const num = document.createElement("span");
    num.className = "quick-button-num";
    num.textContent = String(i);

    const desc = document.createElement("span");
    desc.className = "quick-button-desc";
    desc.textContent = QuickConfig.describeLineKey(state);

    const nameEl = document.createElement("span");
    nameEl.className = "quick-button-name";
    nameEl.textContent = state?.name || "";

    card.append(num, desc, nameEl);
    card.addEventListener("click", () => openQuickButton(i));
    quickButtonsEl.appendChild(card);
  }
}

function openQuickButton(index) {
  quickEditingIndex = index;
  quickForm.hidden = false;
  quickButtonTitle.textContent = `Button ${index}`;

  const state = readLineKeyFromEditor(index) || { type: "unused" };
  quickTypeSelect.value = state.type;
  // Pre-fill from the current config, so what the form shows is what gets written.
  quickFieldValues = {
    target: state.target || "",
    name: state.name || "",
    password: state.password || "",
    shortName: state.shortName || "",
    custom: state.custom || ""
  };

  renderQuickFields();
  renderQuickButtons();
  quickForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/** Each button type needs different inputs, so the form is built from the schema. */
function renderQuickFields() {
  const def = quickSchemaData?.lineKeyTypes.find((t) => t.id === quickTypeSelect.value);
  quickFieldsEl.replaceChildren();

  for (const field of def?.fields || []) {
    const label = document.createElement("label");
    label.textContent = def.labels[field] || field;

    const input = document.createElement("input");
    input.value = quickFieldValues[field] || "";
    input.placeholder = def.placeholders[field] || "";
    if (field === "custom") {
      input.className = "mono";
    }
    input.addEventListener("input", () => {
      quickFieldValues[field] = input.value;
      updateQuickPreview();
    });

    label.appendChild(input);
    quickFieldsEl.appendChild(label);
  }

  updateQuickPreview();
}

/** Shows exactly what will be written, so nothing is a surprise. */
function updateQuickPreview() {
  try {
    const produced = QuickConfig.buildLineKey({
      index: quickEditingIndex,
      type: quickTypeSelect.value,
      server: sipServerForQuick(),
      ...quickFieldValues
    });
    quickPreviewEl.textContent = produced.map((p) => `${p.key} = ${p.value || "(empty)"}`).join("   |   ");
    quickPreviewEl.classList.remove("is-error");
  } catch (error) {
    quickPreviewEl.textContent = error.message;
    quickPreviewEl.classList.add("is-error");
  }
}

function renderQuickSettings() {
  if (!quickSchemaData) return;
  quickSettingsEl.replaceChildren();
  const entries = readEntriesRaw();

  for (const setting of quickSchemaData.settings) {
    const row = document.createElement("div");
    row.className = "quick-setting";

    const label = document.createElement("label");
    label.textContent = setting.label;
    const input = document.createElement("input");
    input.placeholder = setting.placeholder || "";
    input.value = QuickConfig.readSetting(setting.id, entries);
    label.appendChild(input);

    const hint = document.createElement("p");
    hint.className = "quick-setting-hint";
    hint.textContent = setting.hint || "";

    const apply = document.createElement("button");
    apply.type = "button";
    apply.textContent = "Apply";
    apply.addEventListener("click", () => applyQuickSetting(setting.id, input.value));

    row.append(label, apply);
    quickSettingsEl.append(row, hint);
  }
}

// Building settings and line keys both live in quick-config.js, shared with the server.

/** Writes produced entries into the Advanced table so Save/Reset behave normally. */
function mergeIntoEditor(produced) {
  for (const item of produced) {
    const row = [...entriesBody.querySelectorAll("tr")]
      .find((tr) => tr.querySelector(".tag").value.trim() === item.key);

    if (row) {
      row.querySelector(".value").value = item.value;
      if (item.attributes) {
        const attrsInput = row.querySelector(".attrs");
        let existing = {};
        try { existing = JSON.parse(attrsInput.value || "{}"); } catch { existing = {}; }
        attrsInput.value = JSON.stringify({ ...existing, ...item.attributes });
      }
      row.classList.remove("deleted");
    } else {
      addRow({ key: item.key, value: item.value, attributes: item.attributes || {} });
    }
  }
  applyRowVisibility();
}

async function applyQuickChange(produced, description) {
  if (quickScope() === "bulk") {
    if (selectedFiles.size === 0) {
      setStatus("Tick some phones in the XML Files list first.", true);
      return;
    }

    previewedEdit = {
      fileNames: [...selectedFiles],
      edits: produced.map((p) => ({ key: p.key, value: p.value, attributes: p.attributes || null, mode: "set" })),
      description
    };

    // Route through the same preview-then-confirm path as a manual bulk edit.
    const job = await runBulkJobWithProgress(previewedEdit, { dryRun: true, verb: "Previewing" });
    renderBulkResults(job);

    const changeCount = job.summary?.changed || 0;
    if (changeCount === 0) {
      previewedEdit = null;
      bulkApplyBtn.disabled = true;
      setStatus(`${description}: every selected phone already matches.`);
      return;
    }

    bulkApplyBtn.disabled = false;
    setStatus(`${description}: ${changeCount} phone${changeCount === 1 ? "" : "s"} would change. Review below, then Apply to PBX.`);
    document.getElementById("bulk-results").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (!currentFile && !fileNameInput.value.trim()) {
    setStatus("Open a phone from the list first, or give the new file a name.", true);
    return;
  }

  mergeIntoEditor(produced);
  renderQuickButtons();
  setStatus(`${description} set. Not written yet - press Save / Upload.`);
}

function applyQuickSetting(id, value) {
  try {
    const produced = QuickConfig.buildSetting(id, value);
    const label = quickSchemaData.settings.find((s) => s.id === id)?.label || id;
    applyQuickChange(produced, label).catch((e) => setStatus(e.message, true));
  } catch (error) {
    setStatus(error.message, true);
  }
}

document.getElementById("quick-button-apply").addEventListener("click", () => {
  try {
    const produced = QuickConfig.buildLineKey({
      index: quickEditingIndex,
      type: quickTypeSelect.value,
      server: sipServerForQuick(),
      ...quickFieldValues
    });
    applyQuickChange(produced, `Button ${quickEditingIndex}`).catch((e) => setStatus(e.message, true));
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("quick-button-close").addEventListener("click", () => {
  quickForm.hidden = true;
  quickEditingIndex = null;
  renderQuickButtons();
});

// Changing the type changes which fields exist, so rebuild the form.
quickTypeSelect.addEventListener("change", renderQuickFields);

for (const radio of document.querySelectorAll('input[name="quick-scope"]')) {
  radio.addEventListener("change", updateQuickScopeHints);
}

function updateQuickScopeHints() {
  const bulk = quickScope() === "bulk";
  document.getElementById("quick-scope-file-label").textContent =
    currentFile ? `the open phone (${currentFile})` : "the open phone";
  document.getElementById("quick-scope-bulk-label").textContent =
    `the selected phones (${selectedFiles.size})`;

  const problems = [];
  if (bulk && selectedFiles.size === 0) {
    problems.push("No phones are ticked in the XML Files list.");
  }
  if (!sipServerForQuick()) {
    problems.push("No SIP server is set on this PBX profile, so speed dial and BLF buttons cannot be built.");
  }

  quickWarningEl.textContent = problems.join(" ");
  quickWarningEl.hidden = problems.length === 0;
}

function showTab(which) {
  const quick = which === "quick";
  tabQuick.classList.toggle("is-active", quick);
  tabAdvanced.classList.toggle("is-active", !quick);
  tabQuick.setAttribute("aria-selected", String(quick));
  tabAdvanced.setAttribute("aria-selected", String(!quick));
  panelQuick.hidden = !quick;
  panelAdvanced.hidden = quick;

  if (quick) {
    renderQuickButtons();
    renderQuickSettings();
    updateQuickScopeHints();
  }
}

tabQuick.addEventListener("click", () => showTab("quick"));
tabAdvanced.addEventListener("click", () => showTab("advanced"));

async function loadQuickSchema() {
  quickSchemaData = await api("/api/quick/schema");

  quickTypeSelect.replaceChildren();
  for (const type of quickSchemaData.lineKeyTypes) {
    const opt = document.createElement("option");
    opt.value = type.id;
    opt.textContent = type.label;
    quickTypeSelect.appendChild(opt);
  }

  renderQuickButtons();
  renderQuickSettings();
  updateQuickScopeHints();
}

// ===========================================================================
// Authentication
// ===========================================================================
const authOverlay = document.getElementById("auth-overlay");
const authTitle = document.getElementById("auth-title");
const authMessage = document.getElementById("auth-message");
const authLoginForm = document.getElementById("auth-login-form");
const authMfaForm = document.getElementById("auth-mfa-form");
const authRecoveryForm = document.getElementById("auth-recovery-form");
const authSetupForm = document.getElementById("auth-setup-form");
const authEnrol = document.getElementById("auth-enrol");
const authRecoveryCodes = document.getElementById("auth-recovery-codes");

const currentUserEl = document.getElementById("current-user");
const accountBtn = document.getElementById("account-btn");
const usersBtn = document.getElementById("users-btn");
const logoutBtn = document.getElementById("logout-btn");
const usersPanel = document.getElementById("users-panel");
const accountPanel = document.getElementById("account-panel");
const usersResultsEl = document.getElementById("users-results");
const usersCountEl = document.getElementById("users-count");

let pendingLoginToken = null;
let issuedRecoveryCodes = [];

const AUTH_STEPS = {
  login: authLoginForm,
  mfa: authMfaForm,
  recovery: authRecoveryForm,
  setup: authSetupForm,
  enrol: authEnrol,
  codes: authRecoveryCodes
};

const AUTH_TITLES = {
  login: "Sign in",
  mfa: "Two-factor authentication",
  recovery: "Use a recovery code",
  setup: "Welcome - create your administrator",
  enrol: "Set up two-factor authentication",
  codes: "Save your recovery codes"
};

function showAuthOverlay(step) {
  authOverlay.hidden = false;
  document.body.classList.add("auth-locked");
  setAuthStep(step);
}

function hideAuthOverlay() {
  authOverlay.hidden = true;
  document.body.classList.remove("auth-locked");
  setAuthMessage("");
}

function setAuthStep(step) {
  for (const [name, el] of Object.entries(AUTH_STEPS)) {
    el.hidden = name !== step;
  }
  authTitle.textContent = AUTH_TITLES[step] || "Sign in";
  setAuthMessage("");

  const focus = {
    login: "auth-username", mfa: "auth-mfa-code", recovery: "auth-recovery-code",
    setup: "setup-username", enrol: "enrol-code"
  }[step];
  if (focus) {
    setTimeout(() => document.getElementById(focus)?.focus(), 30);
  }
}

function setAuthMessage(text, isError = true) {
  authMessage.textContent = text || "";
  authMessage.hidden = !text;
  authMessage.classList.toggle("is-error", isError);
}

/** Applies the signed-in identity to the chrome and reveals admin-only controls. */
function applyIdentity(user, token) {
  currentUser = user;
  csrfToken = token;

  const signedIn = Boolean(user);
  currentUserEl.hidden = !signedIn;
  accountBtn.hidden = !signedIn;
  logoutBtn.hidden = !signedIn;
  usersBtn.hidden = !signedIn || user.role !== "admin";

  if (signedIn) {
    currentUserEl.textContent = user.role === "admin" ? `${user.username} (admin)` : user.username;
  }

  if (!signedIn) {
    usersPanel.hidden = true;
    accountPanel.hidden = true;
  }
}

async function refreshIdentity() {
  const me = await (await fetch("/api/auth/me")).json();

  if (me.setupRequired) {
    applyIdentity(null, null);
    showAuthOverlay("setup");
    return false;
  }

  if (!me.authenticated) {
    applyIdentity(null, null);
    showAuthOverlay("login");
    return false;
  }

  applyIdentity(me.user, me.csrfToken);
  hideAuthOverlay();
  return true;
}

authSetupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("setup-username").value.trim();
  const password = document.getElementById("setup-password").value;
  const confirm2 = document.getElementById("setup-password2").value;

  if (password !== confirm2) {
    setAuthMessage("Passwords do not match.");
    return;
  }

  try {
    const data = await api("/api/auth/setup", { method: "POST", body: JSON.stringify({ username, password }) });
    applyIdentity(data.user, data.csrfToken);
    await beginEnrolment();
  } catch (error) {
    setAuthMessage(error.message);
  }
});

authLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("auth-username").value.trim();
  const password = document.getElementById("auth-password").value;

  try {
    const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
    document.getElementById("auth-password").value = "";

    if (data.mfaRequired) {
      pendingLoginToken = data.pendingToken;
      setAuthStep("mfa");
      return;
    }

    applyIdentity(data.user, data.csrfToken);
    // Nudge, do not force: an operator locked out mid-incident helps nobody.
    if (data.mfaSetupRequired) {
      await beginEnrolment();
      return;
    }
    await onSignedIn();
  } catch (error) {
    setAuthMessage(error.message);
  }
});

authMfaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/api/auth/login/mfa", {
      method: "POST",
      body: JSON.stringify({ pendingToken: pendingLoginToken, code: document.getElementById("auth-mfa-code").value })
    });
    document.getElementById("auth-mfa-code").value = "";
    applyIdentity(data.user, data.csrfToken);
    await onSignedIn();
  } catch (error) {
    setAuthMessage(error.message);
  }
});

authRecoveryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/api/auth/login/recovery", {
      method: "POST",
      body: JSON.stringify({ pendingToken: pendingLoginToken, code: document.getElementById("auth-recovery-code").value })
    });
    document.getElementById("auth-recovery-code").value = "";
    applyIdentity(data.user, data.csrfToken);
    await onSignedIn();
    setStatus(`Signed in with a recovery code. ${data.recoveryCodesRemaining} remaining.`, data.recoveryCodesRemaining === 0);
  } catch (error) {
    setAuthMessage(error.message);
  }
});

document.getElementById("auth-use-recovery").addEventListener("click", () => setAuthStep("recovery"));
document.getElementById("auth-use-totp").addEventListener("click", () => setAuthStep("mfa"));

async function beginEnrolment() {
  try {
    const data = await api("/api/auth/mfa/setup", { method: "POST", body: "{}" });
    document.getElementById("enrol-qr").src = data.qrDataUrl;
    document.getElementById("enrol-secret").value = data.secret;
    showAuthOverlay("enrol");
  } catch (error) {
    setAuthMessage(error.message);
  }
}

document.getElementById("enrol-confirm").addEventListener("click", async () => {
  try {
    const data = await api("/api/auth/mfa/confirm", {
      method: "POST",
      body: JSON.stringify({ code: document.getElementById("enrol-code").value })
    });
    issuedRecoveryCodes = data.recoveryCodes || [];
    document.getElementById("recovery-code-list").textContent = issuedRecoveryCodes.join("\n");
    setAuthStep("codes");
  } catch (error) {
    setAuthMessage(error.message);
  }
});

document.getElementById("enrol-skip").addEventListener("click", async () => {
  await onSignedIn();
});

document.getElementById("recovery-copy").addEventListener("click", () => {
  navigator.clipboard?.writeText(issuedRecoveryCodes.join("\n"));
  setAuthMessage("Copied to clipboard.", false);
});

document.getElementById("recovery-download").addEventListener("click", () => {
  const blob = new Blob([issuedRecoveryCodes.join("\r\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pbx-manager-recovery-codes.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

document.getElementById("recovery-done").addEventListener("click", async () => {
  issuedRecoveryCodes = [];
  await onSignedIn();
});

logoutBtn.addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST", body: "{}" });
  } catch {
    // Signing out locally is what matters even if the call failed.
  }
  applyIdentity(null, null);
  currentFile = "";
  allFiles = [];
  selectedFiles.clear();
  fileListEl.innerHTML = "";
  clearRows();
  showAuthOverlay("login");
});

accountBtn.addEventListener("click", () => {
  accountPanel.hidden = !accountPanel.hidden;
  usersPanel.hidden = true;
  if (!accountPanel.hidden) {
    renderAccountPanel();
    accountPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

usersBtn.addEventListener("click", async () => {
  usersPanel.hidden = !usersPanel.hidden;
  accountPanel.hidden = true;
  if (!usersPanel.hidden) {
    await refreshUsers();
    usersPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

function renderAccountPanel() {
  const enrolled = Boolean(currentUser?.mfaEnrolled);
  document.getElementById("account-mfa-state").textContent = `Two-factor: ${enrolled ? "on" : "off"}`;
  document.getElementById("acct-enable-mfa").hidden = enrolled;
  document.getElementById("acct-disable-mfa").hidden = !enrolled;
}

document.getElementById("acct-enable-mfa").addEventListener("click", beginEnrolment);

document.getElementById("acct-disable-mfa").addEventListener("click", async () => {
  const password = prompt("Confirm your password to turn off two-factor authentication:");
  if (!password) {
    return;
  }
  try {
    await api("/api/auth/mfa/disable", { method: "POST", body: JSON.stringify({ password }) });
    await refreshIdentity();
    renderAccountPanel();
    setStatus("Two-factor authentication turned off.", true);
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("acct-change-password").addEventListener("click", async () => {
  const currentPassword = document.getElementById("acct-current").value;
  const newPassword = document.getElementById("acct-new").value;
  try {
    await api("/api/auth/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
    document.getElementById("acct-current").value = "";
    document.getElementById("acct-new").value = "";
    setStatus("Password changed.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

async function refreshUsers() {
  const data = await api("/api/users");
  const users = data.users || [];
  usersCountEl.textContent = `${users.length} user${users.length === 1 ? "" : "s"}`;
  usersResultsEl.replaceChildren();

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Username", "Role", "Two-factor", "Last sign-in", ""]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const user of users) {
    const tr = document.createElement("tr");
    for (const text of [
      user.username,
      user.role === "admin" ? "Administrator" : "User",
      user.mfaEnrolled ? "Enabled" : "Not set up",
      user.lastLoginAt ? formatTimestamp(user.lastLoginAt) : "Never"
    ]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }

    const actions = document.createElement("td");
    const wrap = document.createElement("div");
    wrap.className = "row-actions";

    const resetBtn2 = document.createElement("button");
    resetBtn2.className = "secondary small";
    resetBtn2.textContent = "Reset MFA";
    resetBtn2.addEventListener("click", async () => {
      if (!confirm(`Reset two-factor for "${user.username}"?\n\nThey will sign in with their password alone until they enrol again.`)) {
        return;
      }
      try {
        await api(`/api/users/${encodeURIComponent(user.id)}/reset-mfa`, { method: "POST", body: "{}" });
        await refreshUsers();
        setStatus(`Two-factor reset for ${user.username}.`);
      } catch (error) {
        setStatus(error.message, true);
      }
    });
    wrap.appendChild(resetBtn2);

    if (user.id !== currentUser?.id) {
      const del = document.createElement("button");
      del.className = "ghost-danger small";
      del.textContent = "Delete";
      del.addEventListener("click", async () => {
        if (!confirm(`Delete the account "${user.username}"?\n\nThis cannot be undone. Their entries stay in the change log.`)) {
          return;
        }
        try {
          await api(`/api/users/${encodeURIComponent(user.id)}`, { method: "DELETE" });
          await refreshUsers();
          setStatus(`Deleted ${user.username}.`);
        } catch (error) {
          setStatus(error.message, true);
        }
      });
      wrap.appendChild(del);
    }

    actions.appendChild(wrap);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  usersResultsEl.appendChild(table);
}

document.getElementById("add-user-btn").addEventListener("click", async () => {
  const username = document.getElementById("new-username").value.trim();
  const password = document.getElementById("new-password").value;
  const role = document.getElementById("new-role").value;

  try {
    await api("/api/users", { method: "POST", body: JSON.stringify({ username, password, role }) });
    document.getElementById("new-username").value = "";
    document.getElementById("new-password").value = "";
    await refreshUsers();
    setStatus(`Added ${username}. They should enrol two-factor at first sign-in.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

/** Loads everything the signed-in app needs. */
async function onSignedIn() {
  hideAuthOverlay();
  renderAccountPanel();

  try {
    await refreshServers();
    await refreshTemplates();
    await loadQuickSchema();

    const data = await api("/api/status");
    if (data.connected && data.connection) {
      lastConnectionInfo = data.connection;
      setConnectionCollapsed(true, data.connection);
      setStatus(`Connected: ${data.connection.host} (${data.connection.remoteDir})`);
      if (data.connection.profileId) {
        serverSelect.value = data.connection.profileId;
        fillFormFromServer(data.connection.profileId);
      }
      await refreshFiles();
    } else {
      setConnectionCollapsed(false);
    }
  } catch (_) {
    // Ignore load errors; individual panels report their own failures.
  }

  try {
    await refreshLogScopes();
  } catch (_) {
    // Logs are non-critical at startup.
  }
}

(async function init() {
  applyTheme(localStorage.getItem("pbx-theme") || "light");

  // Nothing loads until we know who (if anyone) is signed in.
  const signedIn = await refreshIdentity();
  if (signedIn) {
    await onSignedIn();
  }
})();

