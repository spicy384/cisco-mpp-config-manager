const statusEl = document.getElementById("status");
const connectionPanel = document.getElementById("connection-panel");
const connectionSummary = document.getElementById("connection-summary");
const connectedServerNameEl = document.getElementById("connected-server-name");
const connectForm = document.getElementById("connect-form");
const disconnectBtn = document.getElementById("disconnect-btn");
const serverAuthSelect = document.getElementById("server-auth");
const serverPasswordLabel = document.getElementById("server-password-label");
const sshKeyMetaEl = document.getElementById("sshkey-meta");
const sshKeyPresentEl = document.getElementById("sshkey-present");
const sshKeyAbsentEl = document.getElementById("sshkey-absent");
const sshKeyPublicEl = document.getElementById("sshkey-public");
const sshKeyFingerprintEl = document.getElementById("sshkey-fingerprint");
const sshKeyCopyBtn = document.getElementById("sshkey-copy-btn");
const sshKeyGenerateBtn = document.getElementById("sshkey-generate-btn");
const sshKeyRemoveBtn = document.getElementById("sshkey-remove-btn");
const phonesMetaEl = document.getElementById("phones-meta");
const phonesSearchInput = document.getElementById("phones-search");
const phonesRefreshBtn = document.getElementById("phones-refresh-btn");
const phonesExportBtn = document.getElementById("phones-export-btn");
const phonesResultsEl = document.getElementById("phones-results");
const auditPanel = document.getElementById("audit-panel");
const auditMetaEl = document.getElementById("audit-meta");
const auditSearchInput = document.getElementById("audit-search");
const auditFailuresOnly = document.getElementById("audit-failures-only");
const auditRefreshBtn = document.getElementById("audit-refresh-btn");
const auditExportBtn = document.getElementById("audit-export-btn");
const auditResultsEl = document.getElementById("audit-results");
const pbxSwitchSelect = document.getElementById("pbx-switch");
const liveLinksEl = document.getElementById("live-links");
const quickConnectForm = document.getElementById("quick-connect-form");
const quickServerSelect = document.getElementById("quick-server");
const quickPasswordInput = document.getElementById("quick-password");
const manageServersBtn = document.getElementById("manage-servers-btn");
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
const bulkRollbackResyncLabel = document.getElementById("bulk-rollback-resync-label");
const bulkRollbackResyncInput = document.getElementById("bulk-rollback-resync");
const historyBtn = document.getElementById("history-btn");
const historyPanel = document.getElementById("history-panel");
const historyMetaEl = document.getElementById("history-meta");
const historyListEl = document.getElementById("history-list");
const historyCloseBtn = document.getElementById("history-close-btn");
const historyDiffEl = document.getElementById("history-diff");
const historyDiffTitle = document.getElementById("history-diff-title");
const historyDiffBody = document.getElementById("history-diff-body");
const historyDiffCloseBtn = document.getElementById("history-diff-close-btn");
const resyncCommandInput = document.getElementById("resync-command");
const resyncTestExtInput = document.getElementById("resync-test-ext");
const resyncTestBtn = document.getElementById("resync-test-btn");
const resyncTestOutput = document.getElementById("resync-test-output");
const resyncBtn = document.getElementById("resync-btn");
const resyncTopBtn = document.getElementById("resync-top-btn");
const resyncQuickBtn = document.getElementById("resync-quick-btn");
const saveQuickBtn = document.getElementById("save-quick-btn");
const quickStagedNote = document.getElementById("quick-staged-note");
const statusCommandInput = document.getElementById("status-command");
const quickModelSelect = document.getElementById("quick-model");
const quickKemsLabel = document.getElementById("quick-kems-label");
const quickKemsSelect = document.getElementById("quick-kems");
const quickCustomLabel = document.getElementById("quick-custom-label");
const quickCustomKeysInput = document.getElementById("quick-custom-keys");
const quickModelNote = document.getElementById("quick-model-note");
const profileModelSelect = document.getElementById("profile-model");
const profileKemsLabel = document.getElementById("profile-kems-label");
const profileKemsSelect = document.getElementById("profile-kems");
const profileCustomLabel = document.getElementById("profile-custom-label");
const profileCustomKeysInput = document.getElementById("profile-custom-keys");
const replaceBtn = document.getElementById("replace-btn");
const deletePhoneBtn = document.getElementById("delete-phone-btn");
const replacePanel = document.getElementById("replace-panel");
const replaceSourceLabel = document.getElementById("replace-source-label");
const replaceCloseBtn = document.getElementById("replace-close-btn");
const replaceMacInput = document.getElementById("replace-mac");
const replaceFilePreview = document.getElementById("replace-file-preview");
const replaceConfirmBtn = document.getElementById("replace-confirm-btn");
const cloneBtn = document.getElementById("clone-btn");
const clonePanel = document.getElementById("clone-panel");
const cloneSourceLabel = document.getElementById("clone-source-label");
const cloneCloseBtn = document.getElementById("clone-close-btn");
const cloneMacInput = document.getElementById("clone-mac");
const cloneExtInput = document.getElementById("clone-ext");
const cloneDisplayInput = document.getElementById("clone-display");
const clonePasswordInput = document.getElementById("clone-password");
const cloneStationInput = document.getElementById("clone-station");
const cloneFilePreview = document.getElementById("clone-file-preview");
const cloneCreateBtn = document.getElementById("clone-create-btn");
const provisionSourceSelect = document.getElementById("provision-source");
const provisionFileInput = document.getElementById("provision-file");
const provisionTextInput = document.getElementById("provision-text");
const provisionCheckBtn = document.getElementById("provision-check-btn");
const provisionCreateBtn = document.getElementById("provision-create-btn");
const provisionCountEl = document.getElementById("provision-count");
const provisionProgressEl = document.getElementById("provision-progress");
const provisionProgressLabelEl = document.getElementById("provision-progress-label");
const provisionProgressBarEl = document.getElementById("provision-progress-bar");
const provisionResultsEl = document.getElementById("provision-results");
const driftBaselineSelect = document.getElementById("drift-baseline");
const driftIncludeInput = document.getElementById("drift-include");
const driftIgnoreInput = document.getElementById("drift-ignore");
const driftScopeSelect = document.getElementById("drift-scope");
const driftBtn = document.getElementById("drift-btn");
const driftSelectBtn = document.getElementById("drift-select-btn");
const driftCountEl = document.getElementById("drift-count");
const driftProgressEl = document.getElementById("drift-progress");
const driftProgressLabelEl = document.getElementById("drift-progress-label");
const driftProgressBarEl = document.getElementById("drift-progress-bar");
const driftResultsEl = document.getElementById("drift-results");
const findTagInput = document.getElementById("find-tag");
const findValueInput = document.getElementById("find-value");
const findModeSelect = document.getElementById("find-mode");
const findBtn = document.getElementById("find-btn");
const findSelectBtn = document.getElementById("find-select-btn");
const findCountEl = document.getElementById("find-count");
const findProgressEl = document.getElementById("find-progress");
const findProgressLabelEl = document.getElementById("find-progress-label");
const findProgressBarEl = document.getElementById("find-progress-bar");
const findResultsEl = document.getElementById("find-results");
const regCountEl = document.getElementById("reg-count");
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
// The exact state of the open file as loaded, so a save can be refused if the file
// changed on the PBX in the meantime.
let currentFileVersion = null;
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
  showToast(message, isError);
}

// The status line sits at the top of a long page, so every message is also shown as
// a toast pinned to the window. Errors stay until dismissed; the rest fade on their own.
const TOAST_LIFETIME_MS = 5000;
const MAX_TOASTS = 4;

