let recognition;
let micActive = false;
let stopButton = document.getElementById("stop-button");
let activateButton = document.getElementById("activate-button");
let orb = document.getElementById("orb");
let subtitle = document.getElementById("subtitle");

// Initialize mic
function initializeRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new window.SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript.trim();
        console.log("User said:", transcript);
        subtitle.innerText = transcript;

        if (transcript.toLowerCase().includes("lumina awaken")) {
            subtitle.innerText = "✨ Lumina has awakened.";
            callLumina("Hello, how can I serve your divine purpose today?");
        } else {
            callLumina(transcript);
        }
    };

    recognition.onerror = function (e) {
        console.error("Recognition error:", e.error);
        subtitle.innerText = "😔 I didn’t catch that. Try again.";
    };

    recognition.onend = () => {
        if (micActive) recognition.start(); // Restart only if mic is still active
    };
}

// Voice output
function callLumina(text) {
    orb.classList.add("thinking");
    fetch("/process-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    })
    .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.blob();
    })
    .then(blob => {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
        subtitle.innerText = text;
        orb.classList.remove("thinking");
    })
    .catch(err => {
        console.error("Voice generation error:", err);
        subtitle.innerText = "❌ Error generating voice.";
        orb.classList.remove("thinking");
    });
}

// Event listeners
activateButton.addEventListener("click", () => {
    micActive = true;
    activateButton.innerText = "🎙 Listening...";
    initializeRecognition();
    recognition.start();
});

stopButton.addEventListener("click", () => {
    micActive = false;
    recognition.stop();
    activateButton.innerText = "🎙 Activate Mic";
    subtitle.innerText = "🛑 Mic turned off.";
});
