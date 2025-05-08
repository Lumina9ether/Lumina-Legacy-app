const micButton = document.getElementById("micButton");
const stopButton = document.getElementById("stopButton");
const statusText = document.getElementById("statusText");
const orb = document.getElementById("orb");
const audioElement = new Audio();
let recognition;
let isListening = false;
let isSpeaking = false;
let memory = [];

let audioUnlocked = false;
document.addEventListener('click', () => {
  if (!audioUnlocked) {
    const dummyAudio = new Audio();
    dummyAudio.play().catch(() => {});
    audioUnlocked = true;
    console.log("🔊 Audio unlocked by user interaction.");
  }
});

function startListening() {
  if (!recognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isListening = true;
      statusText.innerText = "🎙️ Listening...";
      micButton.disabled = true;
      stopButton.disabled = false;
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[event.resultIndex][0].transcript.trim();
      console.log("User said:", transcript);

      if (transcript.toLowerCase().includes("lumina awaken")) {
        console.log("🌀 Voice command detected: Lumina Awaken");
        isListening = true;
        statusText.innerText = "🌌 Awakened. Awaiting your divine message...";
        return;
      }

      if (!isSpeaking && isListening) {
        recognition.stop(); // temporarily stop listening to prevent overlap
        await handleUserInput(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("🎤 Recognition error:", event.error);
      if (event.error === "no-speech" || event.error === "aborted") {
        statusText.innerText = "😶 I didn’t catch that. Try again.";
        isListening = false;
        micButton.disabled = false;
      }
    };

    recognition.onend = () => {
      if (isListening && !isSpeaking) {
        recognition.start(); // restart listening
      }
    };
  }

  recognition.start();
}

async function handleUserInput(text) {
  isSpeaking = true;
  orb.classList.add("thinking");
  statusText.innerText = "🧠 Thinking...";

  try {
    memory.push({ role: "user", content: text });

    const response = await fetch("/process-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, memory })
    });

    if (!response.ok) {
      throw new Error("Server error: " + response.statusText);
    }

    const data = await response.json();
    memory.push({ role: "assistant", content: data.response });

    statusText.innerText = data.response;
    audioElement.src = data.audio_url;

    await audioElement.play();
    console.log("🔊 Playing voice response...");

    audioElement.onended = () => {
      isSpeaking = false;
      orb.classList.remove("thinking");

      if (isListening) {
        recognition.start(); // restart after speaking ends
      }
    };

  } catch (error) {
    console.error("❌ Error handling input:", error);
    statusText.innerText = "❌ Error generating voice.";
    isSpeaking = false;
    orb.classList.remove("thinking");
  }
}

stopButton.addEventListener("click", () => {
  if (recognition && isListening) {
    recognition.stop();
  }
  isListening = false;
  isSpeaking = false;
  micButton.disabled = false;
  stopButton.disabled = true;
  audioElement.pause();
  audioElement.currentTime = 0;
  orb.classList.remove("thinking");
  console.log("🛑 Stopped all activity.");
});

// Automatically listen after voice activation
window.onload = () => {
  micButton.disabled = false;
  stopButton.disabled = true;
  statusText.innerText = "✨ Awaiting your divine message...";
  startListening();
};