function showToast(message, isError = false) {
  const container = document.getElementById("toasts");
  const text = String(message || "").trim();
  if (!container || !text) {
    return;
  }

  // The same message again (a repeated click) refreshes the toast rather than stacking.
  for (const existing of container.children) {
    if (existing.dataset.message === text) {
      existing.remove();
    }
  }

  const toast = document.createElement("div");
  toast.className = `toast${isError ? " is-error" : ""}`;
  toast.dataset.message = text;

  const body = document.createElement("span");
  body.className = "toast-text";
  body.textContent = text;

  const close = document.createElement("button");
  close.type = "button";
  close.className = "toast-close";
  close.setAttribute("aria-label", "Dismiss");
  close.textContent = "\u00d7";
  close.addEventListener("click", () => toast.remove());

  toast.append(body, close);
  container.appendChild(toast);

  while (container.children.length > MAX_TOASTS) {
    container.firstElementChild.remove();
  }

  if (!isError) {
    setTimeout(() => toast.remove(), TOAST_LIFETIME_MS);
  }
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

/**
 * Switches the bar at the top of every page between "connected to X" and the quick
 * connect controls. (The name predates the pages: the bar used to be a collapsible panel.)
 */
function setConnectionCollapsed(collapsed, connectionData = null) {
  const info = connectionData || lastConnectionInfo;

  connectionSummary.hidden = !collapsed;
  quickConnectForm.hidden = collapsed;
  document.body.classList.toggle("pbx-connected", collapsed);

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

    // The PBX connection ended on its own: drop back to the connect form, whichever
    // action happened to discover it.
    if (data.connectionLost) {
      data.error = handleConnectionLost(data);
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
    const stationRow = makeFileRowDiv("file-station", station);
    const reg = registrations?.files?.[file.name];
    if (reg) {
      const dot = document.createElement("span");
      dot.className = `reg-dot reg-${reg.status}`;
      dot.title = describeRegistration(reg);
      stationRow.prepend(dot);
    }
    details.appendChild(stationRow);
    details.appendChild(makeFileRowDiv("file-name", file.name, true));
    details.appendChild(makeFileRowDiv("file-size", `${(file.size || 0).toLocaleString()} bytes`));

    li.appendChild(checkbox);
    li.appendChild(details);

    if (file.name === currentFile) {
      li.classList.add("active");
    }

    details.addEventListener("click", () => {
      if (!confirmDiscardEdits(file.name === currentFile ? "reload this phone" : "open another phone")) {
        return;
      }
      loadFile(file.name).catch((error) => setStatus(error.message, true));
    });
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

  const quickSelected = quickServerSelect.value;
  quickServerSelect.replaceChildren();
  const prompt = document.createElement("option");
  prompt.value = "";
  prompt.textContent = servers.length ? "Choose a saved server..." : "No saved servers yet";
  quickServerSelect.appendChild(prompt);
  for (const server of servers) {
    const option = document.createElement("option");
    option.value = server.id;
    option.textContent = `${server.name} (${server.host})`;
    quickServerSelect.appendChild(option);
  }
  quickServerSelect.value = servers.some((s) => s.id === quickSelected)
    ? quickSelected
    : (servers.length === 1 ? servers[0].id : "");
  syncAuthControls();
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
  populateProvisionSources();
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
  statusCommandInput.value = server.statusCommand || "";
  writeModelControls(profileControls, server.defaultModel || null);
  serverAuthSelect.value = server.auth === "key" ? "key" : "password";
  syncAuthControls();
}

/** True when this saved server signs in with the app's key, so no password is asked for. */
function serverUsesKey(serverId) {
  return servers.find((s) => s.id === serverId)?.auth === "key";
}

/** Password boxes are only shown where a password will actually be used. */
function syncAuthControls() {
  serverPasswordLabel.hidden = serverAuthSelect.value === "key";
  quickPasswordInput.hidden = serverUsesKey(quickServerSelect.value);
}

async function refreshFiles() {
  setFilesLoading(true);
  try {
    const data = await api("/api/files");
    allFiles = data.files || [];
    populateDriftBaselines();
    populateProvisionSources();

    // Drop selections for files that no longer exist on the server.
    const present = new Set(allFiles.map((file) => file.name));
    for (const name of [...selectedFiles]) {
      if (!present.has(name)) {
        selectedFiles.delete(name);
      }
    }

    renderFileList(getFilteredFiles());
    onSelectionChanged();
    renderPhoneReport();
  } finally {
    setFilesLoading(false);
  }

  // Registration status rides along with the list; a failure must not break the list.
  refreshRegistrations().catch((error) => {
    regCountEl.hidden = false;
    regCountEl.textContent = "Status unavailable";
    regCountEl.title = error.message;
  });
}

// --- registration status -----------------------------------------------------------

let registrations = null;
const REGISTRATION_POLL_MS = 60000;

const REG_LABEL = {
  online: "Registered",
  unreachable: "Registered but not responding",
  unknown: "Registered, status unknown",
  unregistered: "Not registered"
};

function describeRegistration(reg) {
  const parts = [`${REG_LABEL[reg.status] || reg.status} (${reg.ext})`];
  if (reg.ip) {
    parts.push(`from ${reg.ip}${reg.port ? `:${reg.port}` : ""}`);
  }
  if (reg.rtt !== null && reg.rtt !== undefined) {
    parts.push(`RTT ${reg.rtt} ms`);
  }
  return parts.join(" - ");
}

async function refreshRegistrations(force = false) {
  if (!lastConnectionInfo) {
    registrations = null;
    regCountEl.hidden = true;
    return;
  }

  registrations = await api(`/api/registrations${force ? "?refresh=1" : ""}`);
  const { withExtension, online } = registrations.summary || { withExtension: 0, online: 0 };

  regCountEl.hidden = false;
  if (registrations.format === "unknown") {
    regCountEl.textContent = "Status unavailable";
    regCountEl.title = registrations.output
      ? `The PBX did not return a contact list:\n${registrations.output}`
      : "The PBX returned nothing for the registration status command.";
    regCountEl.className = "badge reg-badge reg-badge-error";
  } else {
    regCountEl.textContent = `${online} of ${withExtension} registered`;
    regCountEl.title = `As of ${formatTimestamp(registrations.fetchedAt)} via ${registrations.command}`;
    regCountEl.className = `badge reg-badge ${online === withExtension ? "reg-badge-ok" : "reg-badge-partial"}`;
  }

  renderFileList(getFilteredFiles());
  renderPhoneReport();
}

// Keep the dots and the list of connected PBXs fresh while someone is looking at the page.
setInterval(() => {
  if (!currentUser || document.visibilityState !== "visible") {
    return;
  }
  if (lastConnectionInfo) {
    refreshRegistrations().catch(() => {});
  }
  api("/api/status").then((data) => {
    applyConnections(data.connections);
    if (lastConnectionInfo && !data.connected) {
      // Closed by someone else, or its profile was deleted: same as a dropped line.
      handleConnectionLost({ error: data.lostMessage || "The connection to the PBX was closed. Reconnect to continue.", lastDisconnect: data.lastDisconnect });
    }
  }).catch(() => {});
}, REGISTRATION_POLL_MS);

// --- phone report ---------------------------------------------------------------------------------

/** "spa001122aabbcc.xml" -> "00:11:22:AA:BB:CC"; anything else is shown as the file name. */
function macFromFileName(name) {
  const m = /^spa([0-9a-f]{12}).xml$/i.exec(String(name || ""));
  return m ? m[1].toUpperCase().match(/.{2}/g).join(":") : name;
}

/** Everything known about each phone, joined from the list, registration status and the log. */
function phoneReportRows() {
  const lastChange = new Map();
  // The change log holds one server at a time; use it only when it is this one's.
  if (connectedScopeKey && logScopeSelect.value === connectedScopeKey) {
    for (const entry of logEntries) {
      if (entry.file && entry.status !== "error" && (lastChange.get(entry.file) || 0) < entry.ts) {
        lastChange.set(entry.file, entry.ts);
      }
    }
  }

  return allFiles.map((file) => {
    const reg = registrations?.files?.[file.name] || null;
    const model = file.model || lastConnectionInfo?.defaultModel || null;
    return {
      name: file.name,
      mac: macFromFileName(file.name),
      station: file.stationDisplayName || "",
      extension: file.extension || "",
      model: QuickConfig.describeModelChoice(model || { model: quickSchemaData?.defaultModel || "8841" }).replace(/:.*$/, ""),
      modelSet: Boolean(file.model),
      status: file.extension ? (reg ? reg.status : "unknown") : "no-line",
      statusLabel: file.extension ? (reg ? REG_LABEL[reg.status] || reg.status : "Not checked") : "No line 1",
      address: reg && reg.ip ? `${reg.ip}${reg.port ? `:${reg.port}` : ""}` : "",
      rtt: reg && reg.rtt !== null && reg.rtt !== undefined ? reg.rtt : null,
      size: file.size || 0,
      lastChange: lastChange.get(file.name) || null
    };
  }).sort((a, b) => (a.station || a.name).localeCompare(b.station || b.name));
}

function filteredPhoneReport() {
  const q = phonesSearchInput.value.trim().toLowerCase();
  const rows = phoneReportRows();
  if (!q) {
    return rows;
  }
  return rows.filter((row) => [row.station, row.name, row.mac, row.extension, row.model, row.statusLabel, row.address]
    .some((value) => String(value ?? "").toLowerCase().includes(q)));
}

function renderPhoneReport() {
  phonesResultsEl.replaceChildren();
  if (!lastConnectionInfo) {
    phonesMetaEl.textContent = "Not connected";
    return;
  }

  const rows = filteredPhoneReport();
  const all = phoneReportRows();
  const online = all.filter((r) => r.status === "online").length;
  const withLine = all.filter((r) => r.status !== "no-line").length;
  phonesMetaEl.textContent = `${rows.length === all.length ? all.length : `${rows.length} of ${all.length}`} phone${all.length === 1 ? "" : "s"}, ${online} of ${withLine} registered`;

  if (rows.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = all.length ? "No phones match the filter." : "No phone configs on this PBX yet.";
    phonesResultsEl.appendChild(p);
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Phone", "MAC address", "Ext.", "Model", "Status", "Address", "RTT", "Size", "Last change", ""]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    if (row.name === currentFile) {
      tr.classList.add("is-compared");
    }

    const stationTd = document.createElement("td");
    const dot = document.createElement("span");
    dot.className = `reg-dot reg-${row.status === "no-line" || row.status === "unknown" ? "none" : row.status}`;
    stationTd.appendChild(dot);
    stationTd.appendChild(document.createTextNode(row.station || "(no name)"));
    tr.appendChild(stationTd);

    const macTd = document.createElement("td");
    macTd.textContent = row.mac;
    macTd.title = row.name;
    macTd.className = "mono-cell";
    tr.appendChild(macTd);

    for (const text of [
      row.extension || "-",
      row.model + (row.modelSet ? "" : " (default)"),
      row.statusLabel,
      row.address || "-",
      row.rtt === null ? "-" : `${row.rtt} ms`,
      `${row.size.toLocaleString()} B`,
      row.lastChange ? formatTimestamp(row.lastChange) : "-"
    ]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }

    const actionTd = document.createElement("td");
    actionTd.className = "restore-cell";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "secondary small";
    btn.textContent = row.name === currentFile ? "Open in editor" : "Configure";
    btn.addEventListener("click", () => {
      openPhoneInEditor(row.name).catch((error) => setStatus(error.message, true));
    });
    actionTd.appendChild(btn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  phonesResultsEl.appendChild(table);
}

/** From any page: the Configuration page with this phone open. */
async function openPhoneInEditor(name) {
  if (name !== currentFile && !confirmDiscardEdits("open another phone")) {
    return;
  }
  showPage("configuration");
  if (name !== currentFile) {
    await loadFile(name);
  }
  document.querySelector(".col-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exportPhonesCsv() {
  const rows = filteredPhoneReport();
  if (rows.length === 0) {
    setStatus("Nothing to export.", true);
    return;
  }
  const cell = (v) => {
    const s = String(v ?? "");
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const lines = [["Phone", "MAC address", "File", "Extension", "Model", "Status", "Address", "RTT ms", "Size bytes", "Last change"].map(cell).join(",")];
  for (const row of rows) {
    lines.push([row.station, row.mac, row.name, row.extension, row.model, row.statusLabel, row.address, row.rtt ?? "", row.size, row.lastChange ? formatTimestamp(row.lastChange) : ""].map(cell).join(","));
  }
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pbx-phones-${(lastConnectionInfo?.profileName || lastConnectionInfo?.host || "pbx").replace(/[^\w.-]+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus(`Exported ${rows.length} phone${rows.length === 1 ? "" : "s"}.`);
}

phonesSearchInput.addEventListener("input", renderPhoneReport);
phonesRefreshBtn.addEventListener("click", async () => {
  try {
    await refreshFiles();
    await refreshRegistrations(true);
    setStatus("Phone list refreshed");
  } catch (error) {
    setStatus(error.message, true);
  }
});
phonesExportBtn.addEventListener("click", exportPhonesCsv);

// --- several PBXs at once ----------------------------------------------------------------------

let liveConnections = [];

/** Shows the other connected PBXs: a switcher when on one, join buttons when on none. */
function applyConnections(list) {
  if (!Array.isArray(list)) {
    return;
  }
  liveConnections = list;
  const currentKey = connectionKeyOf(lastConnectionInfo);

  // In the bar while connected: a select, only when there is somewhere else to go.
  pbxSwitchSelect.replaceChildren();
  for (const link of list) {
    const opt = document.createElement("option");
    opt.value = link.key;
    opt.textContent = link.key === currentKey ? `${link.label} (this one)` : `Switch to ${link.label}`;
    opt.selected = link.key === currentKey;
    pbxSwitchSelect.appendChild(opt);
  }
  pbxSwitchSelect.hidden = list.length < 2;

  // While not connected: anything already connected can be joined without a password.
  liveLinksEl.replaceChildren();
  if (list.length > 0) {
    const label = document.createElement("span");
    label.textContent = list.length === 1 ? "Already connected:" : "Already connected to:";
    liveLinksEl.appendChild(label);
    for (const link of list) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "secondary small";
      btn.textContent = `Join ${link.label}`;
      btn.title = `${link.host} ${link.remoteDir}`;
      btn.addEventListener("click", () => {
        switchToPbx(link.key).catch((error) => setStatus(error.message, true));
      });
      liveLinksEl.appendChild(btn);
    }
  }
  liveLinksEl.hidden = list.length === 0;
}

/** Moves this browser onto a PBX someone has connected. The editor is swapped like on a connect. */
async function switchToPbx(key) {
  if (key === connectionKeyOf(lastConnectionInfo)) {
    return;
  }
  if (!confirmDiscardEdits("switch to another PBX")) {
    applyConnections(liveConnections);
    return;
  }

  const data = await api("/api/connection/select", { method: "POST", body: JSON.stringify({ key }) });
  clearWorkspace();
  workspaceKey = connectionKeyOf(data.connection);
  lastConnectionInfo = data.connection || null;
  setConnectionCollapsed(true, data.connection || null);
  setPhoneModelChoice(null, null);
  if (data.connection?.profileId) {
    serverSelect.value = data.connection.profileId;
    fillFormFromServer(data.connection.profileId);
  }
  applyConnections(data.connections);
  setStatus(data.message || "Switched PBX");
  await refreshFiles();
  await refreshLogScopes();
}

pbxSwitchSelect.addEventListener("change", () => {
  switchToPbx(pbxSwitchSelect.value).catch((error) => {
    setStatus(error.message, true);
    applyConnections(liveConnections);
  });
});

async function loadFile(name) {
  const data = await api(`/api/files/${encodeURIComponent(name)}`);

  currentFile = data.fileName;
  currentFileVersion = data.version || null;
  setPhoneModelChoice(data.model || null, data.model ? "phone" : null);
  fileNameInput.value = data.fileName;
  rootKeyInput.value = data.rootKey || "flat-profile";

  showAllFields = false;
  loadEntriesIntoEditor(data.entries || []);
  setBaseline(data.rootKey || "flat-profile", data.entries || []);
  refreshQuickDirty();

  renderFileList(getFilteredFiles());

  // Quick view reads from the editor rows, so refresh it whenever they change.
  if (quickSchemaData && !panelQuick.hidden) {
    renderQuickButtons();
    renderQuickSettings();
  }
  updateQuickScopeHints();

  historyBtn.hidden = false;
  cloneBtn.hidden = false;
  clonePanel.hidden = true;
  replaceBtn.hidden = false;
  deletePhoneBtn.hidden = false;
  replacePanel.hidden = true;
  if (!historyPanel.hidden) {
    await refreshHistory();
  }

  setStatus(`Loaded ${data.fileName}`);
}

function resetEditorToBaseline() {
  rootKeyInput.value = baseline.rootKey || "flat-profile";
  loadEntriesIntoEditor(deepClone(baseline.entries || []));
  refreshQuickDirty();
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
  // Only guard the file that was actually loaded; saving under a new name is a create.
  const expectedVersion = fileName === currentFile ? currentFileVersion : null;

  let result;
  try {
    result = await api(`/api/files/${encodeURIComponent(fileName)}`, {
      method: "POST",
      body: JSON.stringify({ rootKey, entries, expectedVersion })
    });
  } catch (error) {
    if (error.data?.conflict) {
      setStatus(error.message, true);
      if (confirm(`${error.message}\n\nReload ${fileName} now? The edits in the editor will be discarded.`)) {
        await loadFile(fileName);
      }
      return;
    }
    throw error;
  }

  currentFile = fileName;
  currentFileVersion = result.version || null;
  loadEntriesIntoEditor(entries);
  setBaseline(rootKey, entries);
  refreshQuickDirty();
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
    resyncCommand: resyncCommandInput.value.trim(),
    statusCommand: statusCommandInput.value.trim(),
    defaultModel: readModelControls(profileControls),
    auth: serverAuthSelect.value
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
  bulkRollbackResyncLabel.hidden = true;

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

    // A Quick action writes several tags at once: list each one rather than leaving
    // the value columns blank.
    const multi = (item.changes || []).length > 1 && data.mode !== "rollback";
    const shown = (tag, value, missing) => {
      if (value == null || value === "") return missing;
      return SENSITIVE_TAG_RE.test(tag) ? "(hidden)" : value;
    };

    const beforeTd = document.createElement("td");
    const afterTd = document.createElement("td");
    if (multi) {
      beforeTd.className = "multi-value";
      afterTd.className = "multi-value";
      beforeTd.textContent = item.changes.map((c) => `${c.tag}: ${shown(c.tag, c.before, "(not set)")}`).join("\n");
      if (item.status === "changed") {
        afterTd.textContent = item.changes.map((c) => `${c.tag}: ${shown(c.tag, c.after, "(empty)")}`).join("\n");
      }
    } else {
      beforeTd.textContent = (item.previousValues || []).join(", ");
      if (item.status === "changed") {
        afterTd.textContent = data.mode === "delete" ? "(tag removed)" : String(item.newValue ?? "");
      }
    }
    tr.appendChild(beforeTd);
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

/** Polls any server job to completion, reporting each poll to onProgress. */
async function pollJob(jobId, onProgress) {
  for (;;) {
    const job = await api(`/api/bulk-edit/${encodeURIComponent(jobId)}`);
    if (onProgress) {
      onProgress(job);
    }

    if (job.status !== "running") {
      if (job.status === "failed") {
        throw new Error(job.error || "The job failed.");
      }
      return job;
    }

    await new Promise((resolve) => setTimeout(resolve, JOB_POLL_MS));
  }
}

/** Polls an already-started bulk job, driving the Bulk Edit progress bar. */
async function pollJobWithProgress(jobId, verb) {
  setBulkBusy(true, verb);
  try {
    return await pollJob(jobId, (job) => updateBulkProgress(job, verb));
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

  if (!confirm(`Write to the PBX now?\n\nThis will ${action} across ${fileCount} selected file${fileCount === 1 ? "" : "s"}.\n\nA copy of each file is kept first, so the batch can be rolled back afterwards.${unsavedEditsWarning(request.fileNames.includes(currentFile))}`)) {
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
  delete: "Deleted phone",
  replace: "Replaced phone",
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
  renderPhoneReport();
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
    if (entry.snapshotId && entry.file && canWrite()) {
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
  restore: "before a restore",
  delete: "before it was deleted",
  replace: "before it was replaced"
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
  historyDiffEl.hidden = true;
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
    const wrap = document.createElement("div");
    wrap.className = "row-actions";

    // Looking is for everyone; only restoring needs write access.
    const compareBtn = document.createElement("button");
    compareBtn.type = "button";
    compareBtn.className = "secondary small";
    compareBtn.textContent = "Compare";
    compareBtn.title = "Show how this version differs from the file on the PBX now";
    compareBtn.addEventListener("click", () => {
      compareVersion(data.fileName, version, tr).catch((error) => setStatus(error.message, true));
    });
    wrap.appendChild(compareBtn);

    if (canWrite()) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "secondary small";
      btn.textContent = "Restore";
      btn.addEventListener("click", () => {
        restoreVersion(data.fileName, version.id).catch((error) => setStatus(error.message, true));
      });
      wrap.appendChild(btn);
    }
    actionTd.appendChild(wrap);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  historyListEl.appendChild(table);
}

/** Read-only: how one kept version differs from the file as it is on the PBX now. */
async function compareVersion(fileName, version, row) {
  const detail = await api(`/api/files/${encodeURIComponent(fileName)}/history/${encodeURIComponent(version.id)}`);
  const diff = detail.diff || [];

  for (const tr of historyListEl.querySelectorAll("tr.is-compared")) {
    tr.classList.remove("is-compared");
  }
  if (row) {
    row.classList.add("is-compared");
  }

  historyDiffBody.replaceChildren();
  historyDiffTitle.textContent = `Version from ${describeVersion(detail.version)} compared with the PBX now`;

  const note = document.createElement("p");
  note.className = "empty-state";
  if (!detail.currentExists) {
    note.textContent = `${fileName} no longer exists on the PBX. Restoring this version would recreate it with ${(detail.entries || []).length} fields.`;
    historyDiffBody.appendChild(note);
  } else if (diff.length === 0) {
    note.textContent = "No differences: the file on the PBX matches this version field for field.";
    historyDiffBody.appendChild(note);
  } else {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const label of ["Tag", "In this version", "On the PBX now"]) {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const change of diff) {
      // change.before is the PBX now, change.after is this version.
      const hide = SENSITIVE_TAG_RE.test(change.key);
      const show = (value, missing) => (value == null ? missing : (hide && value !== "" ? "(hidden)" : (value === "" ? "(empty)" : value)));
      const tr = document.createElement("tr");
      for (const text of [change.key, show(change.after, "(not in this version)"), show(change.before, "(not on the PBX)")]) {
        const td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    historyDiffBody.appendChild(table);
  }

  historyDiffEl.hidden = false;
  setStatus(detail.currentExists
    ? `${diff.length} field${diff.length === 1 ? "" : "s"} differ${diff.length === 1 ? "s" : ""} between this version and the PBX.`
    : `${fileName} is not on the PBX; this version would recreate it.`);
}

historyDiffCloseBtn.addEventListener("click", () => {
  historyDiffEl.hidden = true;
  for (const tr of historyListEl.querySelectorAll("tr.is-compared")) {
    tr.classList.remove("is-compared");
  }
});

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
    `Restore ${fileName} to the version from ${describeVersion(detail.version)}?\n\n${effect}`
      + (detail.currentExists ? "\n\nThe current file is kept first, so this can be undone." : "")
      + unsavedEditsWarning(fileName === currentFile)
  );
  if (!ok) {
    setStatus("Restore cancelled.");
    return;
  }

  const result = await api(`/api/files/${encodeURIComponent(fileName)}/restore`, {
    method: "POST",
    body: JSON.stringify({ snapshotId: versionId })
  });

  setStatus(result.recreated
    ? `${result.message || `Restored ${fileName}`} (the file was recreated on the PBX).`
    : `${result.message || `Restored ${fileName}`} (${result.changes} field${result.changes === 1 ? "" : "s"} changed).`);

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
  bulkRollbackResyncLabel.hidden = !possible;
  // Unticked every time: resyncing is always a deliberate choice.
  bulkRollbackResyncInput.checked = false;
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
      + (bulkRollbackResyncInput.checked ? "\n\nEach rolled-back phone will then be told to fetch its configuration." : "")
      + unsavedEditsWarning(job.results.some((item) => item.name === currentFile))
  );
  if (!ok) {
    setStatus("Roll back cancelled.");
    return;
  }

  const resync = bulkRollbackResyncInput.checked;
  const start = await api(`/api/bulk-edit/${encodeURIComponent(job.jobId)}/rollback`, {
    method: "POST",
    body: JSON.stringify({ resync })
  });
  const result = await pollJobWithProgress(start.jobId, "Rolling back");

  renderBulkResults(result);
  lastAppliedJob = null;

  const restored = result.summary?.changed || 0;
  const errors = result.summary?.error || 0;
  const resyncNote = result.resync ? `. ${summarizeResync(result.results)}` : "";
  const resyncFailed = result.resync && (result.results || []).some((item) => item.resync?.status === "failed");
  setStatus(`Rolled back ${restored} file${restored === 1 ? "" : "s"}${errors ? `, ${errors} failed` : ""}${resyncNote}`, errors > 0 || resyncFailed);

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

saveQuickBtn.addEventListener("click", () => {
  saveCurrentFile().catch((error) => setStatus(error.message, true));
});

for (const btn of [resyncBtn, resyncTopBtn, resyncQuickBtn]) {
  btn.addEventListener("click", () => {
    resyncCurrentPhone().catch((error) => setStatus(error.message, true));
  });
}

resyncTestBtn.addEventListener("click", () => {
  testResync().catch((error) => setStatus(error.message, true));
});

// --- phone model ---------------------------------------------------------------------------

// What the open phone is: its own record, else the profile default, else the app default.
let phoneModelChoice = null;   // the phone's own record, or null
let phoneModelSource = null;   // "phone" when the record above applies

const quickControls = { model: quickModelSelect, kemsLabel: quickKemsLabel, kems: quickKemsSelect, customLabel: quickCustomLabel, custom: quickCustomKeysInput };
const profileControls = { model: profileModelSelect, kemsLabel: profileKemsLabel, kems: profileKemsSelect, customLabel: profileCustomLabel, custom: profileCustomKeysInput };

function effectiveModelChoice() {
  return phoneModelChoice || lastConnectionInfo?.defaultModel || { model: quickSchemaData?.defaultModel || "8841", kems: 0, customKeys: 0 };
}

function populateModelSelect(select, { allowBlank }) {
  select.replaceChildren();
  if (allowBlank) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "(app default)";
    select.appendChild(opt);
  }
  for (const m of quickSchemaData?.models || []) {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.keys === null ? m.label : `${m.label} - ${m.keys} key${m.keys === 1 ? "" : "s"}${m.confirmed ? "" : " (unverified)"}`;
    select.appendChild(opt);
  }
}

/** Shows or hides the expansion-module and custom-count controls for the chosen model. */
function syncModelControls(controls) {
  const model = QuickConfig.findModel(controls.model.value);
  const kem = model?.kem || null;
  controls.kemsLabel.hidden = !kem;
  if (kem) {
    const current = controls.kems.value;
    controls.kems.replaceChildren();
    for (let n = 0; n <= kem.max; n += 1) {
      const opt = document.createElement("option");
      opt.value = String(n);
      opt.textContent = n === 0 ? "None" : `${n} (${n * kem.keys} more keys)`;
      controls.kems.appendChild(opt);
    }
    controls.kems.value = current && Number(current) <= kem.max ? current : "0";
  }
  controls.customLabel.hidden = model?.id !== "custom";
}

function readModelControls(controls) {
  if (!controls.model.value) return null;
  return QuickConfig.normalizeModelChoice({
    model: controls.model.value,
    kems: controls.kems.value,
    customKeys: controls.custom.value
  });
}

function writeModelControls(controls, choice) {
  const clean = QuickConfig.normalizeModelChoice(choice);
  controls.model.value = clean ? clean.model : "";
  syncModelControls(controls);
  if (clean) {
    controls.kems.value = String(clean.kems);
    if (clean.model === "custom") controls.custom.value = String(clean.customKeys);
  }
}

function setPhoneModelChoice(choice, source) {
  phoneModelChoice = QuickConfig.normalizeModelChoice(choice);
  phoneModelSource = phoneModelChoice ? source : null;
  writeModelControls(quickControls, effectiveModelChoice());
  updateModelNote();
}

function updateModelNote() {
  const choice = effectiveModelChoice();
  const from = phoneModelSource === "phone"
    ? "set for this phone"
    : (lastConnectionInfo?.defaultModel ? "profile default" : "app default");
  quickModelNote.textContent = `${QuickConfig.describeModelChoice(choice)} (${from})`;
}

/** The Quick tab's model controls: change the grid now, and remember it for the open phone. */
async function onQuickModelChanged() {
  syncModelControls(quickControls);
  const choice = readModelControls(quickControls);
  if (!choice) return;

  phoneModelChoice = choice;
  renderQuickButtons();

  if (currentFile && canWrite()) {
    try {
      await api(`/api/files/${encodeURIComponent(currentFile)}/model`, { method: "PUT", body: JSON.stringify(choice) });
      phoneModelSource = "phone";
    } catch (error) {
      setStatus(error.message, true);
    }
  }
  updateModelNote();
}

for (const el of [quickModelSelect, quickKemsSelect, quickCustomKeysInput]) {
  el.addEventListener("change", () => { onQuickModelChanged().catch((error) => setStatus(error.message, true)); });
}
profileModelSelect.addEventListener("change", () => syncModelControls(profileControls));

// --- clone a phone ----------------------------------------------------------------------

/** A MAC in any common notation becomes spa<mac>.xml; anything ending in .xml is taken as is. */
function cloneFileNameFromInput(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    return "";
  }
  if (/\.xml$/i.test(raw)) {
    return raw;
  }
  const hex = raw.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
  return hex.length === 12 ? `spa${hex}.xml` : "";
}

function updateClonePreview() {
  const name = cloneFileNameFromInput(cloneMacInput.value);
  cloneFilePreview.textContent = name || (cloneMacInput.value.trim() ? "(enter a 12-digit MAC or a file name ending in .xml)" : "-");
}

function openClonePanel() {
  if (!currentFile) {
    setStatus("Open the phone to copy from first.", true);
    return;
  }
  cloneSourceLabel.textContent = currentFile;
  cloneMacInput.value = "";
  cloneExtInput.value = "";
  cloneDisplayInput.value = "";
  clonePasswordInput.value = "";
  cloneStationInput.value = "";
  updateClonePreview();
  historyPanel.hidden = true;
  replacePanel.hidden = true;
  clonePanel.hidden = false;
  cloneMacInput.focus();
}

async function createClone() {
  const fileName = cloneFileNameFromInput(cloneMacInput.value);
  const ext = cloneExtInput.value.trim();
  if (!fileName) {
    setStatus("Enter the new phone's MAC address (12 hex digits) or a file name ending in .xml.", true);
    return;
  }
  if (!ext) {
    setStatus("Enter the new phone's line 1 extension.", true);
    return;
  }
  // The clone is made from the file on the PBX, not from what is in the editor.
  if (!confirmDiscardEdits("clone now (the clone copies the saved file, not these edits)")) {
    return;
  }

  const result = await api("/api/files/clone", {
    method: "POST",
    body: JSON.stringify({
      source: currentFile,
      fileName,
      ext,
      displayName: cloneDisplayInput.value.trim(),
      password: clonePasswordInput.value,
      station: cloneStationInput.value.trim()
    })
  });

  clonePanel.hidden = true;
  setStatus(result.message || `Created ${fileName}`);
  await refreshFiles();
  await refreshLogScopes();
  await loadFile(result.fileName);
}

cloneBtn.addEventListener("click", openClonePanel);
cloneCloseBtn.addEventListener("click", () => {
  clonePanel.hidden = true;
});
cloneMacInput.addEventListener("input", updateClonePreview);
cloneCreateBtn.addEventListener("click", () => {
  createClone().catch((error) => setStatus(error.message, true));
});
for (const input of [cloneMacInput, cloneExtInput, cloneDisplayInput, clonePasswordInput, cloneStationInput]) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      createClone().catch((error) => setStatus(error.message, true));
    }
  });
}

// --- replace and retire --------------------------------------------------------------------

/** Empties the editor after the open phone has gone away; the list and selections stay. */
function closeOpenPhone() {
  currentFile = "";
  currentFileVersion = null;
  fileNameInput.value = "";
  historyBtn.hidden = true;
  historyPanel.hidden = true;
  cloneBtn.hidden = true;
  clonePanel.hidden = true;
  replaceBtn.hidden = true;
  deletePhoneBtn.hidden = true;
  replacePanel.hidden = true;
  clearRows();
  setBaseline("flat-profile", []);
  refreshQuickDirty();
  if (quickSchemaData) {
    renderQuickButtons();
    renderQuickSettings();
  }
  updateQuickScopeHints();
}

function updateReplacePreview() {
  const name = cloneFileNameFromInput(replaceMacInput.value);
  replaceFilePreview.textContent = name || (replaceMacInput.value.trim() ? "(enter a 12-digit MAC or a file name ending in .xml)" : "-");
}

function openReplacePanel() {
  if (!currentFile) {
    setStatus("Open the phone that was replaced first.", true);
    return;
  }
  replaceSourceLabel.textContent = currentStationLabel();
  replaceMacInput.value = "";
  updateReplacePreview();
  historyPanel.hidden = true;
  clonePanel.hidden = true;
  replacePanel.hidden = false;
  replaceMacInput.focus();
}

/** "Front Desk - 7001 (spa001.xml)" for the open phone, as last loaded or saved. */
function currentStationLabel() {
  const station = (baseline.entries || []).find((e) => e.key === "Station_Display_Name")?.value;
  return station ? `${station} (${currentFile})` : currentFile;
}

async function replacePhone() {
  const fileName = cloneFileNameFromInput(replaceMacInput.value);
  if (!fileName) {
    setStatus("Enter the new phone's MAC address (12 hex digits) or a file name ending in .xml.", true);
    return;
  }
  // The file is renamed as it is on the PBX; edits in the editor are not part of it.
  if (!confirmDiscardEdits("replace now (the rename uses the saved file, not these edits)")) {
    return;
  }
  const source = currentFile;
  if (!confirm(
    `Replace the hardware for ${currentStationLabel()}?\n\n`
      + `${source} will be renamed to ${fileName}, so the new phone gets the same config. `
      + `The old phone will no longer be provisioned.\n\n`
      + "A copy of the old file is kept in the Change Log."
  )) {
    setStatus("Replace cancelled.");
    return;
  }

  const result = await api(`/api/files/${encodeURIComponent(source)}/replace`, {
    method: "POST",
    body: JSON.stringify({ fileName })
  });

  replacePanel.hidden = true;
  await refreshFiles();
  await refreshLogScopes();
  await loadFile(result.fileName);
  setStatus(`${result.message}. Plug in the new phone and it will pick up this config.`);
}

async function deleteOpenPhone() {
  if (!currentFile) {
    setStatus("Open the phone to delete first.", true);
    return;
  }
  const fileName = currentFile;
  if (!confirm(
    `Delete ${currentStationLabel()}?\n\n`
      + "Its config file is removed from the PBX, so the phone will no longer be provisioned. "
      + "A copy is kept: Restore on its row in the Change Log brings it back."
      + unsavedEditsWarning(true)
  )) {
    setStatus("Delete cancelled.");
    return;
  }

  const result = await api(`/api/files/${encodeURIComponent(fileName)}`, { method: "DELETE" });
  closeOpenPhone();
  await refreshFiles();
  await refreshLogScopes();
  setStatus(`${result.message}. Restore it from the Change Log if that was a mistake.`);
}

replaceBtn.addEventListener("click", openReplacePanel);
replaceCloseBtn.addEventListener("click", () => {
  replacePanel.hidden = true;
});
replaceMacInput.addEventListener("input", updateReplacePreview);
replaceMacInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    replacePhone().catch((error) => setStatus(error.message, true));
  }
});
replaceConfirmBtn.addEventListener("click", () => {
  replacePhone().catch((error) => setStatus(error.message, true));
});
deletePhoneBtn.addEventListener("click", () => {
  deleteOpenPhone().catch((error) => setStatus(error.message, true));
});

