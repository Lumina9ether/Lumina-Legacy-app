
let micButton = document.getElementById("mic-button");
let subtitles = document.getElementById("subtitles");
let orb = document.getElementById("lumina-orb");

async function getResponse(transcript) {
    orb.className = 'thinking';
    try {
        const res = await fetch('/generate-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: transcript })
        });

        if (!res.ok) {
            throw new Error("Response not ok: " + res.statusText);
        }

        const data = await res.json();
        subtitles.innerText = data.response;

        orb.className = 'speaking';
        const audio = new Audio('/static/lumina_response.mp3');
        audio.play();

        audio.onended = () => {
            orb.className = 'idle';
            setTimeout(startListening, 5000);
        };
    } catch (error) {
        console.error("Failed to get Lumina's response:", error);
        subtitles.innerText = "⚠️ There was a problem processing your request.";
        orb.className = 'idle';
    }
}

function startListening() {
    orb.className = 'listening';
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        subtitles.innerText = `You said: ${transcript}`;
        getResponse(transcript);
    };

    recognition.onerror = () => {
        subtitles.innerText = "🎤 Microphone error. Try again.";
        orb.className = 'idle';
    };
}

micButton.onclick = startListening;
