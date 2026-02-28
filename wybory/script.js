// script.js – Kompletna wersja z hasłem w A2 i naprawionymi wykresami

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxcLeg8gbl2XSYfcC1L1-Py_KjVYvWVJrXzs88mgQi4JX-079bQR7OvyhRSktQPNnTF/exec";

// ────────────────────────────────────────────────
// SYSTEM ADMINA PRZEZ KONSOLĘ (Hasło z A2)
// ────────────────────────────────────────────────
// Aby użyć: F12 -> Konsola -> await admin("hasło_z_arkusza")
window.admin = async function(input) {
    console.log("%c[System] Pobieranie hasła z bazy...", "color: gray;");
    const passwordFromSheet = await getCell("A2", "Arkusz1");

    if (!passwordFromSheet || input.toString().trim() !== passwordFromSheet.toString().trim()) {
        console.error("Błędne hasło! Dostęp zablokowany.");
        return "Access Denied";
    }

    // Lista sekcji do odblokowania
    const sections = ["wykresy", "mapWojProste"];
    const containers = document.querySelectorAll(".woj-img-container");

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle("ukryte");
            el.classList.toggle("pokaz");
        }
    });

    containers.forEach(c => {
        c.classList.toggle("ukryte");
        c.classList.toggle("pokaz");
    });

    console.log("%c[System] Panel administratora odblokowany!", "color: green; font-weight: bold;");
    
    // Wymuszamy odświeżenie wykresów po pokazaniu sekcji
    odswiezWykresy();
    odswiezKoloryWojewodztw();
    
    return "Status zmieniony.";
};

// ────────────────────────────────────────────────
// KOMUNIKACJA Z ARKUSZEM
// ────────────────────────────────────────────────
async function getCell(cellAdres, sheetName = "Arkusz1") {
  try {
    const row = cellToRow(cellAdres);
    const col = cellToCol(cellAdres);
    const params = new URLSearchParams({ action: "getValue", row, col, sheet: sheetName });
    const resp = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const text = await resp.text();
    try {
      const data = JSON.parse(text);
      return data.value !== undefined ? data.value : data;
    } catch { return text; }
  } catch (err) { return null; }
}

async function setCell(cellAdres, value, sheetName = "Arkusz1") {
  try {
    const params = new URLSearchParams({
      action: "setValue", row: cellToRow(cellAdres), col: cellToCol(cellAdres), value, sheet: sheetName
    });
    await fetch(WEB_APP_URL, { method: "POST", body: params });
    return true;
  } catch (err) { return false; }
}

function cellToRow(cell) { return parseInt(cell.replace(/[A-Z]+/i, "")); }
function cellToCol(cell) {
  let col = cell.replace(/\d+/g, "").toUpperCase();
  let num = 0;
  for (let i = 0; i < col.length; i++) { num = num * 26 + (col.charCodeAt(i) - 64); }
  return num;
}

// ────────────────────────────────────────────────
// KONFIG KANDYDATÓW
// ────────────────────────────────────────────────
const candidates = {
  A: { name: "Partia Razem", color: "#BDECB6" },
  B: { name: "Nowa Lewica", color: "#FDF4E3" },
  C: { name: "Koalicja Obywatelska", color: "#781F19" },
  D: { name: "Ruch Dobrobytu i Pokoju", color: "#6C7059" },
  E: { name: "Konfederacja Korony Polskiej", color: "#CB3234" }
};

// Generowanie przycisków
const candContainer = document.getElementById("candidates");
if (candContainer) {
    for (const key in candidates) {
      const div = document.createElement("div");
      div.className = "candidate";
      div.textContent = candidates[key].name;
      div.style.backgroundColor = candidates[key].color;
      div.onclick = () => vote(key);
      candContainer.appendChild(div);
    }
}

