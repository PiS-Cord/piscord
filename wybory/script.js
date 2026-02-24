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
let wojMap = null;

async function odswiezMapeWojewodztw() {
  console.log("Odświeżanie mapy województw – start");

  // Zbieramy dane z arkusza (batchowo, jak w wykresach)
  const wojStats = {};
  const CHUNK = 50;
  let r = 2;
  let maDane = true;

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
      const woj = (wojRaw || "").trim();
      if (!kand) continue;
      maDane = true;

      if (!wojStats[woj]) wojStats[woj] = { total: 0, votes: {} };
      wojStats[woj].total++;
      wojStats[woj].votes[kand] = (wojStats[woj].votes[kand] || 0) + 1;
    }
    r += CHUNK;
    if (r > 5000) break;
  }

  console.log("Województwa z głosami:", Object.keys(wojStats));

  // ──────────────────────────────
  // Inicjalizacja mapy (tylko raz)
  // ──────────────────────────────
  if (!wojMap) {
    wojMap = L.map('mapWojewodztwa').setView([52.0, 19.5], 6); // centrum Polski
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(wojMap);
  }

  // ──────────────────────────────
  // GeoJSON województw Polski (darmowy, aktualny)
  // ──────────────────────────────
  const geojsonUrl = "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson"; // zamień na Polski, np.:
  // Lepiej użyj tego: https://raw.githubusercontent.com/codeforpoland/poland-geojson/master/wojewodztwa.geojson
  const geojsonPl = "https://raw.githubusercontent.com/codeforpoland/poland-geojson/master/wojewodztwa.geojson";

  fetch(geojsonPl)
    .then(res => res.json())
    .then(geojson => {
      L.geoJSON(geojson, {
        style: function(feature) {
          const wojName = feature.properties.nazwa || feature.properties.name_pl; // nazwa województwa z GeoJSON
          const stats = wojStats[wojName] || { total: 0, votes: {} };

          if (stats.total === 0) {
            return { fillColor: '#f0f0f0', weight: 1, opacity: 0.5, color: 'gray', fillOpacity: 0.3 };
          }

          // Znajdź dominującego kandydata i procent
          let maxVotes = 0;
          let dominujacyKand = null;
          Object.keys(stats.votes).forEach(k => {
            if (stats.votes[k] > maxVotes) {
              maxVotes = stats.votes[k];
              dominujacyKand = k;
            }
          });

          const procentDominujacy = (maxVotes / stats.total) * 100;
          const kolorBazowy = candidates[dominujacyKand]?.color || "#cccccc";
          const intensywnosc = procentDominujacy / 100; // 0–1

          // Gradient: im większy procent, tym ciemniejszy kolor
          const kolor = darkenColor(kolorBazowy, 1 - intensywnosc); // im mniejszy procent, tym jaśniejszy

          return {
            fillColor: kolor,
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.8
          };
        },
        onEachFeature: function(feature, layer) {
          const wojName = feature.properties.nazwa || feature.properties.name_pl;
          const stats = wojStats[wojName] || { total: 0, votes: {} };
          let popup = `<b>${wojName}</b><br>Głosy łącznie: ${stats.total}<br><br>`;
          Object.keys(stats.votes).forEach(k => {
            const procent = stats.total > 0 ? ((stats.votes[k] / stats.total) * 100).toFixed(1) : 0;
            popup += `${candidates[k]?.name || k}: ${stats.votes[k]} (${procent}%)<br>`;
          });
          layer.bindPopup(popup);
        }
      }).addTo(wojMap);
    })
    .catch(err => console.error("Błąd ładowania GeoJSON:", err));
}

// Pomocnicza funkcja – przyciemnianie koloru w zależności od intensywności
function darkenColor(hex, factor = 0.5) {
  let r = parseInt(hex.slice(1,3), 16);
  let g = parseInt(hex.slice(3,5), 16);
  let b = parseInt(hex.slice(5,7), 16);
  r = Math.floor(r * factor);
  g = Math.floor(g * factor);
  b = Math.floor(b * factor);
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

// Dodaj wywołanie mapy po załadowaniu strony i po głosie
window.addEventListener('load', () => {
  odswiezWykresy();
  odswiezMapeWojewodztw();
});

// W funkcji vote() na samym końcu dodaj:
await odswiezMapeWojewodztw();
// Odśwież przy starcie
window.addEventListener('load', odswiezWykresy);
