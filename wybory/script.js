// ────────────────────────────────────────────────
// KONFIGURACJA
// ────────────────────────────────────────────────
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx5mXGxLbakXhP6GfyqIlSvkwq-Gg70Ib1Innuzk78pdrYmYGJjwd4AQsxsRRYQu0Oazg/exec";
const COOKIE_NAME = "disc_verif_key";
const VERIFICATION_PAGE = "https://pis-cord.github.io/weryfikacja/"; // ← zmień jeśli inna ścieżka
const MIN_KEY_LEN = 20;

// ────────────────────────────────────────────────
// WERYFIKACJA – sprawdza cookie + klucz w arkuszu
// ────────────────────────────────────────────────
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
// Odczytujemy dane z URL po powrocie z weryfikacji
const urlParams = new URLSearchParams(location.search);
const isVerifiedFromUrl = urlParams.get("verified") === "1";
const discordIdFromUrl = urlParams.get("discordId");

if (isVerifiedFromUrl && discordIdFromUrl) {
  // Czyścimy URL z parametrów (żeby nie było widać ID)
  history.replaceState({}, document.title, window.location.pathname);

  // Zapamiętujemy Discord ID w sessionStorage
  sessionStorage.setItem("verifiedDiscordId", discordIdFromUrl);

  // Pokazujemy nick z Discorda
  document.getElementById("nick").value = "Zweryfikowany użytkownik (Discord)";
  document.getElementById("nick").readOnly = true;
}
(async function checkVerificationAndLoadUser() {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");

  // Jeśli wracamy z Discorda → nie blokujemy, czekamy na zapis
  if (code) return;

  const key = getCookie(COOKIE_NAME);

  if (!key || key.length < MIN_KEY_LEN) {
    window.location.replace(VERIFICATION_PAGE + "?return=" + encodeURIComponent(window.location.href));
    return;
  }

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "checkVerificationKey",
        key: key
      })
    });

    const data = await res.json();

    if (!data.valid) {
      document.cookie = COOKIE_NAME + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      window.location.replace(VERIFICATION_PAGE + "?return=" + encodeURIComponent(window.location.href));
      return;
    }

    // Zweryfikowany → pobieramy dane użytkownika z klucza (opcjonalnie – można dodać akcję w Apps Script)
    // Na razie tylko pokazujemy komunikat
    document.getElementById("nick").value = "Zweryfikowany użytkownik";
    document.getElementById("nick").placeholder = "Zweryfikowany przez Discord";

  } catch (err) {
    console.error("Błąd weryfikacji:", err);
    window.location.replace(VERIFICATION_PAGE + "?return=" + encodeURIComponent(window.location.href));
  }
})();

// ────────────────────────────────────────────────
// GŁOSOWANIE – z weryfikacją Discord ID + jeden głos na osobę
// ────────────────────────────────────────────────
const candidates = {
  A: { name: "Mateusz Morawiecki", color: "#155ed4" },
  B: { name: "Tobiasz Bocheński", color: "#d1a70f" },
  C: { name: "Zbigniew Bogucki", color: "#b31b20" },
  D: { name: "Przemysław Czarnek", color: "#1f1f1f" },
  E: { name: "Jarosław Margielski", color: "#7a8dbf" },
  F: { name: "Anna Krupka", color: "#579e71" },
  G: { name: "Lucjusz Nadbereżny", color: "#cad620" }
};

const candContainer = document.getElementById("candidates");
Object.keys(candidates).forEach(key => {
  const div = document.createElement("div");
  div.className = "candidate";
  div.textContent = candidates[key].name;
  div.style.backgroundColor = candidates[key].color;
  div.onclick = () => vote(key);
  candContainer.appendChild(div);
});

async function vote(candidate) {
  const woj = document.getElementById("wojewodztwo").value;

  if (!woj) {
    alert("Wybierz województwo!");
    return;
  }

  const key = getCookie(COOKIE_NAME);
  if (!key) {
    alert("Musisz się zweryfikować Discordem!");
    window.location.replace(VERIFICATION_PAGE + "?return=" + encodeURIComponent(window.location.href));
    return;
  }

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "submitVote",
        verificationKey: key,          // <-- wysyłamy klucz
        wojewodztwo: woj,
        candidate: candidate
      })
    });

    const result = await res.json();

    if (result.success) {
      alert("Głos oddany pomyślnie!");
      odswiezWykresy();
      odswiezKoloryWojewodztw();
    } else {
      alert(result.message || "Błąd podczas głosowania!");
    }
  } catch (err) {
    alert("Błąd połączenia z serwerem.");
    console.error(err);
  }
}
function sprawdzGodzine() {
    const teraz = new Date();

    // rok, miesiąc (0-11!), dzień, godzina, minuta
    const start = new Date(2026, 2, 5, 21, 10); 

    if (teraz >= start) {

        const sections = ["wykresy", "mapWojProste"];
        const containers = document.querySelectorAll(".woj-img-container");

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove("ukryte");
                el.classList.add("pokaz");
            }
        });

        containers.forEach(c => {
            c.classList.remove("ukryte");
            c.classList.add("pokaz");
        });

        odswiezWykresy();
        odswiezKoloryWojewodztw();
    }
}
// ────────────────────────────────────────────────
// SYSTEM ADMINA PRZEZ KONSOLĘ (Hasło z A2)
// ────────────────────────────────────────────────
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
async function getCell(cellAdres, sheetName = "glosy") {  // ← zmiana z "Arkusz1" na "glosy"
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
    const wojRaw = await getCell(`C${r}`);
    const kand = await getCell(`D${r}`);
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
  console.log("START: odswiezKoloryWojewodztw – mocne zalewanie");
  const wojStats = {};
  const CHUNK = 50;
  let r = 2;
  let maDane = true;
  while (maDane) {
    const promises = [];
    for (let i = 0; i < CHUNK; i++) {
      promises.push(Promise.all([
        getCell(`C${r + i}`),   // kolumna C – województwo
        getCell(`D${r + i}`)    // kolumna D – kandydat
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

  const wszystkieKontenery = document.querySelectorAll('.woj-img-container');
  wszystkieKontenery.forEach(container => {
    const img = container.querySelector('.woj-img');
    const overlay = container.querySelector('.woj-overlay');
    const tooltip = container.querySelector('.tooltip');
    const src = img.getAttribute("src");

    // Poprawiona składnia maski
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
      }
    }

    // Zalewanie – opacity zależna od procentu
    overlay.style.backgroundColor = kolor;
    container.style.setProperty('--woj-kolor', kolor);
    overlay.style.opacity = 0.4 + (procent / 100) * 0.5; // 40% → 90% opacity

    // Poprawny tooltip – użyj backticków
    tooltip.textContent = `${wojName} ${candidates[dominujacy]?.name || 'brak'} (${procent.toFixed(1)}%) Głosy: ${stats.total}`.trim();
  });

  console.log("Kolory zaktualizowane");
}
// Dodaj wywołanie przy starcie i po głosie
window.addEventListener('load', () => {
  odswiezWykresy();
  odswiezKoloryWojewodztw();
  setInterval(sprawdzGodzine, 60000); // sprawdza co minutę
});
window.addEventListener("load", sprawdzGodzine);
