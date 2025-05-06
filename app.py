import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Load environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

openai.api_key = OPENAI_API_KEY

@app.route("/")
def index():
    return send_from_directory("templates", "index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        data = request.get_json()
        user_input = data.get("text", "")

        if not OPENAI_API_KEY or not ELEVENLABS_API_KEY or not VOICE_ID:
            raise ValueError("Missing required environment variables.")

        # GPT-4 ChatCompletion
        chat_response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": user_input}]
        )
        reply_text = chat_response.choices[0].message.content.strip()

        # ElevenLabs TTS request
        tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "text": reply_text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        tts_response = requests.post(tts_url, json=payload, headers=headers)

        if tts_response.status_code != 200:
            raise RuntimeError(f"TTS API failed: {tts_response.status_code} {tts_response.text}")

        # Save voice output
        output_path = "static/lumina_response.mp3"
        with open(output_path, "wb") as f:
            f.write(tts_response.content)

        return jsonify({"response": reply_text})

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)

if __name__ == "__main__":
    app.run(debug=True)
