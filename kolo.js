const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin-button");
const resultText = document.getElementById("result");
const loginOverlay = document.getElementById("login-overlay");

// Konfiguracja
const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24h

const prizes = [
    { label: "UNBAN", color: "#003366" },
    { label: "PRZEDŁUŻENIE BANA O 24H", color: "#E20613" },
    { label: "WŁASNA ROLA", color: "#00488D" },
    { label: "NIC", color: "#222" },
    { label: "UŚCISK PREZESA", color: "#FFD700" },
    { label: "PRZEDŁUŻENIE BANA O 7 DNI", color: "#E20613" },
];

const numPrizes = prizes.length;
const arcSize = (2 * Math.PI) / numPrizes;
let currentRotation = 0;

// ==========================
// SYSTEM LOGOWANIA (NICK)
// ==========================

function checkLogin() {
    const savedNick = localStorage.getItem("discordNick");
    if (savedNick) {
        loginOverlay.style.display = "none";
        return savedNick;
    }
    return null;
}

function saveNick() {
    const nickInput = document.getElementById("discord-nick");
    const nick = nickInput.value.trim();
    
    if (nick.length < 3) {
        alert("Podaj poprawny nick (min. 3 znaki)!");
        return;
    }
    
    localStorage.setItem("discordNick", nick);
    loginOverlay.style.display = "none";
    checkCooldown();
}

// ==========================
// LOGIKA KOŁA
// ==========================

function checkCooldown() {
    const nick = localStorage.getItem("discordNick");
    if (!nick) return;

    const lastSpin = localStorage.getItem(`lastSpin_${nick}`);
    if (lastSpin) {
        const timeLeft = parseInt(lastSpin) + COOLDOWN_TIME - Date.now();
        if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            spinBtn.disabled = true;
            resultText.innerText = `Obywatelu ${nick}, wróć za: ${hours}h ${minutes}m`;
            resultText.style.color = "#888";
            return true;
        }
    }
    return false;
}

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    prizes.forEach((prize, i) => {
        const angle = i * arcSize;
        ctx.beginPath();
        ctx.fillStyle = prize.color;
        ctx.moveTo(250, 250);
        ctx.arc(250, 250, 240, angle, angle + arcSize);
        ctx.lineTo(250, 250);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.stroke();

        ctx.save();
        ctx.translate(250, 250);
        ctx.rotate(angle + arcSize / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Inter";
        ctx.fillText(prize.label, 230, 8);
        ctx.restore();
    });
}

function spin() {
    const nick = localStorage.getItem("discordNick");
    if (spinBtn.disabled || checkCooldown()) return;

    spinBtn.disabled = true;
    resultText.innerText = "Maszyna losująca ruszyła...";
    
    const extraDegrees = Math.floor(Math.random() * 360);
    const totalSpins = 1800 + extraDegrees; 
    currentRotation += totalSpins;
    
    canvas.style.transform = `rotate(${currentRotation}deg)`;

// ... fragment funkcji spin() ...
    setTimeout(() => {
        const finalAngle = currentRotation % 360;
        const degreesPerSegment = 360 / numPrizes;
        const prizeIndex = Math.floor(((270 - finalAngle) % 360 + 360) % 360 / degreesPerSegment);
        
        const win = prizes[prizeIndex];
        resultText.innerText = `${nick}, wylosowałeś: ${win.label}`;
        
        // Zapisanie blokady
        localStorage.setItem(`lastSpin_${nick}`, Date.now().toString());

        // --- KLUCZOWY DODATEK: WYSYŁKA DO DISCORDA ---
        sendToDiscord(nick, win.label); 
        // ---------------------------------------------

        // Stylizacja wyniku
        if(win.label.includes("BAN")) resultText.style.color = "var(--pis-red)";
        else if(win.label === "UŚCISK PREZESA") resultText.style.color = "#FFD700";
        else resultText.style.color = "white";
        
        setTimeout(checkCooldown, 3000);
    }, 5000);
// ... reszta kodu ...);
}

function sendToDiscord(nick, wynik) {
    const webhookURL = "https://discord.com/api/webhooks/1475210484331581591/D25Sxyo74bKAMn7jz_Gj_U5GjrAIVVM0HYx-OJHyL4RjYL0kq8hKwL0v5hetl4276jQi"; // TU MUSI BYĆ TWÓJ LINK Z DISCORDA
    
    const data = {
        username: "Maszyna Losująca PiScord",
        avatar_url: "https://pbs.twimg.com/media/Gn4ff1IXAAA8GUg.png",
        embeds: [{
            title: "🎰 Nowe losowanie w Kasynie!",
            color: wynik.includes("BAN") ? 14811155 : 3066993, 
            fields: [
                { name: "Obywatel", value: `**${nick}**`, inline: true },
                { name: "Wynik", value: `**${wynik}**`, inline: true }
            ],
            footer: { text: "System KasynoPiS v1.0" },
            timestamp: new Date()
        }]
    };

    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(err => console.error("Błąd Webhooka:", err));
}

// Start
spinBtn.addEventListener("click", spin);
drawWheel();
checkLogin();
checkCooldown();
