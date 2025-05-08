
document.addEventListener("DOMContentLoaded", function () {
  const stopButton = document.getElementById("stop-button");
  const orb = document.getElementById("orb");
  const subtitles = document.getElementById("subtitles");
  const activateButton = document.getElementById("activate-mic");

  if (activateButton) {
    activateButton.style.display = "none";
  }

  if (!stopButton || !orb || !subtitles) {
    console.error("🚫 Missing essential DOM elements.");
    return;
  }

  // Unlock audio autoplay
  document.body.addEventListener("click", () => {
    const unlockAudio = new Audio();
    unlockAudio.play().catch(() => {});
  }, { once: true });

  let recognition;
  let listening = false;
  let recognizing = false;
  let stopRequested = false;
  let audio = null;
  let isSummoned = false;

  const initializeRecognition = () => {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      recognizing = true;
    };

    recognition.onend = () => {
      recognizing = false;
      if (!stopRequested) {
        recognition.start();
      }
    };

    recognition.onerror = (e) => {
      console.error("🎤 Recognition error:", e.error);
      if (e.error === "no-speech") {
        if (!stopRequested && !recognizing) recognition.start();
      }
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("User said:", transcript);

      if (!isSummoned && transcript.toLowerCase().includes("lumina awaken")) {
        isSummoned = true;
        listening = true;
        subtitles.innerText = "🌌 I am here...";
        orb.classList.add("idle");
        return;
      }

      if (!isSummoned || stopRequested) return;

      subtitles.innerText = "🧠 Thinking...";
      orb.classList.remove("idle");
      orb.classList.add("thinking");

      try {
        const response = await fetch("/process-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: transcript })
        });

        const text = await response.text();
        let data = {};

        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("❌ Invalid JSON response:", text);
          subtitles.innerText = "⚠️ Server error.";
          return;
        }

        if (data.audio_url) {
          orb.classList.remove("thinking");
          orb.classList.add("speaking");
          subtitles.innerText = data.response;

          audio = new Audio(data.audio_url);
          recognition.abort();
          recognizing = false;

          await audio.play().catch(err => {
            console.error("🔇 Audio playback failed:", err);
          });

          audio.onended = () => {
            if (stopRequested) return;
            orb.classList.remove("speaking");
            orb.classList.add("idle");
            isSummoned = false;
            listening = false;
          };
        } else {
          subtitles.innerText = "❌ Error generating voice.";
        }
      } catch (err) {
        console.error("⚠️ Fetch error:", err);
        subtitles.innerText = "⚠️ An error occurred.";
      }
    };
  };

  stopButton.addEventListener("click", () => {
    stopRequested = true;
    listening = false;
    isSummoned = false;

    if (recognizing) {
      recognition.abort();
      recognizing = false;
    }

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    stopButton.disabled = true;
    orb.classList.remove("speaking", "thinking");
    orb.classList.add("idle");
    subtitles.innerText += " 💬";
  });

  initializeRecognition();
  recognition.start();
});
