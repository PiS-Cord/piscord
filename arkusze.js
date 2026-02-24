
// code.js

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyVzCrNzNrlh8sd-ZgIzCKwtrb-jWB_C78yXmts3_MIyRblLQD-ijfCu6dMi7xcPLXkwg/exec";
// ↑↑↑ tutaj wklej swój prawdziwy URL ↑↑↑

/**
 * Odczytuje wartość z konkretnej komórki
 */
async function getCell(cellAdres, sheetName = "Arkusz1") {
  try {
    const url = `${WEB_APP_URL}?action=getValue&row=${cellToRow(cellAdres)}&col=${cellToCol(cellAdres)}&sheet=${encodeURIComponent(sheetName)}`;
    
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(resp.status);
    
    const text = await resp.text();
    // Twój skrypt zwraca czysty tekst lub JSON
    try {
      return JSON.parse(text);   // jeśli używasz json()
    } catch {
      return text;               // jeśli używasz ok()
    }
  } catch (err) {
    console.error("getCell błąd:", err);
    return null;
  }
}

/**
 * Zapisuje wartość do komórki
 */
async function setCell(cellAdres, value, sheetName = "Arkusz1") {
  try {
    const resp = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "setValue",
        row: cellToRow(cellAdres),
        col: cellToCol(cellAdres),
        value: value,
        sheet: sheetName
      })
    });

    if (!resp.ok) throw new Error(resp.status);
    return true;
  } catch (err) {
    console.error("setCell błąd:", err);
    return false;
  }
}

// ---------------------------------------------------
// Pomocnicze – konwersja A1 → row / col
// ---------------------------------------------------
function cellToRow(cell) {
  return parseInt(cell.replace(/[A-Z]+/i, ""));
}

function cellToCol(cell) {
  let col = cell.replace(/\d+/g, "").toUpperCase();
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.charCodeAt(i) - 64);
  }
  return num;
}
