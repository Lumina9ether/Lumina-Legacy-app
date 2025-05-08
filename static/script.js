
document.addEventListener("DOMContentLoaded", function () {
  const stopButton = document.getElementById("stop-button");
  const orb = document.getElementById("orb");
  const subtitles = document.getElementById("subtitles");

  if (!stopButton || !orb || !subtitles) {
    console.error("🚫 Missing essential DOM elements.");
    return;
  }

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

    recognition.onstart = () => {
      recognizing = true;
    };

    recognition.onend = () => {
      recognizing = false;
      if (isSummoned && listening && !stopRequested) {
        recognition.start();
      }
    };

    recognition.onerror = (e) => {
      console.error("🎤 Recognition error:", e.error);
      if (e.error === "no-speech") {
        subtitles.innerText = "😶 I didn’t catch that. Try again.";
        orb.classList.add("idle");
        if (isSummoned && listening && !stopRequested && !recognizing) {
          recognition.start();
        }
      } else {
        subtitles.innerText = "❌ Mic error occurred.";
      }
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("User said:", transcript);

      // Summon trigger
      if (!isSummoned && transcript.toLowerCase().includes("lumina awaken")) {
        isSummoned = true;
        listening = true;
        subtitles.innerText = "🌌 I am here...";
        orb.classList.add("idle");
        recognition.start();
        return;
      }

      // Skip if not summoned
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
            // mic will not restart automatically — requires re-summon
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

  // Stop button fully shuts down voice and keeps subtitle
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

  // Begin listening for summon passively
  initializeRecognition();
  recognition.start();
});
