const micButton = document.getElementById("micButton");
const stopButton = document.getElementById("stopButton");
const orb = document.getElementById("orb");
const subtitles = document.getElementById("subtitles");

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = "en-US";

function startListening() {
  recognition.start();
  micButton.disabled = true;
  subtitles.innerText = "🎙️ Listening...";
}

micButton.addEventListener("click", startListening);

stopButton.addEventListener("click", () => {
  const audio = document.getElementById("lumina-voice");
  if (audio && !audio.paused) {
    audio.pause();
    audio.currentTime = 0;
    console.log("Lumina stopped.");
  }
});

recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript;
  console.log("You said:", transcript);
  subtitles.innerText = `💬 ${transcript}`;
  micButton.disabled = false;

  try {
    const response = await fetch("/generate-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: transcript })
    });

    if (!response.ok) throw new Error("Response not ok");

    const data = await response.json();
    subtitles.innerText = `🔊 ${data.text}`;

    const audio = new Audio(data.audio_url);
    audio.id = "lumina-voice";
    document.body.appendChild(audio);
    audio.play();

  } catch (err) {
    console.error("Error:", err);
    subtitles.innerText = "⚠️ There was a problem.";
    micButton.disabled = false;
  }
};

recognition.onerror = (err) => {
  console.error("Mic error:", err);
  subtitles.innerText = "🎤 Mic error.";
  micButton.disabled = false;
};

// Wake-word (optional)
const wakeRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
wakeRecognition.continuous = true;
wakeRecognition.interimResults = false;

wakeRecognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
  if (transcript.includes("hey lumina")) {
    console.log("🌟 Wake word detected!");
    wakeRecognition.stop();
    startListening();
    setTimeout(() => wakeRecognition.start(), 10000); // restart after 10s
  }
};

wakeRecognition.start();
