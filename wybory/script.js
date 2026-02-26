// code.js – zoptymalizowana wersja BEZ ZMIAN W APPS SCRIPT

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxcLeg8gbl2XSYfcC1L1-Py_KjVYvWVJrXzs88mgQi4JX-079bQR7OvyhRSktQPNnTF/exec";

// ────────────────────────────────────────────────
// getCell i setCell – bez zmian
// ────────────────────────────────────────────────
const password = getCell("A2", "Arkusz1");
let inputBuffer = "";

document.addEventListener("keydown", (e) => {
    inputBuffer += e.key;

    // Ograniczamy długość bufora do długości hasła
    if (inputBuffer.length > password.length) {
        inputBuffer = inputBuffer.slice(-password.length);
    }

    if (inputBuffer === password) {
        document.getElementById("mapWojProste").classList.remove("hidden");
        document.getElementById("wykresy").classList.remove("hidden");
        inputBuffer = "";
    }
});
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
  const woj = document.getElementById("wojewodztwo").value;

  if (!nick) {
    alert("Podaj nick");
    return;
  }

  if (woj == "def") {
    alert("Wybierz województwo!");
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
  await odswiezKoloryWojewodztw();
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
    maDane = false;  // domyślnie wyłączamy – włączymy tylko jeśli coś sensownego znajdziemy

    for (const [wojRaw, kand] of wyniki) {
      const woj = (wojRaw || "").trim();

      console.log(`Wiersz ${r}: surowe woj = "${wojRaw}", po trim = "${woj}", kand = "${kand}"`);

      if (!kand) continue;

      // Teraz włączamy kontynuację pętli – mamy ważny wiersz
      maDane = true;

      liczniki[kand] = (liczniki[kand] || 0) + 1;

      if (woj === "") {
        wierszeZBrak++;
        continue; // nie liczymy do województw jeśli brak województwa
      }

      const wojKey = woj.toLowerCase();
      if (!wojStats[wojKey]) wojStats[wojKey] = {};
      wojStats[wojKey][kand] = (wojStats[wojKey][kand] || 0) + 1;
    }

    r += CHUNK;
    if (r > 5000) break;
  }

  console.log(`Przetworzono wierszy: ${(r-2)/50 * 50}`);
  console.log(`Ilość wierszy z "Brak" województwa: ${wierszeZBrak}`);
  console.log("Policzone głosy:", liczniki);
  console.log("Województwa znalezione:", Object.keys(wojStats));
  console.log("Szczegóły woj:", wojStats);

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
  // Wojewódzki – kołowy
  // ──────────────────────────────
  const labelsWoj = Object.keys(wojStats).sort();
  const totalWoj = {};
  labelsWoj.forEach(w => {
    totalWoj[w] = Object.values(wojStats[w] || {}).reduce((a, b) => a + b, 0);
  });

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
    const pie = document.getElementById('pieOgolne');
    const bar = document.getElementById('barOgolne');
    if (pie && bar) {
      pie.style.display = pie.style.display === 'none' ? 'block' : 'none';
      bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
    }
  } else if (typ === 'wojewodzkie') {
    const pie = document.getElementById('pieWojewodztwa');
    const bar = document.getElementById('barWojewodztwa');
    if (pie && bar) {
      pie.style.display = pie.style.display === 'none' ? 'block' : 'none';
      bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
    }
  }
}
// ────────────────────────────────────────────────
// Mapa województw z gradientem dominującego koloru
// ────────────────────────────────────────────────
// ────────────────────────────────────────────────
// Zmiana kolorów województw na obrazkach
// ────────────────────────────────────────────────
async function odswiezKoloryWojewodztw() {
  console.log("START: odswiezKoloryWojewodztw – mocne zalewanie");

  const wojStats = {};
  const CHUNK = 50;
  let r = 2;
  let maDane = true;

  while (maDane) {
    const promises = [];
    for (let i = 0; i < CHUNK; i++) {
      promises.push(Promise.all([
        getCell(`E${r + i}`, "Arkusz1"),
        getCell(`F${r + i}`, "Arkusz1")
      ]));
    }
    const wyniki = await Promise.all(promises);
    maDane = false;

    for (const [wojRaw, kand] of wyniki) {
      const woj = (wojRaw || "").trim();
      if (!kand || !woj) continue;
      maDane = true;

      const wojKey = woj.toLowerCase();
      if (!wojStats[wojKey]) wojStats[wojKey] = { total: 0, votes: {} };
      wojStats[wojKey].total++;
      wojStats[wojKey].votes[kand] = (wojStats[wojKey].votes[kand] || 0) + 1;
    }
    r += CHUNK;
    if (r > 5000) break;
  }

  console.log("=== WOJEWÓDZTWA Z GŁOSAMI ===");
  console.log(Object.keys(wojStats));
  console.log("małopolskie:", wojStats["małopolskie"]);
  console.log("mazowieckie:", wojStats["mazowieckie"]);
  console.log("dolnośląskie:", wojStats["dolnośląskie"]);

  const wszystkieKontenery = document.querySelectorAll('.woj-img-container');

  wszystkieKontenery.forEach(container => {
    const img = container.querySelector('.woj-img');
    const overlay = container.querySelector('.woj-overlay');
    const tooltip = container.querySelector('.tooltip');

    const src = img.getAttribute("src");

    overlay.style.webkitMaskImage = `url(${src})`;
    overlay.style.maskImage = `url(${src})`;
    overlay.style.width = img.offsetWidth + "px";
    overlay.style.height = img.offsetHeight + "px";
    overlay.style.top = img.offsetTop + "px";
    overlay.style.left = img.offsetLeft + "px";
    if (!img || !overlay) return;

    const wojName = img.getAttribute('data-woj');
    if (!wojName) return;

    const wojKey = wojName.toLowerCase();
    const stats = wojStats[wojKey] || { total: 0, votes: {} };

    let kolor = '#cccccc';
    let dominujacy = null;
    let procent = 0;

    if (stats.total > 0) {
      let maxVotes = 0;

      Object.keys(stats.votes).forEach(kod => {
        if (stats.votes[kod] > maxVotes) {
          maxVotes = stats.votes[kod];
          dominujacy = kod;
        }
      });

      procent = (maxVotes / stats.total) * 100;

      if (dominujacy && candidates[dominujacy]) {
        kolor = candidates[dominujacy].color;
        console.log(`Zalewam ${wojName} kolorem ${candidates[dominujacy].name} (${procent.toFixed(1)}%)`);
      }
    }

    // Zalewanie – opacity zależna od procentu
    overlay.style.backgroundColor = kolor;
    container.style.setProperty('--woj-kolor', kolor);
    overlay.style.opacity = 0.4 + (procent / 100) * 0.5; // 40% → 90% opacity
    tooltip.textContent = `${wojName} ${candidates[dominujacy]?.name || 'brak'} (${procent.toFixed(1)}%) Głosy: ${stats.total}`.trim();
  });

  console.log("Kolory zaktualizowane");
}
// Dodaj wywołanie przy starcie i po głosie
window.addEventListener('load', () => {
  odswiezWykresy();
  odswiezKoloryWojewodztw();
});


window.addEventListener('load', odswiezWykresy);