// --- add phones from a list --------------------------------------------------------------

// The list as it was when last checked; Create only ever sends a checked list.
let checkedProvision = null;

/** Sources are the open phone, any phone on the PBX, or a saved template. */
function populateProvisionSources() {
  const previous = provisionSourceSelect.value;
  provisionSourceSelect.replaceChildren();
  const add = (value, text) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
    provisionSourceSelect.appendChild(opt);
  };

  add("open", "(the open phone)");
  for (const file of allFiles) {
    add(`file:${file.name}`, `Phone: ${file.stationDisplayName ? `${file.stationDisplayName} (${file.name})` : file.name}`);
  }
  for (const tpl of templates) {
    add(`template:${tpl.id}`, `Template: ${tpl.name}`);
  }
  provisionSourceSelect.value = [...provisionSourceSelect.options].some((o) => o.value === previous) ? previous : "open";
}

function readProvisionSource() {
  const value = provisionSourceSelect.value;
  if (value.startsWith("template:")) {
    return { templateId: value.slice("template:".length) };
  }
  const file = value.startsWith("file:") ? value.slice("file:".length) : currentFile;
  if (!file) {
    throw new Error("Open the phone to copy from, or choose a phone or template in the list.");
  }
  return { file };
}

function invalidateProvisionCheck() {
  checkedProvision = null;
  provisionCreateBtn.disabled = true;
}

