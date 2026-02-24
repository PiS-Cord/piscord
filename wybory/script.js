// code.js – zoptymalizowana wersja BEZ ZMIAN W APPS SCRIPT

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzTDX9VJVzLrsqmBDm9h2qsp1qc24TqYqp7T0C45BmSXp0HUJJYisBpS6REyCyofxiDoA/exec";

// ────────────────────────────────────────────────
// getCell i setCell – bez zmian
// ────────────────────────────────────────────────
async function getCell(cellAdres, sheetName = "Arkusz1") {
  try {
    const row = cellToRow(cellAdres);
    const col = cellToCol(cellAdres);
    const params = new URLSearchParams({
      action: "getValue",
      row, col, sheet: sheetName
    });
    const resp = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    try {
      const data = JSON.parse(text);
      return data.value !== undefined ? data.value : data;
    } catch {
      return text;
    }
  } catch (err) {
    console.error("getCell error:", err);
    return null;
  }
}

async function setCell(cellAdres, value, sheetName = "Arkusz1") {
  try {
    const params = new URLSearchParams({
      action: "setValue",
      row: cellToRow(cellAdres),
      col: cellToCol(cellAdres),
      value,
      sheet: sheetName
    });
    const resp = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    if (!resp.ok) throw new Error(resp.status);
    return true;
  } catch (err) {
    console.error("setCell błąd:", err);
    return false;
  }
}

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

// ────────────────────────────────────────────────
// KONFIG KANDYDATÓW
// ────────────────────────────────────────────────
const candidates = {
  A: { name: "Partia Razem", color: "#960018" },
  B: { name: "Nowa Lewica", color: "#ff1900" },
  C: { name: "Koalicja Obywatelska", color: "#e67022" },
  D: { name: "Ruch Dobrobytu i Pokoju", color: "#c93322" },
  E: { name: "Konfederacja Korony Polskiej", color: "#75310f" }
};

// ────────────────────────────────────────────────
// GENEROWANIE PRZYCISKÓW
// ────────────────────────────────────────────────
const container = document.getElementById("candidates");
for (const key in candidates) {
  const div = document.createElement("div");
  div.className = "candidate";
  div.textContent = candidates[key].name;
  div.style.backgroundColor = candidates[key].color;
  div.onclick = () => vote(key);
  container.appendChild(div);
}

// ────────────────────────────────────────────────
// ODDANIE GŁOSU – zoptymalizowane sprawdzanie duplikatów
// ────────────────────────────────────────────────
async function vote(candidate) {
  const nick = document.getElementById("nick").value.trim();
  const discordId = document.getElementById("discordId").value.trim();
  const woj = document.getElementById("wojewodztwo").value;

  if (!nick || !discordId) {
    alert("Podaj nick i Discord ID");
    return;
  }
  if (!/^\d{17,}$/.test(discordId)) {
    alert("Discord ID musi mieć co najmniej 17 cyfr i składać się tylko z cyfr!");
    return;
  }

  if (woj = "def") {
    alert("Wybierz województwo!");
    return;
  }

  // Szybkie sprawdzanie duplikatów – batch po 50 wierszy
  let znaleziono = false;
  const CHUNK = 50;
  let r = 2;
  while (!znaleziono) {
    const promises = [];
    for (let i = 0; i < CHUNK; i++) {
      promises.push(getCell(`D${r + i}`, "Arkusz1"));
    }
    const wyniki = await Promise.all(promises);
    if (wyniki.every(v => v === null || v === "")) break;
    if (wyniki.includes(discordId)) {
      znaleziono = true;
      break;
    }
    r += CHUNK;
    if (r > 10000) break;
  }

  if (znaleziono) {
    alert("Ten Discord ID już oddał głos!");
    return;
  }

  // Znajdujemy wolny wiersz
  let wiersz = 2;
  while (await getCell(`B${wiersz}`, "Arkusz1")) {
    wiersz++;
    if (wiersz > 10000) {
      alert("Błąd: za dużo wierszy w arkuszu!");
      return;
    }
  }

  // Zapis głosu
  await Promise.all([
    setCell(`B${wiersz}`, "V" + Date.now(), "Arkusz1"),
    setCell(`C${wiersz}`, nick, "Arkusz1"),
    setCell(`D${wiersz}`, discordId, "Arkusz1"),
    setCell(`E${wiersz}`, woj, "Arkusz1"),
    setCell(`F${wiersz}`, candidate, "Arkusz1"),
    setCell(`G${wiersz}`, new Date().toISOString(), "Arkusz1")
  ]);

  alert("Głos oddany pomyślnie");

  // Szybka aktualizacja statystyk (jedna komórka z formułą zaczynającą się od =)
  await aktualizujStatystykiKandydatow();
  await aktualizujStatystykiWojewodztw("Arkusz1");

  // Odśwież wykresy
  await odswiezWykresy();
}

// Statystyki kandydatów – H1 z prawdziwymi nowymi liniami (CHAR(10))
async function aktualizujStatystykiKandydatow(arkusz = "Arkusz1") {
  const kandydaci = Object.keys(candidates);
  if (kandydaci.length === 0) return;

  let formula = '="Wyniki ogólnopolskie:" & CHAR(10)';
  kandydaci.forEach(k => {
    formula += `& "${candidates[k].name}: " & COUNTIF(F2:F;"${k}") & " (" & IF(COUNTA(F2:F)>0; ROUND(COUNTIF(F2:F;"${k}")/COUNTA(F2:F)*100;1) & "%"; "0%") & ")" & CHAR(10)`;
  });
  formula += '& "Łącznie głosów: " & COUNTA(F2:F)';

  await setCell("H1", formula, arkusz);
  console.log("Zaktualizowano wyniki ogólnopolskie w H1");
}

