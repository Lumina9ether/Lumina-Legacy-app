
document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("activate-mic");
  const stopButton = document.getElementById("stop-button");
  const orb = document.getElementById("orb");
  const subtitles = document.getElementById("subtitles");

  if (!startButton || !stopButton || !orb || !subtitles) {
    console.error("🚫 Missing essential DOM elements.");
    return;
  }

  let recognition;
  let listening = false;
  let audio = null;
  let stopRequested = false;

  const initializeRecognition = () => {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      subtitles.innerText = "🧠 Thinking...";
      orb.classList.remove("idle");
      orb.classList.add("thinking");

      try {
        const response = await fetch("/process-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: transcript })
        });

        const data = await response.json();
        if (data.audio_url) {
          orb.classList.remove("thinking");
          orb.classList.add("speaking");
          subtitles.innerText = data.response;

          audio = new Audio(data.audio_url);

          // Temporarily disable recognition
          recognition.onend = null;
          recognition.onerror = null;

          await audio.play().catch(err => {
            console.error("🔇 Audio playback failed:", err);
          });

          audio.onended = () => {
            orb.classList.remove("speaking");
            orb.classList.add("idle");
            subtitles.innerText = "✨ Awaiting your divine message...";

            if (listening && !stopRequested) {
              initializeRecognition();
              recognition.start();
            }
          };
        } else {
          subtitles.innerText = "❌ Error generating voice.";
        }
      } catch (err) {
        console.error(err);
        subtitles.innerText = "⚠️ An error occurred.";
      }
    };

    recognition.onerror = (e) => {
      console.error("🎤 Recognition error:", e.error);
      if (e.error === "no-speech") {
        subtitles.innerText = "😶 I didn’t catch that. Try again.";
        orb.classList.add("idle");
        if (listening && !stopRequested) {
          recognition.start();
        }
      } else {
        subtitles.innerText = "❌ Mic error occurred.";
      }
    };

    recognition.onend = () => {
      if (listening && !stopRequested) {
        recognition.start();
      }
    };
  };

  startButton.addEventListener("click", () => {
    if (listening) return;
    startButton.innerText = "🎙️ Listening...";
    stopButton.disabled = false;
    listening = true;
    stopRequested = false;
    initializeRecognition();
    recognition.start();
  });

  stopButton.addEventListener("click", () => {
    if (!listening) return;
    stopRequested = true;
    listening = false;
    recognition.stop();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    startButton.innerText = "🎙️ Activate Mic";
    stopButton.disabled = true;
    subtitles.innerText = "✨ Awaiting your divine message...";
    orb.classList.remove("speaking", "thinking");
    orb.classList.add("idle");
  });
});
