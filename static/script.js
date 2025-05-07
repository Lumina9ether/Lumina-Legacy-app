// Speech recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-US";
recognition.interimResults = false;

// DOM elements
const micButton = document.getElementById("activate-mic");
const stopButton = document.getElementById("stop-button");
const orb = document.getElementById("orb");
const subtitles = document.getElementById("subtitle");

// Start listening
function startListening() {
  recognition.start();
  micButton.disabled = true;
  stopButton.disabled = false;
  subtitles.innerText = "🎙️ Listening...";
  orb.classList.add("glow");
}

// Stop listening
function stopListening() {
  recognition.stop();
  micButton.disabled = false;
  stopButton.disabled = true;
  orb.classList.remove("glow");
  subtitles.innerText = "✨ Awaiting your divine message...";
}

// Process voice input
recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript;
  subtitles.innerText = `🗣️ You said: ${transcript}`;
  await getResponse(transcript);
};

// Triggered when recognition ends
recognition.onend = () => {
  stopListening();
};

// API call to backend
async function getResponse(message) {
  try {
    const response = await fetch("/generate-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error("Response not ok");

    const data = await response.json();
    subtitles.innerText = `💬 ${data.response}`;
    playVoice(data.response);
  } catch (error) {
    subtitles.innerText = "⚠️ There was a problem.";
    console.error("Error:", error);
  }
}

// Voice output using ElevenLabs
function playVoice(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.voice = speechSynthesis.getVoices().find(voice => voice.name.includes("Google") || voice.default);
  speechSynthesis.speak(utterance);
}

// Event listeners
micButton.addEventListener("click", startListening);
stopButton.addEventListener("click", stopListening);
