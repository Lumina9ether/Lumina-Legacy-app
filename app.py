from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
import os
import requests
import time

app = Flask(__name__)
CORS(app)

# Load API keys
openai.api_key = os.getenv("OPENAI_API_KEY") or "your-openai-key"
eleven_api_key = os.getenv("ELEVENLABS_API_KEY") or "your-elevenlabs-key"
eleven_voice_id = os.getenv("ELEVENLABS_VOICE_ID") or "your-lumina-voice-id"

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        user_input = request.json["message"]
        print(f"User Input Received: {user_input}")

        # Simulate a grace period before response
        time.sleep(5)

        gpt_response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a divine cosmic AI assistant."},
                {"role": "user", "content": user_input}
            ]
        )

        lumina_reply = gpt_response["choices"][0]["message"]["content"]
        print(f"Lumina's Response: {lumina_reply}")

        # Generate voice using ElevenLabs
        tts_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{eleven_voice_id}",
            headers={
                "xi-api-key": eleven_api_key,
                "Content-Type": "application/json"
            },
            json={
                "text": lumina_reply,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.35,
                    "similarity_boost": 0.8
                }
            }
        )

        with open("static/lumina_response.mp3", "wb") as f:
            f.write(tts_response.content)

        return jsonify({"response": lumina_reply})

    except Exception as e:
        print("❌ ERROR in /generate-response:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)