function setProvisionBusy(busy, verb) {
  provisionCheckBtn.disabled = busy;
  provisionCreateBtn.disabled = busy || !checkedProvision;
  provisionProgressEl.hidden = !busy;
  if (busy) {
    provisionProgressBarEl.style.width = "0%";
    provisionProgressLabelEl.textContent = `${verb}...`;
  }
}

function renderProvisionResults(job) {
  provisionResultsEl.replaceChildren();
  const counts = job.summary || {};
  const good = job.dryRun ? (counts.ready || 0) : (counts.created || 0);
  const bad = counts.error || 0;
  provisionCountEl.textContent = job.dryRun
    ? `${good} ready to create${bad ? `, ${bad} with problems` : ""}`
    : `${good} created${bad ? `, ${bad} not created` : ""}`;

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Line", "File", "Extension", "Station", "Status", "Notes"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const STATUS = { ready: "Ready", created: "Created", error: "Problem" };
  const tbody = document.createElement("tbody");
  for (const item of job.results || []) {
    const tr = document.createElement("tr");
    const warnings = item.warnings || [];
    tr.className = item.status === "error"
      ? "bulk-row-error"
      : (warnings.length ? "bulk-row-changed bulk-row-warning" : "bulk-row-changed");
    const notes = item.status === "error" ? item.error : warnings.join("; ");
    for (const text of [String(item.line), item.name || "-", item.ext || "-", item.station || "-", STATUS[item.status] || item.status, notes || ""]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  provisionResultsEl.appendChild(table);
}

async function runProvision(dryRun) {
  const source = dryRun ? readProvisionSource() : checkedProvision.source;
  const rows = dryRun ? CsvRows.parsePhoneList(provisionTextInput.value).phones : checkedProvision.rows;
  if (rows.length === 0) {
    throw new Error("The list is empty. Paste the phones to add, one per line.");
  }

  const verb = dryRun ? "Checking" : "Creating";
  const start = await api("/api/provision", { method: "POST", body: JSON.stringify({ source, rows, dryRun }) });
  setProvisionBusy(true, verb);
  let job;
  try {
    job = await pollJob(start.jobId, (j) => {
      const total = j.total || 0;
      const done = j.processed || 0;
      provisionProgressBarEl.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
      provisionProgressLabelEl.textContent = j.currentFile ? `${verb} ${done + 1} of ${total}: ${j.currentFile}` : `${verb} ${done} of ${total}`;
    });
  } finally {
    setProvisionBusy(false);
  }

  renderProvisionResults(job);
  return { job, source, rows };
}

async function checkProvisionList() {
  invalidateProvisionCheck();
  const { job, source, rows } = await runProvision(true);
  const ready = job.summary?.ready || 0;
  const problems = job.summary?.error || 0;

  if (ready > 0) {
    // Only the rows that passed are sent when creating.
    const readyLines = new Set(job.results.filter((r) => r.status === "ready").map((r) => r.line));
    checkedProvision = { source, rows: rows.filter((row) => readyLines.has(row.line)), sourceLabel: job.sourceLabel, problems };
    provisionCreateBtn.disabled = false;
  }
  setStatus(
    ready
      ? `${ready} phone${ready === 1 ? "" : "s"} ready to create from ${job.sourceLabel}${problems ? `; ${problems} line${problems === 1 ? " has" : "s have"} problems and will be skipped` : ""}.`
      : "Nothing in the list can be created. See the notes on each line.",
    ready === 0
  );
}

async function createProvisionedPhones() {
  if (!checkedProvision) {
    setStatus("Check the list first.", true);
    return;
  }
  const count = checkedProvision.rows.length;
  if (!confirm(
    `Create ${count} phone${count === 1 ? "" : "s"} on the PBX now?\n\n`
      + `Each is a copy of ${checkedProvision.sourceLabel} with its own MAC, extension and names.`
      + (checkedProvision.problems ? `\n\n${checkedProvision.problems} line${checkedProvision.problems === 1 ? "" : "s"} with problems will be skipped.` : "")
  )) {
    setStatus("Nothing was created.");
    return;
  }

  const { job } = await runProvision(false);
  invalidateProvisionCheck();
  const created = job.summary?.created || 0;
  const failed = job.summary?.error || 0;
  setStatus(`Created ${created} phone${created === 1 ? "" : "s"}${failed ? `, ${failed} failed` : ""}.`, failed > 0);
  await refreshFiles();
  await refreshLogScopes();
}

provisionCheckBtn.addEventListener("click", () => {
  checkProvisionList().catch((error) => setStatus(error.message, true));
});
provisionCreateBtn.addEventListener("click", () => {
  createProvisionedPhones().catch((error) => setStatus(error.message, true));
});
provisionTextInput.addEventListener("input", invalidateProvisionCheck);
provisionSourceSelect.addEventListener("change", invalidateProvisionCheck);
provisionFileInput.addEventListener("change", async () => {
  const file = provisionFileInput.files && provisionFileInput.files[0];
  if (!file) {
    return;
  }
  try {
    provisionTextInput.value = await file.text();
    invalidateProvisionCheck();
    const n = CsvRows.parsePhoneList(provisionTextInput.value).phones.length;
    setStatus(`Loaded ${file.name}: ${n} phone${n === 1 ? "" : "s"}. Check the list before creating.`);
  } catch (error) {
    setStatus(`Could not read ${file.name}: ${error.message}`, true);
  } finally {
    provisionFileInput.value = "";
  }
});

// --- drift report -----------------------------------------------------------------------

let lastDrift = null;

/** Keeps the baseline list in step with the phones on the PBX, preserving the choice. */
function populateDriftBaselines() {
  const previous = driftBaselineSelect.value;
  driftBaselineSelect.replaceChildren();

  const open = document.createElement("option");
  open.value = "";
  open.textContent = "(the open phone)";
  driftBaselineSelect.appendChild(open);

  for (const file of allFiles) {
    const opt = document.createElement("option");
    opt.value = file.name;
    opt.textContent = file.stationDisplayName ? `${file.stationDisplayName} (${file.name})` : file.name;
    driftBaselineSelect.appendChild(opt);
  }
  driftBaselineSelect.value = allFiles.some((f) => f.name === previous) ? previous : "";
}

async function loadDriftDefaults() {
  const data = await api("/api/drift/defaults");
  if (!driftIgnoreInput.value) {
    driftIgnoreInput.value = (data.ignore || []).join(", ");
  }
}

function setDriftBusy(busy) {
  driftBtn.disabled = busy;
  driftProgressEl.hidden = !busy;
  if (busy) {
    driftProgressBarEl.style.width = "0%";
    driftProgressLabelEl.textContent = "Comparing...";
  }
}

function updateDriftProgress(job) {
  const total = job.total || 0;
  const done = job.processed || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  driftProgressBarEl.style.width = `${pct}%`;
  driftProgressLabelEl.textContent = job.currentFile
    ? `Comparing ${done + 1} of ${total}: ${job.currentFile}`
    : `Comparing ${done} of ${total} (${pct}%)`;
}

function renderDriftResults(job) {
  driftResultsEl.replaceChildren();
  const differing = (job.results || []).filter((r) => r.status === "differs");
  const errors = (job.results || []).filter((r) => r.status === "error");
  const baseLabel = job.criteria?.baselineStation || job.criteria?.baseline || "the baseline";

  driftCountEl.textContent = differing.length === 0
    ? `All ${job.total || 0} phone${job.total === 1 ? "" : "s"} match ${baseLabel}`
    : `${differing.length} of ${job.total} phone${job.total === 1 ? "" : "s"} differ from ${baseLabel}`;
  if (errors.length) {
    driftCountEl.textContent += `, ${errors.length} could not be read`;
  }
  driftSelectBtn.hidden = differing.length === 0;

  if (differing.length === 0 && errors.length === 0) {
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Phone", "File", "Tag", `Baseline (${baseLabel})`, "This phone"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const addRow = (cells, className) => {
    const tr = document.createElement("tr");
    tr.className = className;
    for (const text of cells) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  };
  const show = (value, missing) => (value == null ? missing : (value === "" ? "(empty)" : value));

  for (const item of differing) {
    for (const [i, d] of item.differences.entries()) {
      // The phone is named on its first row only, so the table reads as groups.
      addRow([
        i === 0 ? (item.station || "-") : "",
        i === 0 ? item.name : "",
        d.tag,
        show(d.baseline, "(not set)"),
        show(d.value, "(not set)")
      ], "bulk-row-changed");
    }
    if (item.matched > item.differences.length) {
      addRow(["", "", `...and ${item.matched - item.differences.length} more`, "", ""], "bulk-row-changed");
    }
  }
  for (const item of errors) {
    addRow([item.station || "-", item.name, "Could not read", item.error || "", ""], "bulk-row-error");
  }

  table.appendChild(tbody);
  driftResultsEl.appendChild(table);
}

async function runDrift() {
  const baseline = driftBaselineSelect.value || currentFile;
  if (!baseline) {
    setStatus("Choose a baseline phone, or open one first.", true);
    return;
  }

  const request = { baseline, include: driftIncludeInput.value, ignore: driftIgnoreInput.value };
  if (driftScopeSelect.value === "selected") {
    if (selectedFiles.size === 0) {
      setStatus("Tick the phones to check in the XML Files list first.", true);
      return;
    }
    request.fileNames = [...selectedFiles];
  }

  const start = await api("/api/drift", { method: "POST", body: JSON.stringify(request) });
  setDriftBusy(true);
  let job;
  try {
    job = await pollJob(start.jobId, updateDriftProgress);
  } finally {
    setDriftBusy(false);
  }

  lastDrift = { request, job };
  renderDriftResults(job);
  const differing = job.results.filter((r) => r.status === "differs").length;
  setStatus(differing
    ? `${differing} phone${differing === 1 ? "" : "s"} differ${differing === 1 ? "s" : ""} from the baseline.`
    : "Every phone checked matches the baseline.");
}

function selectDriftingPhones() {
  if (!lastDrift) {
    return;
  }
  const names = lastDrift.job.results.filter((r) => r.status === "differs").map((r) => r.name);
  selectedFiles.clear();
  for (const name of names) {
    selectedFiles.add(name);
  }
  renderFileList(getFilteredFiles());
  onSelectionChanged();
  setStatus(`Selected ${names.length} phone${names.length === 1 ? "" : "s"} for bulk edit.`);
  showPage("configuration", "bulk-panel");
}

driftBtn.addEventListener("click", () => {
  runDrift().catch((error) => setStatus(error.message, true));
});
driftSelectBtn.addEventListener("click", selectDriftingPhones);

// --- find in all configs ------------------------------------------------------------

let lastFind = null;

function setFindBusy(busy) {
  findBtn.disabled = busy;
  findProgressEl.hidden = !busy;
  if (busy) {
    findProgressBarEl.style.width = "0%";
    findProgressLabelEl.textContent = "Searching...";
  }
}

function updateFindProgress(job) {
  const total = job.total || 0;
  const done = job.processed || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  findProgressBarEl.style.width = `${pct}%`;
  findProgressLabelEl.textContent = job.currentFile
    ? `Searching ${done + 1} of ${total}: ${job.currentFile}`
    : `Searching ${done} of ${total} (${pct}%)`;
}

function renderFindResults(job) {
  findResultsEl.replaceChildren();
  const matched = (job.results || []).filter((r) => r.status === "matched");
  const errors = (job.results || []).filter((r) => r.status === "error");
  const valueCount = matched.reduce((n, r) => n + (r.matched || 0), 0);

  findCountEl.textContent = matched.length === 0
    ? `No matches in ${job.total || 0} file${job.total === 1 ? "" : "s"}`
    : `${matched.length} of ${job.total} phone${job.total === 1 ? "" : "s"} match (${valueCount} value${valueCount === 1 ? "" : "s"})`
      + (errors.length ? `, ${errors.length} could not be read` : "");
  findSelectBtn.hidden = matched.length === 0;

  if (matched.length === 0 && errors.length === 0) {
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Phone", "File", "Tag", "Value"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const addRow = (cells, className) => {
    const tr = document.createElement("tr");
    if (className) {
      tr.className = className;
    }
    for (const text of cells) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  };

  for (const item of matched) {
    for (const [i, m] of item.matches.entries()) {
      // Repeat the phone only on its first row so the table reads as groups.
      addRow([i === 0 ? (item.station || "-") : "", i === 0 ? item.name : "", m.tag, m.value], "bulk-row-changed");
    }
    if (item.matched > item.matches.length) {
      addRow(["", "", `...and ${item.matched - item.matches.length} more`, ""], "bulk-row-changed");
    }
  }
  for (const item of errors) {
    addRow([item.station || "-", item.name, "Could not read", item.error || ""], "bulk-row-error");
  }

  table.appendChild(tbody);
  findResultsEl.appendChild(table);
}

async function runFind() {
  const criteria = {
    tag: findTagInput.value.trim(),
    value: findValueInput.value,
    mode: findModeSelect.value
  };
  if (!criteria.tag && !criteria.value) {
    setStatus("Enter a tag name, a value, or both to search for.", true);
    return;
  }

  const start = await api("/api/search", { method: "POST", body: JSON.stringify(criteria) });
  setFindBusy(true);
  let job;
  try {
    job = await pollJob(start.jobId, updateFindProgress);
  } finally {
    setFindBusy(false);
  }

  lastFind = { criteria, job };
  renderFindResults(job);
  const matched = job.results.filter((r) => r.status === "matched").length;
  setStatus(matched ? `Found ${matched} matching phone${matched === 1 ? "" : "s"}.` : "No phones matched.");
}

function selectFoundPhones() {
  if (!lastFind) {
    return;
  }
  const names = lastFind.job.results.filter((r) => r.status === "matched").map((r) => r.name);
  selectedFiles.clear();
  for (const name of names) {
    selectedFiles.add(name);
  }
  renderFileList(getFilteredFiles());
  onSelectionChanged();

  // A search by an exact tag is usually the prelude to changing it.
  if (lastFind.criteria.tag && !lastFind.criteria.tag.includes("*")) {
    bulkKeyInput.value = lastFind.criteria.tag;
  }
  setStatus(`Selected ${names.length} phone${names.length === 1 ? "" : "s"} for bulk edit.`);
  showPage("configuration", "bulk-panel");
}

findBtn.addEventListener("click", () => {
  runFind().catch((error) => setStatus(error.message, true));
});
findSelectBtn.addEventListener("click", selectFoundPhones);
for (const input of [findTagInput, findValueInput]) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runFind().catch((error) => setStatus(error.message, true));
    }
  });
}

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

