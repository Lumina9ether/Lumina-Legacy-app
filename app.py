import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import openai
import requests
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
OUTPUT_PATH = "static/lumina_response.mp3"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs("static", exist_ok=True)

@app.route("/")
def index():
    return send_from_directory("templates", "index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        data = request.get_json()
        user_input = data["text"]

        # Step 1: Get GPT-4 response
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": user_input}]
        )
        text_output = response.choices[0].message.content.strip()

        # Step 2: Convert to voice via ElevenLabs
        tts_url = "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text_output,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        tts_response = requests.post(tts_url, json=payload, headers=headers)

        if tts_response.status_code != 200:
            return jsonify({"error": "TTS failed"}), 500

        with open(OUTPUT_PATH, "wb") as f:
            f.write(tts_response.content)

        return jsonify({"response": text_output})

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": "Something went wrong"}), 500

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)

if __name__ == "__main__":
    app.run(debug=True)
