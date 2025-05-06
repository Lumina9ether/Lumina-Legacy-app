import os
import openai
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
voice_id = os.getenv("ELEVENLABS_VOICE_ID")

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return send_from_directory("templates", "index.html")

@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        prompt = request.json.get("prompt", "")
        print("User prompt:", prompt)

        completion = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = completion.choices[0].message.content.strip()
        print("GPT response:", response_text)

        # ElevenLabs request
        tts_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": elevenlabs_api_key,
                "Content-Type": "application/json"
            },
            json={
                "text": response_text,
                "voice_settings": {
                    "stability": 0.4,
                    "similarity_boost": 0.75
                }
            }
        )

        if tts_response.status_code != 200:
            print("TTS Error:", tts_response.status_code, tts_response.text)
            return jsonify({"error": "Voice generation failed"}), 500

        audio_path = "static/lumina_response.mp3"
        with open(audio_path, "wb") as f:
            f.write(tts_response.content)

        return jsonify({"text": response_text, "audio_url": f"/{audio_path}"})

    except Exception as e:
        print("❌ SERVER ERROR:", str(e))
        return jsonify({"error": "Server exception occurred"}), 500

if __name__ == "__main__":
    app.run(debug=True)
