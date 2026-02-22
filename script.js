let clickCount = 0;

function playEasterEgg() {
    clickCount++;
    
    if (clickCount === 5) {
        const overlay = document.getElementById('video-overlay');
        const video = document.getElementById('easter-video-player');
        
        // Ścieżka do Twojego pliku w folderze
        video.src = "film.mp4"; 
        
        overlay.style.display = 'flex';
        video.play(); // Automatyczny start
        clickCount = 0; 
    }

    setTimeout(() => { clickCount = 0; }, 2000);
}

function closeEasterEgg() {
    const overlay = document.getElementById('video-overlay');
    const video = document.getElementById('easter-video-player');
    
    video.pause();
    video.src = ""; 
    overlay.style.display = 'none';

}

// --- TAJNA SEKWENCJA ---

const secretSequence = "batyr"; // tu ustawiasz hasło
let typed = "";

document.addEventListener("keydown", function(e) {
    typed += e.key.toLowerCase();

    // przycinamy bufor
    if (typed.length > secretSequence.length) {
        typed = typed.slice(-secretSequence.length);
    }

    if (typed === secretSequence) {
        openEasterEgg();
    }
});

function openEasterEgg() {
    const overlay = document.getElementById("video-overlay");
    const video = document.getElementById("easter-video-player");

    video.src = "batyr.mp4"; // TU wpisz ścieżkę do filmu
    overlay.style.display = "flex";
    video.play();
}

function closeEasterEgg() {
    const overlay = document.getElementById("video-overlay");
    const video = document.getElementById("easter-video-player");

    video.pause();
    video.currentTime = 0;
    overlay.style.display = "none";
}
