// =======================
// SYSTEM TOŻSAMOŚCI
// =======================

function checkIdentity() {
    const savedNick = localStorage.getItem('discordNick');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');

    if (savedNick) {
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';
        
        const displayNickElem = document.getElementById('display-nick');
        if (displayNickElem) displayNickElem.innerText = savedNick;

        // Sprawdzamy cooldown unbana tylko jeśli jesteśmy na właściwej stronie
        checkAppealCooldown(); 
    }
}

function saveIdentity() {
    const nickInput = document.getElementById('user-nick');
    if (!nickInput) return;
    
    const nick = nickInput.value.trim();
    if (nick.length < 3) {
        showStatus("Nick musi mieć min. 3 znaki!", "#e20613");
        return;
    }

    localStorage.setItem('discordNick', nick);
    location.reload(); // Przeładowanie aktywuje widoki na wszystkich podstronach
}

function showStatus(text, color) {
    const statusMsg = document.getElementById('status-msg');
    if (statusMsg) {
        statusMsg.innerText = text;
        statusMsg.style.color = color;
        statusMsg.style.display = 'block';
    }
}

// =======================
// SYSTEM UNBAN (ODWOŁANIA)
// =======================

function checkAppealCooldown() {
    const appealTextarea = document.getElementById('appeal-reason');
    if (!appealTextarea) return false; // Blokada unbana NIE zadziała w kasynie

    const nick = localStorage.getItem('discordNick');
    const lastAppeal = localStorage.getItem(`lastAppeal_${nick}`);
    const COOLDOWN_TIME = 24 * 60 * 60 * 1000; 

    if (lastAppeal) {
        const timeLeft = parseInt(lastAppeal) + COOLDOWN_TIME - Date.now();
        if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            const step2 = document.getElementById('step-2');
            if (step2) {
                step2.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <h2 style="color: #e20613; font-family: 'Archivo Black';">LIMIT WYCZERPANY</h2>
                        <p style="color: #888;">Obywatelu <b>${nick}</b>, jeden wniosek na dobę.</p>
                        <div style="margin-top: 20px; padding: 15px; background: #111; border: 1px solid #333; border-radius: 10px;">
                            <span style="color: white; font-size: 1.2rem; font-weight: bold;">${hours}h ${minutes}m</span>
                        </div>
                    </div>`;
            }
            return true;
        }
    }
    return false;
}

function sendAppeal() {
    const nick = localStorage.getItem('discordNick');
    const reasonInput = document.getElementById('appeal-reason');
    if (!reasonInput || checkAppealCooldown()) return;

    const reason = reasonInput.value.trim();
    const webhook = "https://discord.com/api/webhooks/1475210484331581591/D25Sxyo74bKAMn7jz_Gj_U5GjrAIVVM0HYx-OJHyL4RjYL0kq8hKwL0v5hetl4276jQi";

    if(!reason) {
        showStatus("Napisz uzasadnienie!", "#e20613");
        return;
    }

    const btn = document.getElementById('send-btn');
    btn.innerText = "WYSYŁANIE...";
    btn.disabled = true;

    fetch(webhook, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            embeds: [{
                title: "⚖️ NOWY WNIOSEK O UNBAN",
                color: 16711680,
                fields: [
                    { name: "Obywatel", value: `**${nick}**`, inline: true },
                    { name: "Uzasadnienie", value: reason }
                ],
                timestamp: new Date()
            }]
        })
    }).then(() => {
        localStorage.setItem(`lastAppeal_${nick}`, Date.now().toString());
        document.getElementById('step-2').innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h2 style="color: #00ff00; font-family: 'Archivo Black';">WNIOSEK WYSŁANY!</h2>
                <p style="color: #888;">Powodzenia, obywatelu.</p>
            </div>`;
    }).catch(() => {
        showStatus("Błąd połączenia!", "#e20613");
        btn.disabled = false;
        btn.innerText = "WYŚLIJ WNIOSEK";
    });
}

// Start systemu
window.addEventListener('DOMContentLoaded', checkIdentity);

// =======================
// EASTER EGGI
// =======================
let clickCount = 0;
function playEasterEgg() {
    clickCount++;
    if (clickCount === 5) { openEasterEgg("film.mp4"); clickCount = 0; }
    setTimeout(() => { clickCount = 0; }, 2000);
}

function openEasterEgg(videoFile) {
    const overlay = document.getElementById("video-overlay");
    const video = document.getElementById("easter-video-player");
    if(overlay && video) { video.src = videoFile; overlay.style.display = "flex"; video.play(); }
}

function closeEasterEgg() {
    const overlay = document.getElementById("video-overlay");
    const video = document.getElementById("easter-video-player");
    if(overlay && video) { video.pause(); video.src = ""; overlay.style.display = "none"; }

}
const secretSequence = "batyr";
let typed = "";

document.addEventListener("keydown", function(e) {
    typed += e.key.toLowerCase();

    if (typed.length > secretSequence.length) {
        typed = typed.slice(-secretSequence.length);
    }

    if (typed === secretSequence) {
        openEasterEgg("batyr.mp4");
        typed = "";
    }
});
