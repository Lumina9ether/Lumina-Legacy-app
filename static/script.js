let recognition;
let isListening = false;
let isSpeaking = false;

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const orb = document.getElementById('orb');
const responseText = document.getElementById('response');
const audioElement = document.getElementById('lumina-voice');
const voiceSource = document.getElementById('voice-source');

// Set up speech recognition
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (window.SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    orb.classList.remove('idle');
    orb.classList.add('listening');
    responseText.textContent = '🎤 Listening...';
  };

  recognition.onend = () => {
    isListening = false;
    if (!isSpeaking) {
      orb.classList.remove('listening');
      orb.classList.add('idle');
      responseText.textContent = '✨ Awaiting your divine message...';
    }
  };

  recognition.onerror = (event) => {
    console.error("Recognition error:", event.error);
    responseText.textContent = "⚠️ Mic error occurred.";
    orb.classList.remove('listening');
    orb.classList.add('idle');
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    console.log("User said:", transcript);
    responseText.textContent = `🧠 "${transcript}"`;
    sendTranscript(transcript);
  };

  startBtn.addEventListener('click', () => {
    if (!isListening) recognition.start();
  });

  stopBtn.addEventListener('click', () => {
    if (isListening) recognition.stop();
    if (isSpeaking) {
      audioElement.pause();
      isSpeaking = false;
    }
    responseText.textContent = "✨ Awaiting your divine message...";
    orb.classList.remove('thinking', 'listening');
    orb.classList.add('idle');
  });

} else {
  alert('SpeechRecognition is not supported in your browser.');
}

function sendTranscript(transcript) {
  orb.classList.remove('idle');
  orb.classList.add('thinking');
  responseText.textContent = "🧠 Thinking...";

  fetch('/process-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: transcript })
  })
  .then(res => res.ok ? res.blob() : Promise.reject(res))
  .then(blob => {
    const audioURL = URL.createObjectURL(blob);
    voiceSource.src = audioURL;
    audioElement.load();
    audioElement.play();
    isSpeaking = true;

    audioElement.onended = () => {
      isSpeaking = false;
      orb.classList.remove('thinking');
      orb.classList.add('idle');
      if (!isListening) {
        responseText.textContent = '✨ Awaiting your divine message...';
      }
    };
  })
  .catch(err => {
    console.error("Voice generation error:", err);
    responseText.textContent = "❌ Error generating voice.";
    orb.classList.remove('thinking');
    orb.classList.add('idle');
  });
}
