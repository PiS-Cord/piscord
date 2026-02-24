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
      values: JSON.stringify(valuesArray) // <- JSON.stringify pasuje do Twojego Apps Script
    });
  },

  // ---------- ODCZYT ----------
  getValue: async function(sheet, row, col) {
    const res = await this._post({
      action: "getValue",
      sheet, row, col
    });
    return JSON.parse(res);
  },

  getAll: async function(sheet) {
    const res = await this._post({
      action: "getAll",
      sheet
    });
    return JSON.parse(res); // <- parsujemy JSON od Apps Script
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

  // jeśli action GET, zwracamy JSON
  if(data.action === "getAll" || data.action === "getValue") {
    return res.json();   // <- to już zwraca obiekt/array w JS
  }
  return res.text();     // dla append/setValue/setFormula
}

};
