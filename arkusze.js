// ===== KONFIG =====
const ARKUSZE_URL = "https://script.google.com/macros/s/AKfycbyVzCrNzNrlh8sd-ZgIzCKwtrb-jWB_C78yXmts3_MIyRblLQD-ijfCu6dMi7xcPLXkwg/exec";

// ===== GŁÓWNY OBIEKT =====
const Arkusze = {

  // ---------- ZAPIS ----------
  setValue: async function(sheet, row, col, value) {
    return this._post({
      action: "setValue",
      sheet, row, col, value
    });
  },

  appendRow: async function(sheet, valuesArray) {
    return this._post({
      action: "appendRow",
      sheet,
      values: valuesArray   // <--- tablica bez JSON.stringify
    });
  },

  // ---------- ODCZYT ----------
  getValue: async function(sheet, row, col) {
    return this._post({
      action: "getValue",
      sheet, row, col
    });
  },

  getAll: async function(sheet) {
    return this._post({
      action: "getAll",
      sheet
    });
  },

  // ---------- BEZPIECZNE FORMUŁY ----------
  applyFormula: async function(sheet, row, col, type, range) {
    return this._post({
      action: "applyFormula",
      sheet,
      row,
      col,
      type,
      range
    });
  },

  // ---------- WEWNĘTRZNE ----------
  _post: async function(data) {
    const res = await fetch(ARKUSZE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },  // <--- wysyłamy JSON
      body: JSON.stringify(data)
    });

    // zwracamy JSON od razu, żeby getAll() w HTML było tablicą
    return res.json();
  }

};
