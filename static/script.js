const micButton = document.getElementById("mic-button");
const stopButton = document.getElementById("stop-button");
const transcriptDisplay = document.getElementById("transcript");
const orb = document.getElementById("orb");

let mediaRecorder;
let audioChunks = [];
let currentAudio = null;

function glow(state) {
    orb.style.boxShadow =
        state === "listening"
            ? "0 0 40px 20px #00f2ff"
            : state === "speaking"
            ? "0 0 40px 20px #a347ff"
            : "0 0 30px 15px #6e00ff";
}

micButton.onclick = async () => {
    glow("listening");
    transcriptDisplay.innerText = "🎙️ Listening...";
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
    mediaRecorder.onstop = async () => {
        glow("thinking");
        transcriptDisplay.innerText = "🔮 Processing...";

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        const whisperRes = await fetch("/transcribe", {
            method: "POST",
            body: formData,
        });

        const whisperData = await whisperRes.json();
        const userInput = whisperData.transcript;

        transcriptDisplay.innerText = `🗣️ You said: "${userInput}"`;

        setTimeout(async () => {
            const res = await fetch("/generate-response", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userInput }),
            });

            const data = await res.json();
            if (data.reply) {
                transcriptDisplay.innerText = `💡 Lumina: "${data.reply}"`;
                glow("speaking");

                const voiceRes = await fetch("/speak", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: data.reply }),
                });

                const audioURL = URL.createObjectURL(await voiceRes.blob());
                currentAudio = new Audio(audioURL);
                currentAudio.play();
                currentAudio.onended = () => glow("idle");
            } else {
                transcriptDisplay.innerText = "⚠️ There was a problem.";
                glow("idle");
            }
        }, 5000); // ⏱ 5-second grace period
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000); // ⏱ Record for 5 seconds
};

stopButton.onclick = () => {
    if (currentAudio) currentAudio.pause();
    glow("idle");
};