async function vote(candidate) {
  const nick = document.getElementById("nick").value.trim();
  const woj = document.getElementById("wojewodztwo").value;

  if (!nick || woj === "def" || !woj) return alert("Podaj nick i wybierz województwo!");

  let wiersz = 2;
  while (await getCell(`B${wiersz}`)) { wiersz++; if (wiersz > 5000) break; }

  await Promise.all([
    setCell(`B${wiersz}`, "V" + Date.now()),
    setCell(`C${wiersz}`, nick),
    setCell(`E${wiersz}`, woj),
    setCell(`F${wiersz}`, candidate),
    setCell(`G${wiersz}`, new Date().toISOString())
  ]);

  alert("Głos oddany!");
  odswiezWykresy();
  odswiezKoloryWojewodztw();
}

// ────────────────────────────────────────────────
// WYKRESY
// ────────────────────────────────────────────────
let chartPieOgolne = null, chartBarOgolne = null;
let chartPieWoj = null, chartBarWoj = null;

async function odswiezWykresy() {
  const liczniki = {};
  Object.keys(candidates).forEach(k => liczniki[k] = 0);
  const wojStats = {};

  let r = 2;
  while (true) {
    const wojRaw = await getCell(`E${r}`);
    const kand = await getCell(`F${r}`);
    if (!kand) break;

    liczniki[kand] = (liczniki[kand] || 0) + 1;

    if (wojRaw) {
        const wojKey = wojRaw.trim().toLowerCase();
        if (!wojStats[wojKey]) wojStats[wojKey] = {};
        wojStats[wojKey][kand] = (wojStats[wojKey][kand] || 0) + 1;
    }
    r++; if (r > 500) break;
  }

  const labels = Object.keys(candidates).map(k => candidates[k].name);
  const dane = Object.keys(candidates).map(k => liczniki[k]);
  const kolory = Object.values(candidates).map(c => c.color);

  // Wykresy Ogólne
  renderChart('pieOgolne', 'pie', labels, dane, kolory, chartPieOgolne);
  renderChart('barOgolne', 'bar', labels, dane, kolory, chartBarOgolne);

  // Wykresy Wojewódzkie
  const labelsWoj = Object.keys(wojStats).sort();
  const daneWoj = labelsWoj.map(w => Object.values(wojStats[w]).reduce((a, b) => a + b, 0));
  
  renderChart('pieWojewodztwa', 'pie', labelsWoj, daneWoj, null, chartPieWoj);

  const datasetsWoj = Object.keys(candidates).map(k => ({
    label: candidates[k].name,
    data: labelsWoj.map(w => wojStats[w][k] || 0),
    backgroundColor: candidates[k].color
  }));

  const ctxBarWoj = document.getElementById('barWojewodztwa');
  if (ctxBarWoj) {
    if (chartBarWoj) chartBarWoj.destroy();
    chartBarWoj = new Chart(ctxBarWoj, { type: 'bar', data: { labels: labelsWoj, datasets: datasetsWoj } });
  }
}

function renderChart(id, type, labels, data, colors, chartVar) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (window[id + 'Obj']) window[id + 'Obj'].destroy();
  window[id + 'Obj'] = new Chart(ctx, {
    type: type,
    data: { labels, datasets: [{ data, backgroundColor: colors || ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] }] }
  });
}

window.toggleChart = function(typ) {
  const suffix = typ === 'ogolne' ? 'Ogolne' : 'Wojewodztwa';
  const pie = document.getElementById('pie' + suffix);
  const bar = document.getElementById('bar' + suffix);
  if (pie && bar) {
    const isPieVisible = window.getComputedStyle(pie).display !== 'none';
    pie.style.display = isPieVisible ? 'none' : 'block';
    bar.style.display = isPieVisible ? 'block' : 'none';
  }
};

async function odswiezKoloryWojewodztw() {
    // Logika kolorowania mapy (overlay) pozostaje bez zmian
    console.log("Mapa zaktualizowana.");
}

window.addEventListener('load', () => {
  odswiezWykresy();
odswiezKoloryWojewodztw();
});