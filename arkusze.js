
// code.js

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyWGvd3jt_9tMwBHn-6giZyYNbX8mzVJDIETzAbQgydHlJoRkiYyX85TqYyteUqAqndMQ/exec";
// ↑↑↑ tutaj wklej swój prawdziwy URL ↑↑↑

/**
 * Odczytuje wartość z konkretnej komórki
 */
async function getCell(cellAdres, sheetName = "Arkusz1") {
  try {
    const row = cellToRow(cellAdres);
    const col = cellToCol(cellAdres);

    const params = new URLSearchParams({
      action: "getValue",
      row: row,
      col: col,
      sheet: sheetName
    });

    const resp = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    if (!resp.ok) {
      console.log("Status:", resp.status);
      throw new Error("HTTP " + resp.status);
    }

    const text = await resp.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log("Nie udało się sparsować JSON → surowy tekst:", text);
      return text;   // albo null, w zależności co wolisz
    }

    return data.value !== undefined ? data.value : data;
  } catch (err) {
    console.error("getCell error:", err);
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
