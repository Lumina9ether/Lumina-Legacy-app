let micButton = document.getElementById("mic-button");
let subtitles = document.getElementById("subtitles");
let orb = document.getElementById("lumina-orb");

function setOrbState(state) {
    orb.className = state;
}

async function getResponse(transcript) {
    setOrbState('thinking');
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 sec grace

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

        const audio = new Audio('/static/lumina_response.mp3');

        audio.onplay = () => {
            setOrbState('speaking');
            subtitles.innerText = data.response;
            subtitles.scrollIntoView({ behavior: "smooth", block: "end" });
        };

        audio.onended = () => {
            setOrbState('idle');
            setTimeout(startListening, 5000);
        };

        audio.play();

    } catch (error) {
        console.error("Failed to get Lumina's response:", error);
        subtitles.innerText = "⚠️ There was a problem processing your request.";
        setOrbState('idle');
    }
}

function startListening() {
    setOrbState('listening');

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
        setOrbState('idle');
    };
}

micButton.onclick = startListening;
