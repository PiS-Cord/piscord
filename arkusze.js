// ===== KONFIG =====
const ARKUSZE_URL = "TU_WKLEJ_URL_APPS_SCRIPT";

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
      values: JSON.stringify(valuesArray)
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
      body: new URLSearchParams(data)
    });
    return res.text();
  }

};
