// =======================
// SYSTEM EASTER EGGÓW
// =======================

let clickCount = 0;
const secretSequence = "batyr";
let typed = "";

// Obsługa wielokrotnego kliknięcia (np. w logo lub obrazek)
function playEasterEgg() {
    clickCount++;
 if (clickCount === 5) { 
    openEasterEgg("../film.mp4"); // Dodano ../
    clickCount = 0; 
}
    // Resetuj licznik jeśli użytkownik klika zbyt wolno
    setTimeout(() => { clickCount = 0; }, 2000);
}

// Otwieranie odtwarzacza wideo
function openEasterEgg(videoFile) {
    const overlay = document.getElementById("video-overlay");
    const video = document.getElementById("easter-video-player");
    if(overlay && video) { 
        video.src = videoFile; 
        overlay.style.display = "flex"; 
        video.play(); 
    }
}

// Zamykanie odtwarzacza
function closeEasterEgg() {
    const overlay = document.getElementById("video-overlay");
    const video = document.getElementById("easter-video-player");
    if(overlay && video) { 
        video.pause(); 
        video.src = ""; 
        overlay.style.display = "none"; 
    }
}

// Obsługa klawiatury
document.addEventListener("keydown", function(e) {
    typed += e.key.toLowerCase();
    if (typed.length > secretSequence.length) {
        typed = typed.slice(-secretSequence.length);
    }

if (typed === secretSequence) {
    openEasterEgg("../batyr.mp4"); // Dodano ../
    typed = ""; 
}
});