// What was last sent to connect, so "forget the host key and reconnect" can repeat it.
let lastConnectBody = null;
let lastAutoReconnectAt = 0;

connectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  connectToPbx(Object.fromEntries(new FormData(connectForm).entries()));
});

quickConnectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!quickServerSelect.value) {
    setStatus("Choose a saved server, or add one under Settings.", true);
    return;
  }
  connectToPbx({ profileId: quickServerSelect.value, password: quickPasswordInput.value });
});

manageServersBtn.addEventListener("click", () => {
  showPage("settings", "servers-panel");
});

quickServerSelect.addEventListener("change", syncAuthControls);
serverAuthSelect.addEventListener("change", syncAuthControls);

/** Connects with the given form values; used by the bar and by the Settings form alike. */
async function connectToPbx(body) {
  const withKey = body.profileId ? serverUsesKey(body.profileId) : body.auth === "key";
  if (!withKey && !body.password) {
    setStatus("Password is required to connect.", true);
    return;
  }
  if (withKey) {
    delete body.password;
  }
  lastConnectBody = { ...body };

  // Connecting to a different PBX replaces the open phone; the same one keeps it.
  const targetKey = connectionKeyOf({ profileId: body.profileId, host: (body.host || "").trim(), remoteDir: (body.remoteDir || "").trim() });
  if (workspaceKey && targetKey !== workspaceKey && !confirmDiscardEdits("connect to a different PBX")) {
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

    const newKey = connectionKeyOf(data.connection);
    const samePbx = Boolean(workspaceKey) && newKey === workspaceKey;
    if (!samePbx) {
      clearWorkspace();
    }
    workspaceKey = newKey;

    lastConnectionInfo = data.connection || null;
    setConnectionCollapsed(true, data.connection || null);
    if (!samePbx) {
      setPhoneModelChoice(null, null);
    }

    applyConnections(data.connections);
    // Passwords are not left sitting in the page once they have done their job.
    lastConnectBody = null;
    connectForm.elements.password.value = "";
    quickPasswordInput.value = "";
    if (data.connection?.profileId) {
      quickServerSelect.value = data.connection.profileId;
    }

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
}

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
    // Repeat the attempt that was refused, with the values it used.
    if (lastConnectBody) {
      await connectToPbx(lastConnectBody);
    }
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
  if (!confirmDiscardEdits("disconnect")) {
    return;
  }
  try {
    const result = await disconnectFromServer();
    clearWorkspace();
    workspaceKey = null;
    lastConnectionInfo = null;
    setConnectionCollapsed(false);
    applyConnections(result.connections);
    setStatus("Disconnected");
  } catch (error) {
    setStatus(error.message, true);
  }
}

