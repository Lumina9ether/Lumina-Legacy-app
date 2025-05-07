const micButton = document.getElementById("activate-mic");
const stopButton = document.getElementById("stop-button");
const orb = document.getElementById("orb");
const subtitles = document.getElementById("subtitle");

let recognition;
let listening = false;

// 💬 Initialize Speech Recognition
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    subtitles.innerText = `🗣️ You said: ${transcript}`;
    await getResponse(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Recognition error:", event.error);
    subtitles.innerText = "⚠️ Mic error.";
    stopButton.disabled = true;
    micButton.disabled = false;
  };
} else {
  alert("Your browser does not support Speech Recognition. Try Chrome or Edge.");
}

// 🎤 Start Listening
function startListening() {
  if (recognition && !listening) {
    listening = true;
    recognition.start();
    micButton.disabled = true;
    stopButton.disabled = false;
    subtitles.innerText = "🎙️ Listening...";
    orb.classList.add("listening");
  }
}

// 🛑 Stop Listening
function stopListening() {
  if (recognition && listening) {
    recognition.stop();
    listening = false;
    micButton.disabled = false;
    stopButton.disabled = true;
    subtitles.innerText = "✨ Awaiting your divine message...";
    orb.classList.remove("listening");
  }
}

// 🤖 Get GPT-4 Response and Speak
async function getResponse(prompt) {
  try {
    const response = await fetch("/generate-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error("Response not ok");

    const data = await response.json();
    const audio = new Audio(data.audio_url);
    subtitles.innerText = `💡 ${data.text}`;
    audio.play();
    audio.onended = () => {
      orb.classList.remove("speaking");
    };
    orb.classList.add("speaking");
  } catch (err) {
    console.error("Fetch error:", err);
    subtitles.innerText = "⚠️ There was a problem.";
    micButton.disabled = false;
    stopButton.disabled = true;
    orb.classList.remove("speaking");
  }
}

// ✅ Safe DOM Hook
window.onload = () => {
  const mic = document.getElementById("activate-mic");
  const stop = document.getElementById("stop-button");

  if (!mic || !stop) {
    console.error("❌ Mic or Stop button not found in DOM!");
    return;
  }

  mic.addEventListener("click", startListening);
  stop.addEventListener("click", stopListening);
};
