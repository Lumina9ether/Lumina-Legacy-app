let recognizing = false;
let recognition;
let synth = window.speechSynthesis;

const micBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const orb = document.getElementById("orb");
const subtitle = document.getElementById("subtitle");

function initializeRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    recognizing = true;
    orb.style.boxShadow = "0 0 40px 20px #9c27b0";
    subtitle.innerHTML = "🎤 Listening...";
  };

  recognition.onend = () => {
    recognizing = false;
    orb.style.boxShadow = "0 0 30px 15px #6a1b9a";
    subtitle.innerHTML = "✨ Awaiting your divine message...";
  };

  recognition.onerror = (event) => {
    console.error("Recognition error:", event.error);
    subtitle.innerHTML = "⚠️ There was a problem.";
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    subtitle.innerHTML = `🗣️ You said: "${transcript}"`;

    try {
      const response = await fetch("/generate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: transcript })
      });

      if (!response.ok) throw new Error("Network response not ok");

      const data = await response.json();
      const reply = data.response;
      subtitle.innerHTML = `💬 Lumina: "${reply}"`;

      const utter = new SpeechSynthesisUtterance(reply);
      utter.lang = "en-US";
      synth.speak(utter);
    } catch (err) {
      console.error("Fetch error:", err);
      subtitle.innerHTML = "⚠️ Lumina couldn't respond. Please try again.";
    }
  };
}

micBtn.addEventListener("click", () => {
  if (!recognition) initializeRecognition();
  if (!recognizing) recognition.start();
});

stopBtn.addEventListener("click", () => {
  if (recognizing && recognition) recognition.stop();
});
