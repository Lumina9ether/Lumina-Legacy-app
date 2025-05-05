const orb = document.getElementById("orb");
const subtitle = document.getElementById("subtitle");
const micButton = document.getElementById("mic-button");
const voice = document.getElementById("lumina-voice");
let mediaRecorder, audioChunks = [];

function resetSubtitle() {
    subtitle.textContent = "Your Divine Digital AI Assistant";
}

async function sendToBackend(audioBlob) {
    subtitle.textContent = "Listening to you...";
    orb.classList.add("thinking");

    const formData = new FormData();
    formData.append("audio", audioBlob, "input.wav");

    try {
        const response = await fetch("/generate-response", {
            method: "POST",
            body: formData
        });

        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType.includes("application/json")) {
            const errorText = await response.text();
            throw new Error(`Server error: ${errorText}`);
        }

        const result = await response.json();
        subtitle.textContent = result.text;

        // Play voice
        voice.src = "/static/lumina_response.mp3";
        await voice.play();

        // Wait for voice to finish before resetting
        voice.onended = () => {
            orb.classList.remove("thinking");
            setTimeout(resetSubtitle, 3000);
        };

    } catch (err) {
        console.error("Lumina backend error:", err);
        subtitle.textContent = "There was a problem generating a response.";
        orb.classList.remove("thinking");
    }
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            sendToBackend(audioBlob);
        };

        mediaRecorder.start();

        setTimeout(() => mediaRecorder.stop(), 4000); // 4-second max listen
    });
}

micButton.addEventListener("click", () => {
    subtitle.textContent = "Mic activated. Say something...";
    startRecording();
});