// Statystyki województw – I1 z CHAR(10)
async function aktualizujStatystykiWojewodztw(arkusz = "Arkusz1") {
  const wojewodztwa = [
    "Dolnośląskie", "Kujawsko-Pomorskie", "Lubelskie", "Lubuskie",
    "Łódzkie", "Małopolskie", "Mazowieckie", "Opolskie",
    "Podkarpackie", "Podlaskie", "Pomorskie", "Śląskie",
    "Świętokrzyskie", "Warmińsko-Mazurskie", "Wielkopolskie", "Zachodniopomorskie"
  ];

  let formula = '="Wyniki według województw:" & CHAR(10)';
  wojewodztwa.forEach(woj => {
    formula += `& "${woj}: " & COUNTIF(E2:E;"${woj}") & " głosów" & CHAR(10)`;
  });

  await setCell("I1", formula, arkusz);
  console.log("Zaktualizowano wyniki wojewódzkie w I1");
}

// ────────────────────────────────────────────────
 // Wykresy – odczyt batchami (już zoptymalizowane)
// ────────────────────────────────────────────────
let chartPieOgolne = null;
let chartBarOgolne = null;
let chartPieWoj = null;
let chartBarWoj = null;

async function odswiezWykresy() {
  console.log("Odświeżanie wykresów – start");

  const liczniki = {};
  Object.keys(candidates).forEach(k => liczniki[k] = 0);
  const wojStats = {};

  const CHUNK = 50;
  let r = 2;
  let maDane = true;
  let wierszeZBrak = 0;

  while (maDane) {
    const promises = [];
    for (let i = 0; i < CHUNK; i++) {
      promises.push(Promise.all([
        getCell(`E${r + i}`, "Arkusz1"), // województwo
        getCell(`F${r + i}`, "Arkusz1")  // kandydat
      ]));
    }

    const wyniki = await Promise.all(promises);
    maDane = false;

    for (const [wojRaw, kand] of wyniki) {
      const woj = (wojRaw || "").trim(); // logujemy surową wartość
      console.log(`Wiersz ${r}: surowe województwo = "${wojRaw}", po trim = "${woj}", kandydat = "${kand}"`);

      if (!kand) continue;
      maDane = true;

      liczniki[kand] = (liczniki[kand] || 0) + 1;

      if (woj === "") {
        wierszeZBrak++;
        woj = "Brak";
      }

      if (!wojStats[woj]) wojStats[woj] = {};
      wojStats[woj][kand] = (wojStats[woj][kand] || 0) + 1;
    }

    r += CHUNK;
    if (r > 5000) break;
  }

  console.log(`Ilość wierszy z "Brak": ${wierszeZBrak}`);
  console.log("Policzone głosy:", liczniki);
  console.log("Województwa znalezione:", Object.keys(wojStats));
  console.log("Policzone głosy:", liczniki);

  const labels = Object.keys(candidates).map(k => candidates[k].name);
  const dane = Object.keys(candidates).map(k => liczniki[k] || 0);
  const kolory = Object.values(candidates).map(c => c.color);

  // ──────────────────────────────
  // Ogólnopolski – kołowy
  // ──────────────────────────────
  if (chartPieOgolne) chartPieOgolne.destroy();
  chartPieOgolne = new Chart(document.getElementById('pieOgolne'), {
    type: 'pie',
    data: { labels, datasets: [{ data: dane, backgroundColor: kolory }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  // Ogólnopolski – słupkowy
  if (chartBarOgolne) chartBarOgolne.destroy();
  chartBarOgolne = new Chart(document.getElementById('barOgolne'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Głosy', data: dane, backgroundColor: kolory }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  // ──────────────────────────────
  // Wojewódzki – kołowy (nowy)
  // ──────────────────────────────
  const labelsWoj = Object.keys(wojStats).sort();
  const totalWoj = {};
  labelsWoj.forEach(w => totalWoj[w] = Object.values(wojStats[w] || {}).reduce((a, b) => a + b, 0));

  if (chartPieWoj) chartPieWoj.destroy();
  chartPieWoj = new Chart(document.getElementById('pieWojewodztwa'), {
    type: 'pie',
    data: {
      labels: labelsWoj,
      datasets: [{
        data: labelsWoj.map(w => totalWoj[w] || 0),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF']
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  // Wojewódzki – słupkowy grupowany
  const datasetsWoj = Object.keys(candidates).map(k => ({
    label: candidates[k].name,
    data: labelsWoj.map(w => wojStats[w]?.[k] || 0),
    backgroundColor: candidates[k].color,
    borderWidth: 1
  }));

  if (chartBarWoj) chartBarWoj.destroy();
  chartBarWoj = new Chart(document.getElementById('barWojewodztwa'), {
    type: 'bar',
    data: { labels: labelsWoj, datasets: datasetsWoj },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { position: 'top' } }
    }
  });

  console.log("Wykresy zaktualizowane");
}

// Przełączanie wykresów
function toggleChart(typ) {
  if (typ === 'ogolne') {
    const pieContainer = document.getElementById('pieOgolne').parentElement;
    const barContainer = document.getElementById('barOgolneContainer');
    pieContainer.style.display = pieContainer.style.display === 'none' ? 'block' : 'none';
    barContainer.style.display = barContainer.style.display === 'none' ? 'block' : 'none';
  } else if (typ === 'wojewodzkie') {
    const pieContainer = document.getElementById('pieWojewodztwa').parentElement;
    const barContainer = document.getElementById('barWojewodztwaContainer');
    pieContainer.style.display = pieContainer.style.display === 'none' ? 'block' : 'none';
    barContainer.style.display = barContainer.style.display === 'none' ? 'block' : 'none';
  }
}

// Odśwież przy starcie
window.addEventListener('load', odswiezWykresy);
