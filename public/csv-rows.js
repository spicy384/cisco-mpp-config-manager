/**
 * Reading a pasted or uploaded list of phones.
 *
 * Loaded by both the server and the browser, so the list the operator previews is
 * read exactly the way the server will read it.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.CsvRows = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DELIMITERS = [",", "\t", ";"];

  /** The delimiter the first line uses most, counted outside quotes. Comma if none. */
  function detectDelimiter(text) {
    const firstLine = String(text).split(/\r?\n/).find((line) => line.trim() !== "") || "";
    let best = ",";
    let bestCount = 0;
    for (const delimiter of DELIMITERS) {
      let count = 0;
      let quoted = false;
      for (const ch of firstLine) {
        if (ch === '"') quoted = !quoted;
        else if (ch === delimiter && !quoted) count += 1;
      }
      if (count > bestCount) {
        best = delimiter;
        bestCount = count;
      }
    }
    return best;
  }

  /**
   * Delimited text into rows of trimmed cells. Understands quoted cells, doubled
   * quotes inside them, and line breaks of either kind. Blank lines are skipped;
   * each row remembers the line it started on, for error messages.
   */
  function parseDelimited(text) {
    const source = String(text == null ? "" : text).replace(/^﻿/, "");
    const delimiter = detectDelimiter(source);
    const rows = [];
    let cells = [];
    let cell = "";
    let quoted = false;
    let wasQuoted = false;
    let line = 1;
    let rowLine = 1;

    const endCell = () => {
      cells.push(wasQuoted ? cell : cell.trim());
      cell = "";
      wasQuoted = false;
    };
    const endRow = () => {
      endCell();
      if (cells.some((c) => c !== "")) {
        rows.push({ line: rowLine, cells });
      }
      cells = [];
    };

    for (let i = 0; i < source.length; i += 1) {
      const ch = source[i];
      if (quoted) {
        if (ch === '"' && source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else if (ch === '"') {
          quoted = false;
        } else {
          if (ch === "\n") line += 1;
          cell += ch;
        }
      } else if (ch === '"' && cell.trim() === "") {
        quoted = true;
        wasQuoted = true;
        cell = "";
      } else if (ch === delimiter) {
        endCell();
      } else if (ch === "\n") {
        endRow();
        line += 1;
        rowLine = line;
      } else if (ch !== "\r" && !(wasQuoted && /\s/.test(ch))) {
        // Anything but padding after a closing quote is kept.
        cell += ch;
      }
    }
    if (cell !== "" || cells.length > 0) {
      endRow();
    }

    return rows;
  }

  // What each column may be called in a header row, compared without case,
  // spaces, underscores or punctuation.
  const COLUMN_NAMES = {
    mac: ["mac", "macaddress", "file", "filename", "phone"],
    ext: ["ext", "extension", "userid", "line1", "line", "number"],
    displayName: ["name", "displayname", "line1name", "callerid"],
    password: ["password", "sippassword", "secret", "pass"],
    station: ["station", "stationname", "stationdisplayname", "label"]
  };
  const COLUMN_ORDER = ["mac", "ext", "displayName", "password", "station"];

  function headerKey(cell) {
    const clean = String(cell).toLowerCase().replace(/[^a-z0-9]/g, "");
    return COLUMN_ORDER.find((column) => COLUMN_NAMES[column].includes(clean)) || null;
  }

  /**
   * Rows of cells into phone records. A first row that names at least the MAC and
   * extension columns is a header, and columns may then come in any order; without
   * one the order is MAC, extension, display name, password, station.
   */
  function mapPhoneRows(rows) {
    if (rows.length === 0) {
      return { hadHeader: false, columns: COLUMN_ORDER.slice(), phones: [] };
    }

    const headerCells = rows[0].cells.map(headerKey);
    const hadHeader = headerCells.includes("mac") && headerCells.includes("ext");
    const columns = hadHeader ? headerCells : COLUMN_ORDER.slice();
    const body = hadHeader ? rows.slice(1) : rows;

    const phones = body.map((row) => {
      const phone = { line: row.line, mac: "", ext: "", displayName: "", password: "", station: "" };
      columns.forEach((column, index) => {
        if (column && row.cells[index] !== undefined && phone[column] === "") {
          phone[column] = row.cells[index];
        }
      });
      return phone;
    });

    return { hadHeader, columns, phones };
  }

  /** A MAC in any common notation becomes spa<mac>.xml; a .xml name is taken as it is. */
  function macToFileName(text) {
    const raw = String(text == null ? "" : text).trim();
    if (!raw) {
      return "";
    }
    if (/\.xml$/i.test(raw)) {
      return raw;
    }
    const hex = raw.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
    const onlyMacCharacters = /^[0-9a-fA-F:.\-\s]+$/.test(raw);
    return onlyMacCharacters && hex.length === 12 ? `spa${hex}.xml` : "";
  }

  function parsePhoneList(text) {
    return mapPhoneRows(parseDelimited(text));
  }

  return { detectDelimiter, parseDelimited, mapPhoneRows, parsePhoneList, macToFileName, COLUMN_ORDER };
}));
