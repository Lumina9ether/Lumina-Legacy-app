import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import openai
import requests

app = Flask(__name__)
CORS(app)

openai.api_key = os.environ.get("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID")

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    file = request.files["audio"]
    filename = file.filename

    try:
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
    except Exception as e:
        return jsonify({"error": f"File save failed: {str(e)}"}), 500

    try:
        with open(filepath, "rb") as f:
            transcript = openai.Audio.transcribe("whisper-1", f)["text"]

        gpt_response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a divine, high-vibration AI assistant created to empower users with insight, clarity, and positive energy."},
                {"role": "user", "content": transcript}
            ]
        )

        response_text = gpt_response["choices"][0]["message"]["content"]

        tts_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "text": response_text,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }
        )

        if tts_response.status_code == 200:
            audio_path = os.path.join("static", "lumina_response.mp3")
            with open(audio_path, "wb") as out:
                out.write(tts_response.content)
            return jsonify({"transcript": transcript, "response": response_text})
        else:
            return jsonify({"error": "Voice generation failed", "details": tts_response.text}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
