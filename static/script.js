document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const orb = document.getElementById("orb");
  const subtitle = document.getElementById("subtitle");
  const synth = window.speechSynthesis;

  if (!startBtn || !stopBtn || !orb || !subtitle) {
    console.error("❌ DOM elements missing.");
    return;
  }

  let recognition;
  let isListening = false;

  function startListening() {
    if (isListening) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.start();
      isListening = true;
      subtitle.innerHTML = "🎤 Listening...";
      orb.classList.add("pulse");

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        subtitle.innerHTML = `🗣️ You said: ${transcript}`;
        recognition.stop();
        isListening = false;
        orb.classList.remove("pulse");

        try {
          const response = await fetch("/generate-response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: transcript }),
          });

          if (!response.ok) {
            throw new Error("Response not ok");
          }

          const data = await response.json();
          subtitle.innerHTML = `✨ ${data.response}`;
          speak(data.response);
        } catch (err) {
          console.error("Error generating response:", err);
          subtitle.innerHTML = "⚠️ There was a problem.";
        }
      };

      recognition.onerror = (event) => {
        console.error("Recognition error:", event.error);
        subtitle.innerHTML = "⚠️ Mic error.";
        isListening = false;
        orb.classList.remove("pulse");
      };

      recognition.onend = () => {
        isListening = false;
        orb.classList.remove("pulse");
      };
    } catch (err) {
      console.error("Speech recognition not supported:", err);
      subtitle.innerHTML = "⚠️ Mic not supported in this browser.";
    }
  }

  function stopListening() {
    if (recognition && isListening) {
      recognition.stop();
      isListening = false;
      orb.classList.remove("pulse");
      subtitle.innerHTML = "⏹️ Stopped listening.";
    }
  }

  function speak(text) {
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    synth.speak(utterance);
  }

  startBtn.addEventListener("click", startListening);
  stopBtn.addEventListener("click", stopListening);

  // Preemptively ask for mic access
  navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
    console.log("🎤 Mic access granted.");
  }).catch(err => {
    console.warn("⚠️ Mic access denied:", err);
    subtitle.innerHTML = "⚠️ Mic permission denied.";
  });
});