/** Empties everything that belongs to one PBX: the open phone, the list and selections. */
function clearWorkspace() {
  currentFile = "";
  currentFileVersion = null;
  registrations = null;
  regCountEl.hidden = true;
  historyBtn.hidden = true;
  historyPanel.hidden = true;
  cloneBtn.hidden = true;
  clonePanel.hidden = true;
  replaceBtn.hidden = true;
  deletePhoneBtn.hidden = true;
  replacePanel.hidden = true;
  connectedScopeKey = null;
  bulkRollbackBtn.hidden = true;
  bulkRollbackResyncLabel.hidden = true;
  renderLogEntries();
  fileListEl.innerHTML = "";
  clearRows();
  setBaseline("flat-profile", []);
  refreshQuickDirty();
  filesCountEl.textContent = "0 files";
  allFiles = [];
  selectedFiles.clear();
  onSelectionChanged();
  renderPhoneReport();
}

// Which PBX the open phone, list and selections belong to, in the server's own terms.
let workspaceKey = null;

function connectionKeyOf(conn) {
  if (!conn) return null;
  return conn.profileId ? `profile:${conn.profileId}` : `host:${conn.host || ""}|dir:${conn.remoteDir || ""}`;
}

/**
 * The connection ended on its own (idle timeout, PBX reboot, network). The open phone
 * and any unsaved edits stay exactly as they are; only the connection state is reset,
 * so reconnecting to the same PBX carries on where things stopped. Returns the message
 * to show.
 */
function handleConnectionLost(data) {
  const base = data.error || "The connection to the PBX was lost. Reconnect to continue.";
  if (!lastConnectionInfo) {
    return base;
  }

  lastConnectionInfo = null;
  registrations = null;
  regCountEl.hidden = true;
  connectedScopeKey = null;
  bulkRollbackBtn.hidden = true;
  bulkRollbackResyncLabel.hidden = true;
  renderFileList(getFilteredFiles());
  renderLogEntries();
  setConnectionCollapsed(false);

  const message = editorIsDirty()
    ? `${base} Your unsaved edits are still in the editor.`
    : base;
  renderPhoneReport();
  setStatus(message, true);
  if (data.lastDisconnect?.profileId && servers.some((s) => s.id === data.lastDisconnect.profileId)) {
    quickServerSelect.value = data.lastDisconnect.profileId;
  }
  quickPasswordInput.focus();

  // A server that signs in with the app's key needs no password, so reconnect by
  // itself - once, so a PBX that stays down does not cause a loop.
  const lostProfile = data.lastDisconnect?.profileId;
  if (lostProfile && serverUsesKey(lostProfile) && Date.now() - lastAutoReconnectAt > 60000) {
    lastAutoReconnectAt = Date.now();
    setTimeout(() => {
      connectToPbx({ profileId: lostProfile }).catch(() => {});
    }, 1500);
    return `${message} Reconnecting with the SSH key...`;
  }
  return message;
}

disconnectBtn.addEventListener("click", handleDisconnectClick);
disconnectMiniBtn.addEventListener("click", handleDisconnectClick);

expandConnectionBtn.addEventListener("click", () => {
  showPage("settings", "servers-panel");
});

// --- SSH key --------------------------------------------------------------------------------

let sshKeyInfo = null;

async function refreshSshKey() {
  sshKeyInfo = await api("/api/ssh-key");
  renderSshKey();
}

function renderSshKey() {
  const info = sshKeyInfo || { exists: false };
  const admin = currentUser?.role === "admin";
  const managed = info.source !== "supplied";

  sshKeyPresentEl.hidden = !info.exists;
  sshKeyAbsentEl.hidden = info.exists;
  sshKeyCopyBtn.hidden = !info.exists;
  sshKeyGenerateBtn.hidden = !admin || !managed;
  sshKeyRemoveBtn.hidden = !admin || !managed || !info.exists;
  sshKeyGenerateBtn.textContent = info.exists ? "Replace Key" : "Create Key";
  sshKeyGenerateBtn.className = info.exists ? "secondary" : "";

  if (info.exists) {
    sshKeyPublicEl.value = info.publicKey;
    sshKeyFingerprintEl.textContent = info.fingerprint;
    sshKeyMetaEl.textContent = managed ? `${info.type}, created ${formatTimestamp(info.createdAt)}` : `${info.type}, supplied by SSH_KEY_FILE`;
  } else {
    sshKeyMetaEl.textContent = "No key";
    sshKeyAbsentEl.textContent = info.problem
      || (admin ? "There is no key yet. Create one to let servers sign in without a password." : "There is no key yet. An administrator can create one.");
  }
}

