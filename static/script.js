document.addEventListener("DOMContentLoaded", () => {
    const activateBtn = document.getElementById("activateBtn");
    const stopBtn = document.getElementById("stopBtn");
    const orb = document.getElementById("orb");
    const subtitle = document.getElementById("subtitle");

    console.log("activateBtn:", activateBtn);
    console.log("stopBtn:", stopBtn);
    console.log("orb:", orb);
    console.log("subtitle:", subtitle);

    if (!activateBtn || !stopBtn || !orb || !subtitle) {
        console.error("One or more DOM elements are missing.");
        return;
    }

    const audio = new Audio();
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let listening = false;

    activateBtn.addEventListener("click", () => {
        recognition.start();
        subtitle.innerText = "🎙️ Listening...";
        orb.classList.add("listening");
        listening = true;
    });

    stopBtn.addEventListener("click", () => {
        recognition.stop();
        subtitle.innerText = "🛑 Stopped.";
        orb.classList.remove("listening");
        listening = false;
    });

    recognition.onresult = async (event) => {
        const userMessage = event.results[0][0].transcript;
        subtitle.innerText = `🗣️ You said: ${userMessage}`;

        try {
            const response = await fetch("/generate-response", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) throw new Error("Response not ok");

            const data = await response.json();
            subtitle.innerText = `✨ ${data.response}`;
            audio.src = data.audio_url;
            audio.play();
        } catch (err) {
            console.error(err);
            subtitle.innerText = "⚠️ There was a problem.";
        }

        if (listening) {
            setTimeout(() => recognition.start(), 500);
        }
    };

    recognition.onerror = (err) => {
        console.error("Recognition error:", err);
        subtitle.innerText = "❌ Mic error.";
        orb.classList.remove("listening");
    };
});
