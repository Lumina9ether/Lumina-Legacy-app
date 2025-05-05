const activateBtn = document.getElementById("activateMicBtn");
const subtitle = document.getElementById("subtitle");
const orb = document.getElementById("orb");

let recognition;
let isListening = false;

function startMic() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Your browser doesn't support speech recognition.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    orb.classList.add("listening");
    subtitle.textContent = "🎧 Listening...";
  };

  recognition.onerror = (event) => {
    isListening = false;
    orb.classList.remove("listening");
    subtitle.textContent = "Error: " + event.error;
  };

  recognition.onend = () => {
    isListening = false;
    orb.classList.remove("listening");
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    subtitle.textContent = `🗣️ You said: "${transcript}"`;

    const response = await fetch("/generate-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: transcript })
    });

    if (response.ok) {
      const data = await response.json();
      subtitle.textContent = `💡 Lumina: "${data.response}"`;

      const audio = new Audio("/static/lumina_response.mp3");
      audio.play();
    } else {
      subtitle.textContent = "⚠️ There was a problem.";
    }
  };

  recognition.start();
}

if (activateBtn) {
  activateBtn.onclick = startMic;
}
