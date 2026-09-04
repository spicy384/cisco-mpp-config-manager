/**
 * "Quick" configuration recipes.
 *
 * Each recipe turns a small, friendly set of inputs into the tags and attributes a
 * Cisco MPP phone actually expects, and can read an existing config back into those
 * inputs so the editor shows what is already set.
 *
 * This module is loaded by BOTH the server and the browser, deliberately: the live
 * preview in the UI and the values actually written must never be able to disagree.
 *
 * Only syntax confirmed against real configuration is encoded here. Anything else
 * goes through the "custom" line-key type, where the operator supplies the fnc=
 * string and the app still handles the surrounding tag plumbing.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.QuickConfig = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  // Line keys present on the phone models in use.
  // The most line keys any supported phone can address, expansion modules included
  // (an 8861 with three 28-key modules). The grid shows only what the model has.
  const LINE_KEY_COUNT = 100;

  /**
   * Line keys as the MPP firmware exposes them, which is what the config addresses.
   * kem: the key expansion module the model takes, and how many can be chained.
   * Counts confirmed on hardware are marked; correct the rest with the Custom model.
   */
  const PHONE_MODELS = [
    { id: "6821", label: "Cisco 6821", keys: 2 },
    { id: "6841", label: "Cisco 6841", keys: 4 },
    { id: "6851", label: "Cisco 6851", keys: 4, kem: { keys: 14, max: 1 } },
    { id: "6861", label: "Cisco 6861", keys: 4 },
    { id: "6871", label: "Cisco 6871", keys: 6, kem: { keys: 14, max: 1 } },
    { id: "7811", label: "Cisco 7811", keys: 1 },
    { id: "7821", label: "Cisco 7821", keys: 2 },
    { id: "7841", label: "Cisco 7841", keys: 4 },
    { id: "7861", label: "Cisco 7861", keys: 16 },
    { id: "8811", label: "Cisco 8811", keys: 10 },
    { id: "8841", label: "Cisco 8841", keys: 10, confirmed: true },
    { id: "8845", label: "Cisco 8845", keys: 10 },
    { id: "8851", label: "Cisco 8851", keys: 10, kem: { keys: 28, max: 2 } },
    { id: "8861", label: "Cisco 8861", keys: 10, kem: { keys: 28, max: 3 } },
    { id: "8865", label: "Cisco 8865", keys: 10, kem: { keys: 28, max: 3 } },
    { id: "custom", label: "Custom (enter the number of keys)", keys: null }
  ];
  const DEFAULT_MODEL = "8841";
  const MODEL_BY_ID = new Map(PHONE_MODELS.map((m) => [m.id, m]));

  function findModel(id) {
    return MODEL_BY_ID.get(String(id || "")) || null;
  }

  /**
   * Cleans a { model, kems, customKeys } choice: unknown models become none,
   * expansion modules are clamped to what the model takes, custom counts to 1..LINE_KEY_COUNT.
   */
  function normalizeModelChoice(choice) {
    const model = findModel(choice && choice.model);
    if (!model) {
      return null;
    }
    const kemMax = model.kem ? model.kem.max : 0;
    const kems = Math.max(0, Math.min(kemMax, Math.floor(Number(choice.kems) || 0)));
    const customRaw = Math.floor(Number(choice.customKeys) || 0);
    const customKeys = model.id === "custom"
      ? Math.max(1, Math.min(LINE_KEY_COUNT, customRaw || 1))
      : 0;
    return { model: model.id, kems, customKeys };
  }

  /** How many line keys a phone has, given its model and expansion modules. */
  function lineKeyCount(choice) {
    const clean = normalizeModelChoice(choice) || { model: DEFAULT_MODEL, kems: 0, customKeys: 0 };
    const model = findModel(clean.model);
    const base = model.id === "custom" ? clean.customKeys : model.keys;
    const extra = model.kem ? clean.kems * model.kem.keys : 0;
    return Math.max(1, Math.min(LINE_KEY_COUNT, base + extra));
  }

  function describeModelChoice(choice) {
    const clean = normalizeModelChoice(choice);
    if (!clean) {
      return "";
    }
    const model = findModel(clean.model);
    const label = model.id === "custom" ? `Custom` : model.label;
    const kem = clean.kems ? ` + ${clean.kems} expansion module${clean.kems === 1 ? "" : "s"}` : "";
    const count = lineKeyCount(clean);
    return `${label}${kem}: ${count} line key${count === 1 ? "" : "s"}`;
  }

  const str = (v) => String(v ?? "").trim();

  /**
   * Line key types.
   *
   * `target` is the extension being dialled or watched. Speed dial addresses it with
   * ext=, while the BLF variants subscribe to it with sub= - that difference matters,
   * so each type declares its own parameter name.
   */
  const LINE_KEY_TYPES = [
    {
      id: "line",
      label: "Line (register an extension)",
      // A registered line carries the SIP account rather than an extended function.
      fields: ["target", "name", "password", "shortName"],
      labels: {
        target: "Extension #",
        name: "Display name",
        password: "SIP password",
        shortName: "Short name"
      },
      placeholders: {
        target: "1001",
        name: "IT Helpdesk",
        password: "12345abcd",
        shortName: "1001"
      },
      describe: (v) => (v.target ? `Line ${v.target}` : "Line"),
      build: ({ index, target, name, password, shortName }) => {
        const ext = str(target);
        if (!ext) {
          throw new Error("A line needs an extension number.");
        }

        // Every field the form shows is written, including blanks: the form is
        // pre-filled from the current config, so what you see is what gets saved.
        return [
          { key: `Extension_${index}_`, value: String(index) },
          { key: `User_ID_${index}_`, value: ext, attributes: { ua: "na" } },
          { key: `Display_Name_${index}_`, value: str(name), attributes: { ua: "na" } },
          { key: `Password_${index}_`, value: str(password), attributes: { ua: "na" } },
          { key: `Short_Name_${index}_`, value: str(shortName), attributes: { ua: "na" } },
          { key: `Extended_Function_${index}_`, value: "" }
        ];
      },
      read: (get, index) => ({
        type: "line",
        target: get(`User_ID_${index}_`),
        name: get(`Display_Name_${index}_`),
        password: get(`Password_${index}_`),
        shortName: get(`Short_Name_${index}_`),
        server: "",
        custom: ""
      })
    },
    {
      id: "speed-dial",
      label: "Speed dial",
      fields: ["target", "name"],
      labels: { target: "Extension", name: "Display name" },
      placeholders: { target: "1002", name: "Support" },
      describe: (v) => `Speed dial ${v.target}${v.name ? ` (${v.name})` : ""}`,
      fnc: "sd",
      param: "ext"
    },
    {
      id: "blf",
      label: "BLF (watch extension)",
      fields: ["target", "name"],
      labels: { target: "Extension", name: "Display name" },
      placeholders: { target: "1003", name: "Sales" },
      describe: (v) => `BLF ${v.target}${v.name ? ` (${v.name})` : ""}`,
      fnc: "blf",
      param: "sub"
    },
    {
      id: "blf-sd-cp",
      label: "BLF + speed dial + call pickup",
      fields: ["target", "name"],
      labels: { target: "Extension", name: "Display name" },
      placeholders: { target: "1001", name: "IT Helpdesk" },
      describe: (v) => `BLF/SD ${v.target}${v.name ? ` (${v.name})` : ""}`,
      fnc: "blf+sd+cp",
      param: "sub"
    },
    {
      id: "custom",
      label: "Custom (enter the fnc= string yourself)",
      fields: ["custom"],
      labels: { custom: "Custom fnc= string" },
      placeholders: { custom: "fnc=prk;sub=1100@server:5060;nme=Park" },
      describe: (v) => `Custom: ${v.custom}`,
      custom: true
    },
    {
      id: "unused",
      label: "Unused (clear this button)",
      fields: [],
      labels: {},
      placeholders: {},
      describe: () => "Unused",
      build: ({ index }) => [
        { key: `Extension_${index}_`, value: "Disabled" },
        { key: `Extended_Function_${index}_`, value: "" }
      ]
    }
  ];

  const LINE_KEY_TYPE_BY_ID = new Map(LINE_KEY_TYPES.map((t) => [t.id, t]));

  function assertIndex(index) {
    const n = Number(index);
    if (!Number.isInteger(n) || n < 1 || n > LINE_KEY_COUNT) {
      throw new Error(`Button number must be between 1 and ${LINE_KEY_COUNT}.`);
    }
    return n;
  }

  /**
   * Builds the tags for one line key.
   * `server` is the SIP server from the saved PBX profile, e.g. "pbx.example.com:5060".
   */
  function buildLineKey(input) {
    const index = assertIndex(input.index);
    const def = LINE_KEY_TYPE_BY_ID.get(String(input.type));

    if (!def) {
      throw new Error(`Unknown button type: ${input.type}`);
    }

    if (def.build) {
      return def.build({ ...input, index });
    }

    if (def.custom) {
      const fnc = str(input.custom);
      if (!fnc) {
        throw new Error("Enter the fnc= string for a custom button.");
      }
      return [
        { key: `Extension_${index}_`, value: "Disabled" },
        { key: `Extended_Function_${index}_`, value: fnc }
      ];
    }

    const target = str(input.target);
    if (!target) {
      throw new Error(`${def.label} needs an extension number.`);
    }

    const server = str(input.server);
    if (!server) {
      throw new Error(
        "No SIP server is set for this PBX. Add one to the saved server profile "
        + "so speed dial and BLF buttons know where to point."
      );
    }

    const parts = [`fnc=${def.fnc}`, `${def.param}=${target}@${server}`];
    const name = str(input.name);
    if (name) {
      parts.push(`nme=${name}`);
    }

    // Assigning an extended function requires the line registration on that key to be off.
    return [
      { key: `Extension_${index}_`, value: "Disabled" },
      { key: `Extended_Function_${index}_`, value: parts.join(";") }
    ];
  }

  /** Splits "fnc=sd;ext=1002@host:5060;nme=Support" into its parts. */
  function parseExtendedFunction(value) {
    const out = {};
    for (const chunk of String(value || "").split(";")) {
      const idx = chunk.indexOf("=");
      if (idx > 0) {
        out[chunk.slice(0, idx).trim().toLowerCase()] = chunk.slice(idx + 1).trim();
      }
    }
    return out;
  }

  const blank = { target: "", name: "", password: "", shortName: "", server: "", custom: "" };

  /**
   * Reads one line key back into form values, so the editor shows what is set.
   * Returns null when the button has never been configured.
   */
  function readLineKey(entries, index) {
    const n = assertIndex(index);
    const get = (key) => String(entries.find((e) => e.key === key)?.value ?? "").trim();

    const fnValue = get(`Extended_Function_${n}_`);
    const extValue = get(`Extension_${n}_`);

    if (fnValue) {
      const parsed = parseExtendedFunction(fnValue);
      const fnc = String(parsed.fnc || "").toLowerCase();
      const known = LINE_KEY_TYPES.find((t) => t.fnc && t.fnc === fnc);

      if (known) {
        const raw = parsed[known.param] || "";
        const at = raw.indexOf("@");
        return {
          ...blank,
          index: n,
          type: known.id,
          target: at >= 0 ? raw.slice(0, at) : raw,
          server: at >= 0 ? raw.slice(at + 1) : "",
          name: parsed.nme || ""
        };
      }

      // Something we do not model: surface it as custom rather than misreport it.
      return { ...blank, index: n, type: "custom", custom: fnValue };
    }

    if (extValue && extValue.toLowerCase() !== "disabled") {
      const lineDef = LINE_KEY_TYPE_BY_ID.get("line");
      return { ...blank, index: n, ...lineDef.read(get, n) };
    }

    if (extValue.toLowerCase() === "disabled") {
      return { ...blank, index: n, type: "unused" };
    }

    return null;
  }

  function describeLineKey(state) {
    if (!state) {
      return "Not set";
    }
    const def = LINE_KEY_TYPE_BY_ID.get(state.type);
    return def ? def.describe(state) : state.type;
  }

  /**
   * Single-value settings, in the order they appear in the editor.
   * Each writes one or more tags with the attributes the phone expects.
   */
  const QUICK_SETTINGS = [
    {
      id: "station-name",
      label: "Station display name",
      hint: "Shown on the phone's screen and used to identify it in this app.",
      placeholder: "Reception - 1001",
      build: (v) => [{ key: "Station_Display_Name", value: v, attributes: { ua: "na" } }],
      read: (get) => get("Station_Display_Name")
    },
    {
      id: "voicemail",
      label: "Voicemail number",
      hint: "Dialled by the phone's message button.",
      placeholder: "*97",
      build: (v) => [{ key: "Voice_Mail_Number", value: v, attributes: { ua: "na" } }],
      read: (get) => get("Voice_Mail_Number")
    },
    {
      id: "timezone",
      label: "Time zone",
      hint: "For example GMT-05:00.",
      placeholder: "GMT-05:00",
      build: (v) => [{ key: "Time_Zone", value: v, attributes: { ua: "na" } }],
      read: (get) => get("Time_Zone")
    },
    {
      id: "ntp",
      label: "NTP server",
      hint: "Time source the phone synchronises with.",
      placeholder: "0.us.pool.ntp.org",
      build: (v) => [{ key: "Primary_NTP_Server", value: v, attributes: { ua: "na" } }],
      read: (get) => get("Primary_NTP_Server")
    },
    {
      id: "admin-password",
      label: "Admin password",
      hint: "Protects the phone's own web interface and settings menu.",
      placeholder: "12345",
      sensitive: true,
      build: (v) => [{ key: "Admin_Passwd", value: v, attributes: { ua: "rw" } }],
      read: (get) => get("Admin_Passwd")
    },
    {
      id: "wallpaper",
      label: "Wallpaper",
      hint: "URL the phone downloads its background from.",
      placeholder: "tftp://server/images/wallpaper.png",
      build: (v) => [
        { key: "Phone_Background", value: "Download Picture", attributes: { ua: "na" } },
        { key: "Picture_Download_URL", value: v, attributes: { ua: "rw" } }
      ],
      // Only report a URL when the phone is actually set to download one.
      read: (get) => (get("Phone_Background").toLowerCase() === "download picture" ? get("Picture_Download_URL") : "")
    }
  ];

  const QUICK_SETTING_BY_ID = new Map(QUICK_SETTINGS.map((s) => [s.id, s]));

  function buildSetting(id, value) {
    const def = QUICK_SETTING_BY_ID.get(String(id));
    if (!def) {
      throw new Error(`Unknown setting: ${id}`);
    }

    const clean = str(value);
    if (!clean) {
      throw new Error(`${def.label} needs a value.`);
    }

    return def.build(clean);
  }

  function readSetting(id, entries) {
    const def = QUICK_SETTING_BY_ID.get(String(id));
    if (!def) {
      return "";
    }
    const get = (key) => String(entries.find((e) => e.key === key)?.value ?? "").trim();
    return def.read(get);
  }

  /** Serialisable description of the recipes, so the browser builds its forms from this. */
  function quickSchema() {
    return {
      lineKeyCount: LINE_KEY_COUNT,
      models: PHONE_MODELS.map((m) => ({ id: m.id, label: m.label, keys: m.keys, kem: m.kem || null, confirmed: Boolean(m.confirmed) })),
      defaultModel: DEFAULT_MODEL,
      lineKeyTypes: LINE_KEY_TYPES.map((t) => ({
        id: t.id,
        label: t.label,
        fields: t.fields,
        labels: t.labels,
        placeholders: t.placeholders,
        needsServer: Boolean(t.fnc)
      })),
      settings: QUICK_SETTINGS.map((s) => ({
        id: s.id,
        label: s.label,
        hint: s.hint,
        placeholder: s.placeholder,
        sensitive: Boolean(s.sensitive)
      }))
    };
  }

  /** Merges recipe output into an entry list, replacing matching tags. */
  function applyEntriesToConfig(entries, produced) {
    const next = entries.map((e) => ({ ...e }));

    for (const item of produced) {
      const existing = next.find((e) => e.key === item.key);
      if (existing) {
        existing.value = item.value;
        // Only set attributes the recipe is explicit about; otherwise keep the file's.
        if (item.attributes) {
          existing.attributes = { ...existing.attributes, ...item.attributes };
        }
      } else {
        next.push({ key: item.key, value: item.value, attributes: item.attributes || {} });
      }
    }

    return next;
  }

  return {
    LINE_KEY_COUNT,
    PHONE_MODELS,
    DEFAULT_MODEL,
    findModel,
    normalizeModelChoice,
    lineKeyCount,
    describeModelChoice,
    LINE_KEY_TYPES,
    QUICK_SETTINGS,
    buildLineKey,
    readLineKey,
    describeLineKey,
    parseExtendedFunction,
    buildSetting,
    readSetting,
    quickSchema,
    applyEntriesToConfig
  };
}));
