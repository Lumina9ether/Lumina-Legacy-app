let mediaRecorder;
let audioChunks = [];

const micButton = document.getElementById("micButton");
const subtitles = document.getElementById("subtitles");
const audioElement = document.getElementById("luminaAudio");

micButton.addEventListener("click", startListening);

// Automatically restart listening after response playback
audioElement.addEventListener("ended", () => {
  setTimeout(() => {
    startListening();
  }, 1000); // short delay to give mic reset time
});

function startListening() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        subtitles.textContent = "✨ Processing your request...";

        try {
          const response = await fetch("/generate-response", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Failed to get response from Lumina.");

          const data = await response.json();
          const text = data.text || "✨ Response ready.";

          // Set subtitle, wait for voice to play
          audioElement.src = "/static/lumina_response.mp3";
          audioElement.load();
          audioElement.onplay = () => {
            subtitles.textContent = text;
          };
          audioElement.play();
        } catch (error) {
          console.error("Error:", error);
          subtitles.textContent = "❌ There was a problem generating a response.";
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 4000); // 4 seconds capture
    })
    .catch((error) => {
      console.error("Mic access denied or error:", error);
      subtitles.textContent = "❌ Please allow microphone access.";
    });
}
