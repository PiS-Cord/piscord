let clickCount = 0;

// =======================
// KLIKANIE W LOGO
// =======================

function playEasterEgg() {
    clickCount++;
    
    if (clickCount === 5) {
        openEasterEgg("film.mp4");
        clickCount = 0; 
    }

    setTimeout(() => { clickCount = 0; }, 2000);
}


// =======================
// TAJNA SEKWENCJA
// =======================

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


// =======================
// WSPÓLNE FUNKCJE
// =======================

function openEasterEgg(videoFile) {
    const overlay = document.getElementById("video-overlay");
    const video = document.getElementById("easter-video-player");

    video.src = videoFile;
    overlay.style.display = "flex";
    video.play();
}

function closeEasterEgg() {
    const overlay = document.getElementById("video-overlay");
    const video = document.getElementById("easter-video-player");

    video.pause();
    video.currentTime = 0;
    video.src = "";
    overlay.style.display = "none";
}
