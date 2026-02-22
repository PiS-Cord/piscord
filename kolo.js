const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin-button");
const resultText = document.getElementById("result");

const COOLDOWN_TIME = 24 * 60 * 60 * 1000; 

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

function checkCooldown() {
    const nick = localStorage.getItem("discordNick");
    if (!nick) return true;

    const lastSpin = localStorage.getItem(`lastSpin_${nick}`);
    if (lastSpin) {
        const timeLeft = parseInt(lastSpin) + COOLDOWN_TIME - Date.now();
        if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            spinBtn.disabled = true;
            resultText.innerText = `Wróć za: ${hours}h ${minutes}m`;
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
    if (!nick || spinBtn.disabled || checkCooldown()) return;

    spinBtn.disabled = true;
    resultText.innerText = "Losowanie...";
    
    const extraDegrees = Math.floor(Math.random() * 360);
    const totalSpins = 1800 + extraDegrees; 
    currentRotation += totalSpins;
    
    canvas.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        const finalAngle = currentRotation % 360;
        const degreesPerSegment = 360 / numPrizes;
        const prizeIndex = Math.floor(((270 - finalAngle) % 360 + 360) % 360 / degreesPerSegment);
        
        const win = prizes[prizeIndex];
        resultText.innerText = `Wynik: ${win.label}`;
        
        localStorage.setItem(`lastSpin_${nick}`, Date.now().toString());
        sendToDiscord(nick, win.label); 
        
        if(win.label.includes("BAN")) resultText.style.color = "#E20613";
        else resultText.style.color = "white";
        
        setTimeout(checkCooldown, 2000);
    }, 5000);
}

function sendToDiscord(nick, wynik) {
    const webhookURL = "https://discord.com/api/webhooks/1475210484331581591/D25Sxyo74bKAMn7jz_Gj_U5GjrAIVVM0HYx-OJHyL4RjYL0kq8hKwL0v5hetl4276jQi";
    
    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            embeds: [{
                title: "🎰 Nowe losowanie!",
                color: wynik.includes("BAN") ? 14811155 : 3066993, 
                fields: [
                    { name: "Obywatel", value: nick, inline: true },
                    { name: "Wynik", value: wynik, inline: true }
                ],
                timestamp: new Date()
            }]
        })
    });
}

spinBtn.addEventListener("click", spin);
drawWheel();
checkCooldown();
