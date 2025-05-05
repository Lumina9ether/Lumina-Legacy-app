const micButton = document.getElementById("micButton");
const subtitles = document.getElementById("subtitles");
const luminaAudio = document.getElementById("luminaAudio");

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

micButton.onclick = () => {
  subtitles.textContent = "Listening...";
  recognition.start();
};

recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript;
  subtitles.textContent = `You said: "${transcript}"`;

  try {
    const response = await fetch("/generate-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: transcript }),
    });

    const data = await response.json();

    if (data.text) {
      subtitles.textContent = `Lumina: "${data.text}"`;
      luminaAudio.src = "/static/lumina_response.mp3";
    } else {
      subtitles.textContent = "Sorry, Lumina had an error.";
    }
  } catch (err) {
    console.error("Error:", err);
    subtitles.textContent = "There was a problem generating a response.";
  }
};

recognition.onerror = (event) => {
  subtitles.textContent = `Error occurred in recognition: ${event.error}`;
};
