// ... (reszta kodu bez zmian: Easter Eggi, Identity itp.) ...

function checkAppealCooldown() {
    const nick = localStorage.getItem('discordNick');
    if (!nick) return false;

    const lastAppeal = localStorage.getItem(`lastAppeal_${nick}`);
    const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 godziny

    if (lastAppeal) {
        const timeLeft = parseInt(lastAppeal) + COOLDOWN_TIME - Date.now();
        if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            const step2 = document.getElementById('step-2');
            if (step2) {
                step2.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <h2 style="color: #e20613; font-family: 'Archivo Black'; margin-bottom: 10px;">LIMIT WYCZERPANY</h2>
                        <p style="color: #888;">Obywatelu ${nick}, możesz wysłać tylko jeden wniosek na dobę.</p>
                        <p style="color: white; font-weight: bold; margin-top: 10px;">Wróć za: ${hours}h ${minutes}m</p>
                    </div>
                `;
            }
            return true;
        }
    }
    return false;
}

function sendAppeal() {
    const nick = localStorage.getItem('discordNick');
    
    // Sprawdzamy cooldown przed wysłaniem
    if (checkAppealCooldown()) return;

    const reasonInput = document.getElementById('appeal-reason');
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
        // Zapisujemy czas wysłania wniosku dla tego nicku
        localStorage.setItem(`lastAppeal_${nick}`, Date.now().toString());
        
        document.getElementById('step-2').innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h2 style="color: #00ff00; font-family: 'Archivo Black'; margin-bottom: 10px;">WNIOSEK WYSŁANY!</h2>
                <p style="color: #888;">Twoja prośba została zarejestrowana. Następna możliwa za 24h.</p>
            </div>
        `;
    }).catch(() => {
        showStatus("Błąd połączenia!", "#e20613");
        btn.disabled = false;
        btn.innerText = "WYŚLIJ WNIOSEK";
    });
}

// Zmieniamy window.onload, aby sprawdzało też cooldown
window.addEventListener('DOMContentLoaded', () => {
    checkIdentity();
    checkAppealCooldown();
});
