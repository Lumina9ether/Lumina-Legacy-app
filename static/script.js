let recognition;
let isListening = false;

// DOM Elements
const micButton = document.getElementById("start-recording");
const stopButton = document.getElementById("stop-recording");
const orb = document.getElementById("orb");
const responseElement = document.getElementById("response");

// Setup mic
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        orb.classList.add("listening");
        responseElement.innerHTML = "🎤 Listening...";
    };

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        responseElement.innerHTML = `✨ You said: ${transcript}`;

        try {
            const response = await fetch('/generate-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: transcript })
            });

            if (!response.ok) throw new Error('Response not ok');

            const data = await response.json();

            responseElement.innerHTML = `💬 ${data.response}`;
            playAudio(data.audio_url);
        } catch (error) {
            responseElement.innerHTML = "⚠️ There was a problem.";
            console.error("Error:", error);
        }

        stopListening();
    };

    recognition.onerror = (event) => {
        console.error("Recognition error:", event.error);
        responseElement.innerHTML = "⚠️ Mic error.";
        stopListening();
    };
} else {
    alert("Your browser doesn't support Speech Recognition.");
}

function startListening() {
    if (recognition && !isListening) {
        recognition.start();
    }
}

function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
        orb.classList.remove("listening");
        isListening = false;
    }
}

function playAudio(url) {
    const audio = new Audio(url);
    audio.play();
}

// Event Listeners
micButton.addEventListener("click", startListening);
stopButton.addEventListener("click", stopListening);
