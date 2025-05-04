const micButton = document.getElementById("mic-button");
const stopButton = document.getElementById("stop-button");
const responseText = document.getElementById("response-text");
const spokenText = document.getElementById("spoken-text");
const orb = document.getElementById("orb");
const luminaVoice = document.getElementById("lumina-voice");

let currentAudio = null;

function setOrbState(state) {
  orb.className = state;
}

function playAudioFromHex(hexAudio) {
  const byteArray = new Uint8Array(hexAudio.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const blob = new Blob([byteArray], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  luminaVoice.src = url;
  luminaVoice.play();
}

function fetchLuminaResponse(transcript) {
  setOrbState("thinking");

  setTimeout(() => {
    fetch("/generate-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: transcript })
    })
    .then(res => res.json())
    .then(data => {
      responseText.textContent = data.response;
      playAudioFromHex(data.audio);
      setOrbState("speaking");
    })
    .catch(err => {
      console.error("Error:", err);
      responseText.textContent = "An error occurred processing your request.";
      setOrbState("idle");
    });
  }, 5000); // Grace period
}

function startListening() {
  setOrbState("listening");

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    spokenText.textContent = transcript;
    fetchLuminaResponse(transcript);
  };

  recognition.onerror = function () {
    spokenText.textContent = "Mic error.";
    setOrbState("idle");
  };
}

micButton.addEventListener("click", () => {
  startListening();
  stopButton.style.display = "inline-block";
});

stopButton.addEventListener("click", () => {
  if (!luminaVoice.paused) {
    luminaVoice.pause();
    luminaVoice.currentTime = 0;
  }
  setOrbState("idle");
  stopButton.style.display = "none";
});

luminaVoice.onended = () => {
  setOrbState("idle");
  stopButton.style.display = "none";
};
