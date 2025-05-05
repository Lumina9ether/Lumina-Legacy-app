const micButton = document.getElementById("micButton");
const subtitles = document.getElementById("subtitles");
const audioPlayer = document.getElementById("luminaAudio");

micButton.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "input.wav");

      const response = await fetch("/generate-response", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to get response from Lumina.");
      }

      const data = await response.json();

      // Update subtitles and play voice
      subtitles.textContent = data.text || "Lumina replied, but no text returned.";
      audioPlayer.src = "/static/lumina_response.mp3";
      audioPlayer.play();
    };

    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorder.stop();
    }, 4000); // Record 4 seconds of audio

  } catch (err) {
    console.error("Mic error or server error:", err);
    subtitles.textContent = "There was a problem generating a response.";
  }
});