async function generateSshKey() {
  const replacing = Boolean(sshKeyInfo?.exists);
  if (replacing && !confirm(
    "Replace the SSH key?\n\nEvery PBX that trusts the current key will refuse the app until the new public key "
      + "is installed on it. The old key cannot be recovered."
  )) {
    return;
  }
  sshKeyInfo = await api("/api/ssh-key", { method: "POST", body: JSON.stringify({ replace: replacing }) });
  renderSshKey();
  setStatus(replacing
    ? "SSH key replaced. Install the new public key on each PBX that signs in with it."
    : "SSH key created. Install the public key on the PBX, then set the server to sign in with it.");
}

async function removeSshKey() {
  if (!confirm(
    "Remove the SSH key?\n\nServers set to sign in with it will not connect until a key is created and installed again. "
      + "This does not remove the public key from any PBX."
  )) {
    return;
  }
  await api("/api/ssh-key", { method: "DELETE" });
  await refreshSshKey();
  setStatus("SSH key removed. Its public key is still in authorized_keys on any PBX you added it to.");
}

sshKeyCopyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(sshKeyPublicEl.value);
    setStatus("Public key copied.");
  } catch {
    // No clipboard access (plain HTTP, or refused): select it so Ctrl+C works.
    sshKeyPublicEl.focus();
    sshKeyPublicEl.select();
    setStatus("Press Ctrl+C to copy the selected public key.");
  }
});
sshKeyGenerateBtn.addEventListener("click", () => {
  generateSshKey().catch((error) => setStatus(error.message, true));
});
sshKeyRemoveBtn.addEventListener("click", () => {
  removeSshKey().catch((error) => setStatus(error.message, true));
});

// --- audit log ------------------------------------------------------------------------------

let auditEntries = [];

const AUDIT_ACTION_LABEL = {
  setup: "First-run setup",
  "sign-in": "Sign-in",
  "sign-out": "Sign-out",
  "password-changed": "Password changed",
  "mfa-enabled": "Two-factor enabled",
  "mfa-disabled": "Two-factor disabled",
  "mfa-reset": "Two-factor reset",
  "passkey-added": "Passkey added",
  "passkey-removed": "Passkey removed",
  "user-created": "User created",
  "user-deleted": "User deleted",
  "role-changed": "Role changed",
  "server-saved": "Server profile saved",
  "server-deleted": "Server profile deleted",
  "template-saved": "Template saved",
  "pbx-connect": "Connected to PBX",
  "pbx-disconnect": "Disconnected from PBX",
  "pbx-switch": "Switched PBX",
  "pbx-connection-lost": "PBX connection lost",
  "host-key-forgotten": "Host key forgotten",
  "ssh-key-generated": "SSH key generated",
  "ssh-key-removed": "SSH key removed",
  "change-log-cleared": "Change log cleared"
};

async function refreshAudit() {
  const data = await api("/api/audit");
  auditEntries = data.entries || [];
  renderAudit();
}

function filteredAudit() {
  const q = auditSearchInput.value.trim().toLowerCase();
  return auditEntries.filter((entry) => {
    if (auditFailuresOnly.checked && entry.ok) {
      return false;
    }
    if (!q) {
      return true;
    }
    return [entry.user, AUDIT_ACTION_LABEL[entry.action] || entry.action, entry.target, entry.detail, entry.ip]
      .some((value) => String(value ?? "").toLowerCase().includes(q));
  });
}

function renderAudit() {
  const rows = filteredAudit();
  auditResultsEl.replaceChildren();
  auditMetaEl.textContent = auditEntries.length
    ? `${rows.length} of ${auditEntries.length} entr${auditEntries.length === 1 ? "y" : "ies"}`
    : "No entries yet";
  if (rows.length === 0) {
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["When", "User", "Action", "Target", "Result", "Detail", "Address"]) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const entry of rows) {
    const tr = document.createElement("tr");
    tr.className = entry.ok ? "bulk-row-changed" : "bulk-row-error";
    for (const text of [
      formatTimestamp(entry.ts),
      entry.user || "-",
      AUDIT_ACTION_LABEL[entry.action] || entry.action,
      entry.target || "",
      entry.ok ? "OK" : "Failed",
      entry.detail || "",
      entry.ip || ""
    ]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  auditResultsEl.appendChild(table);
}

function exportAuditCsv() {
  const rows = filteredAudit();
  if (rows.length === 0) {
    setStatus("Nothing to export.", true);
    return;
  }
  // Prefix a field starting with =,+,-,@ so spreadsheets do not treat it as a formula.
  const cell = (v) => {
    const s = String(v ?? "");
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const lines = [["When", "User", "Action", "Target", "Result", "Detail", "Address"].map(cell).join(",")];
  for (const entry of rows) {
    lines.push([
      formatTimestamp(entry.ts), entry.user, AUDIT_ACTION_LABEL[entry.action] || entry.action,
      entry.target, entry.ok ? "OK" : "Failed", entry.detail, entry.ip
    ].map(cell).join(","));
  }
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pbx-audit-log.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus(`Exported ${rows.length} audit entr${rows.length === 1 ? "y" : "ies"}.`);
}

auditSearchInput.addEventListener("input", renderAudit);
auditFailuresOnly.addEventListener("change", renderAudit);
auditRefreshBtn.addEventListener("click", () => {
  refreshAudit().then(() => setStatus("Audit log refreshed")).catch((error) => setStatus(error.message, true));
});
auditExportBtn.addEventListener("click", exportAuditCsv);

// --- pages ---------------------------------------------------------------------------------
// One document, three views. The view is in the URL (#reporting), so Back, reload and
// bookmarks all land where you expect.
const PAGES = ["configuration", "reporting", "settings"];
let currentPage = null;

function pageFromHash() {
  const wanted = location.hash.replace(/^#/, "");
  return PAGES.includes(wanted) ? wanted : "configuration";
}

/** Shows one page; with a panel id, also brings that panel into view. */
function showPage(name, panelId = null) {
  const page = PAGES.includes(name) ? name : "configuration";
  const changed = page !== currentPage;
  // The first page shown replaces the URL rather than adding a history entry.
  const navigate = currentPage === null ? "replaceState" : "pushState";
  currentPage = page;

  for (const el of document.querySelectorAll(".page")) {
    el.hidden = el.dataset.page !== page;
  }
  for (const link of document.querySelectorAll("#page-nav .page-link")) {
    const active = link.dataset.page === page;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
  if (location.hash.replace(/^#/, "") !== page) {
    history[navigate](null, "", `#${page}`);
  }

  if (changed && page === "reporting" && currentUser?.role === "admin") {
    refreshAudit().catch((error) => setStatus(error.message, true));
  }

  if (changed && page === "settings" && currentUser) {
    refreshSshKey().catch((error) => setStatus(error.message, true));
    renderAccountPanel();
    if (currentUser.role === "admin") {
      refreshUsers().catch((error) => setStatus(error.message, true));
    }
  }

  const panel = panelId ? document.getElementById(panelId) : null;
  if (panel) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (changed) {
    window.scrollTo(0, 0);
  }
}

for (const link of document.querySelectorAll("#page-nav .page-link")) {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showPage(link.dataset.page);
  });
}
window.addEventListener("popstate", () => showPage(pageFromHash()));
window.addEventListener("hashchange", () => showPage(pageFromHash()));

themeToggleBtn.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

refreshBtn.addEventListener("click", async () => {
  try {
    await refreshFiles();
    await refreshRegistrations(true).catch(() => {});
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

/** The highest key that has something configured, so nothing set is ever hidden. */
function highestConfiguredKey() {
  let highest = 0;
  for (const entry of readEntriesRaw()) {
    const m = /^(Extended_Function|Extension|User_ID)_(\d+)_$/.exec(entry.key || "");
    if (!m) continue;
    const n = Number(m[2]);
    const value = String(entry.value == null ? "" : entry.value).trim();
    const configured = m[1] === "Extended_Function"
      ? value !== ""
      : (m[1] === "User_ID" ? value !== "" : value !== "" && !/^disabled$/i.test(value));
    if (configured && n > highest) highest = n;
  }
  return Math.min(highest, quickSchemaData ? quickSchemaData.lineKeyCount : highest);
}

function renderQuickButtons() {
  if (!quickSchemaData) return;
  quickButtonsEl.replaceChildren();

  const modelKeys = QuickConfig.lineKeyCount(effectiveModelChoice());
  const shown = Math.max(modelKeys, highestConfiguredKey());

  for (let i = 1; i <= shown; i += 1) {
    const state = readLineKeyFromEditor(i);
    const beyond = i > modelKeys;
    if (beyond && (!state || state.type === "unused")) continue;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "quick-button" + (state && state.type !== "unused" ? " is-set" : "") + (beyond ? " is-beyond" : "");
    if (beyond) card.title = `Key ${i} is beyond this model's ${modelKeys} line keys. It is still in the config.`;
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
      liveApplyQuickButton();
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

    // For the open phone, leaving the field is enough: the config is updated at once and
    // Save / Upload writes it. For the selected phones a change must be previewed first.
    input.addEventListener("change", () => {
      if (quickScope() === "file") {
        applyQuickSetting(setting.id, input.value);
      }
    });

    const preview = document.createElement("button");
    preview.type = "button";
    preview.textContent = "Preview on selected phones";
    preview.className = "secondary writer-only quick-bulk-only";
    preview.addEventListener("click", () => applyQuickSetting(setting.id, input.value));

    row.append(label, preview);
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
  refreshQuickDirty();
  setStatus(`${description} updated. Press Save / Upload to write it to the PBX.`);
}

/** Whether the editor differs from what was last loaded or saved. */
function editorIsDirty() {
  try {
    return JSON.stringify(readEntries()) !== JSON.stringify(baseline.entries || []);
  } catch {
    // A row that cannot be read (bad attribute JSON) is certainly an unsaved edit.
    return true;
  }
}

/** The name to call the editor's contents by in a warning. */
function editorSubject() {
  return currentFile || fileNameInput.value.trim() || "the new phone";
}

/**
 * Asks before an action throws away unsaved edits. True when there is nothing to
 * lose or the user agreed; callers carry on only on true.
 */
function confirmDiscardEdits(action) {
  if (!editorIsDirty()) {
    return true;
  }
  return confirm(
    `${editorSubject()} has unsaved changes.\n\n`
      + `If you ${action}, they will be lost. Press Cancel to go back and Save / Upload first.`
  );
}

/** Extra line for a confirm dialog whose action will reload the open phone. */
function unsavedEditsWarning(affectsOpenFile) {
  return affectsOpenFile && editorIsDirty()
    ? `\n\nWARNING: ${editorSubject()} is open with unsaved changes, which will be discarded.`
    : "";
}

// Closing or reloading the tab with unsaved edits asks first. Browsers show their own wording.
window.addEventListener("beforeunload", (event) => {
  if (currentUser && editorIsDirty()) {
    event.preventDefault();
    event.returnValue = "";
  }
});

/** The Quick tab's Save button says when there is something to write. */
function refreshQuickDirty() {
  const dirty = Boolean(currentFile || fileNameInput.value.trim()) && editorIsDirty();
  saveQuickBtn.textContent = dirty ? "Save / Upload (unsaved changes)" : "Save / Upload";
  saveQuickBtn.classList.toggle("has-staged", dirty);
  quickStagedNote.textContent = dirty ? "Unsaved changes. Press Save / Upload to write them to the PBX." : "";
}

// Edits made directly in the Advanced table count too.
entriesBody.addEventListener("input", refreshQuickDirty);

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
quickTypeSelect.addEventListener("change", () => {
  renderQuickFields();
  liveApplyQuickButton();
});

/**
 * The open phone's key follows the form as it is filled in. Nothing happens while the
 * form is incomplete (a speed dial with no number yet), and nothing is written until Save.
 */
function liveApplyQuickButton() {
  if (quickScope() !== "file" || !quickEditingIndex) return;
  let produced;
  try {
    produced = QuickConfig.buildLineKey({
      index: quickEditingIndex,
      type: quickTypeSelect.value,
      server: sipServerForQuick(),
      ...quickFieldValues
    });
  } catch {
    return;
  }
  mergeIntoEditor(produced);
  renderQuickButtons();
  refreshQuickDirty();
}

for (const radio of document.querySelectorAll('input[name="quick-scope"]')) {
  radio.addEventListener("change", updateQuickScopeHints);
}

function updateQuickScopeHints() {
  document.body.classList.toggle("quick-scope-bulk", quickScope() === "bulk");
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
  loadDriftDefaults().catch(() => {});
  quickSchemaData = await api("/api/quick/schema");
  populateModelSelect(quickModelSelect, { allowBlank: false });
  populateModelSelect(profileModelSelect, { allowBlank: true });
  writeModelControls(quickControls, effectiveModelChoice());
  syncModelControls(profileControls);
  updateModelNote();

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
  // The passkey button only helps where the browser can actually use one.
  document.getElementById("auth-passkey-block").hidden = step !== "login" || Boolean(passkeyBlocker());

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

const ROLE_LABEL = { admin: "Administrator", user: "User", viewer: "Viewer (read-only)" };

/** Whether the signed-in account may change anything. Viewers only look. */
function canWrite() {
  return Boolean(currentUser) && currentUser.role !== "viewer";
}

/** Applies the signed-in identity to the chrome and reveals admin-only controls. */
function applyIdentity(user, token) {
  currentUser = user;
  csrfToken = token;
  document.body.classList.toggle("role-viewer", Boolean(user) && user.role === "viewer");

  const signedIn = Boolean(user);
  currentUserEl.hidden = !signedIn;
  logoutBtn.hidden = !signedIn;
  // Both live on the Settings page: everyone has an account, only admins manage users.
  accountPanel.hidden = !signedIn;
  usersPanel.hidden = !signedIn || user.role !== "admin";
  auditPanel.hidden = !signedIn || user.role !== "admin";
  if (signedIn && currentPage === "settings") {
    refreshSshKey().catch(() => {});
  }
  if (signedIn && user.role === "admin" && currentPage === "reporting") {
    refreshAudit().catch(() => {});
  }
  if (signedIn && currentPage === "settings") {
    renderAccountPanel();
    if (user.role === "admin") {
      refreshUsers().catch((error) => setStatus(error.message, true));
    }
  }

  if (signedIn) {
    currentUserEl.textContent = user.role === "user" ? user.username : `${user.username} (${user.role})`;
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
  if (!confirmDiscardEdits("sign out")) {
    return;
  }
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

// The name in the header is the way to your own account settings.
currentUserEl.addEventListener("click", () => showPage("settings", "account-panel"));
currentUserEl.title = "Account settings";
currentUserEl.style.cursor = "pointer";

// --- passkeys (WebAuthn) ---------------------------------------------------------
//
// The browser API wants ArrayBuffers where the server speaks base64url; the newer
// PublicKeyCredential JSON helpers do that conversion natively and are used when
// present, with a small fallback for browsers that lack them.

function b64urlToBuffer(s) {
  const b64 = String(s).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(s).length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function bufferToB64url(buf) {
  let bin = "";
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function webauthnOptionsFromJson(options, kind) {
  if (kind === "create" && PublicKeyCredential.parseCreationOptionsFromJSON) return PublicKeyCredential.parseCreationOptionsFromJSON(options);
  if (kind === "get" && PublicKeyCredential.parseRequestOptionsFromJSON) return PublicKeyCredential.parseRequestOptionsFromJSON(options);
  const out = { ...options, challenge: b64urlToBuffer(options.challenge) };
  if (options.user) out.user = { ...options.user, id: b64urlToBuffer(options.user.id) };
  for (const key of ["excludeCredentials", "allowCredentials"]) {
    if (options[key]) out[key] = options[key].map((c) => ({ ...c, id: b64urlToBuffer(c.id) }));
  }
  return out;
}

function webauthnCredentialToJson(cred) {
  if (typeof cred.toJSON === "function") return cred.toJSON();
  const r = cred.response;
  const response = { clientDataJSON: bufferToB64url(r.clientDataJSON) };
  if (r.attestationObject) {
    response.attestationObject = bufferToB64url(r.attestationObject);
    if (r.getTransports) response.transports = r.getTransports();
  } else {
    response.authenticatorData = bufferToB64url(r.authenticatorData);
    response.signature = bufferToB64url(r.signature);
    response.userHandle = r.userHandle ? bufferToB64url(r.userHandle) : null;
  }
  return { id: cred.id, rawId: bufferToB64url(cred.rawId), type: cred.type, response, clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {}, authenticatorAttachment: cred.authenticatorAttachment || null };
}

/** Why passkeys cannot be used on this page, or null when they can. */
function passkeyBlocker() {
  if (!window.PublicKeyCredential || !navigator.credentials) return "This browser does not support passkeys.";
  if (!window.isSecureContext) return "Passkeys need HTTPS (or localhost).";
  const host = location.hostname;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.startsWith("[")) return "Passkeys need a hostname, not an IP address; open the app by its DNS name.";
  return null;
}

async function signInWithPasskey() {
  const btn = document.getElementById("auth-passkey-btn");
  btn.disabled = true;
  try {
    const { token, options } = await api("/api/auth/passkeys/login/options", { method: "POST", body: "{}" });
    const cred = await navigator.credentials.get({ publicKey: webauthnOptionsFromJson(options, "get") });
    const data = await api("/api/auth/passkeys/login/verify", { method: "POST", body: JSON.stringify({ token, response: webauthnCredentialToJson(cred) }) });
    applyIdentity(data.user, data.csrfToken);
    await onSignedIn();
  } catch (error) {
    // The browser throws NotAllowedError when the prompt is cancelled or times out.
    setAuthMessage(error.name === "NotAllowedError" ? "Passkey prompt cancelled." : error.message);
  } finally {
    btn.disabled = false;
  }
}

document.getElementById("auth-passkey-btn").addEventListener("click", signInWithPasskey);

async function addPasskey() {
  const name = prompt("Name this passkey (for example: work laptop, phone):", "");
  if (name === null) return;
  try {
    const { options } = await api("/api/auth/passkeys/register/options", { method: "POST", body: "{}" });
    const cred = await navigator.credentials.create({ publicKey: webauthnOptionsFromJson(options, "create") });
    const data = await api("/api/auth/passkeys/register/verify", { method: "POST", body: JSON.stringify({ name, response: webauthnCredentialToJson(cred) }) });
    renderPasskeys(data.passkeys);
    await refreshIdentity();
    setStatus(`Passkey "${data.passkey.name}" added.`);
  } catch (error) {
    setStatus(error.name === "NotAllowedError" ? "Passkey prompt cancelled." : error.name === "InvalidStateError" ? "This device already holds a passkey for your account." : error.message, true);
  }
}

document.getElementById("acct-add-passkey").addEventListener("click", addPasskey);

function renderPasskeys(list) {
  const ul = document.getElementById("acct-passkeys");
  ul.replaceChildren();
  for (const p of list) {
    const li = document.createElement("li");
    const row = document.createElement("div");
    row.className = "passkey-row";
    const text = document.createElement("div");
    const name = document.createElement("div");
    name.className = "passkey-name";
    name.textContent = p.name;
    const meta = document.createElement("div");
    meta.className = "passkey-meta";
    meta.textContent = `Added ${formatTimestamp(Math.floor(p.createdAt / 1000))}${p.lastUsedAt ? `, last used ${formatTimestamp(Math.floor(p.lastUsedAt / 1000))}` : ", never used"}${p.backedUp ? ", synced" : ""}`;
    text.append(name, meta);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ghost-danger small";
    remove.textContent = "Remove";
    remove.addEventListener("click", async () => {
      if (!confirm(`Remove the passkey "${p.name}"? You can still sign in with your password.`)) return;
      try {
        const data = await api(`/api/auth/passkeys/${encodeURIComponent(p.id)}`, { method: "DELETE" });
        renderPasskeys(data.passkeys);
        await refreshIdentity();
        setStatus("Passkey removed.");
      } catch (error) {
        setStatus(error.message, true);
      }
    });
    row.append(text, remove);
    li.appendChild(row);
    ul.appendChild(li);
  }
  if (!list.length) {
    const li = document.createElement("li");
    li.className = "passkey-meta";
    li.textContent = "No passkeys yet.";
    ul.appendChild(li);
  }
}

async function loadPasskeys() {
  const blocker = passkeyBlocker();
  const note = document.getElementById("acct-passkey-note");
  note.hidden = !blocker;
  note.textContent = blocker || "";
  document.getElementById("acct-add-passkey").hidden = Boolean(blocker);
  try {
    const data = await api("/api/auth/passkeys");
    renderPasskeys(data.passkeys || []);
  } catch (error) {
    renderPasskeys([]);
  }
}

function renderAccountPanel() {
  const enrolled = Boolean(currentUser?.mfaEnrolled);
  document.getElementById("account-mfa-state").textContent = `Two-factor: ${enrolled ? "on" : "off"}`;
  document.getElementById("acct-enable-mfa").hidden = enrolled;
  document.getElementById("acct-disable-mfa").hidden = !enrolled;
  if (currentUser) loadPasskeys();
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
      ROLE_LABEL[user.role] || user.role,
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
      const roleSelect = document.createElement("select");
      roleSelect.className = "small";
      roleSelect.title = "Change role";
      for (const [value, label] of Object.entries(ROLE_LABEL)) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        opt.selected = value === user.role;
        roleSelect.appendChild(opt);
      }
      roleSelect.addEventListener("change", async () => {
        try {
          await api(`/api/users/${encodeURIComponent(user.id)}/role`, { method: "POST", body: JSON.stringify({ role: roleSelect.value }) });
          await refreshUsers();
          setStatus(`${user.username} is now ${ROLE_LABEL[roleSelect.value].toLowerCase()}.`);
        } catch (error) {
          setStatus(error.message, true);
          roleSelect.value = user.role;
        }
      });
      wrap.appendChild(roleSelect);

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
    applyConnections(data.connections);
    if (data.connected && data.connection) {
      lastConnectionInfo = data.connection;
      workspaceKey = connectionKeyOf(data.connection);
      setConnectionCollapsed(true, data.connection);
      setStatus(`Connected: ${data.connection.host} (${data.connection.remoteDir})`);
      if (data.connection.profileId) {
        serverSelect.value = data.connection.profileId;
        fillFormFromServer(data.connection.profileId);
      }
      await refreshFiles();
    } else {
      setConnectionCollapsed(false);
      if (data.lostMessage) {
        setStatus(data.lostMessage, true);
      }
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


showPage(pageFromHash());
