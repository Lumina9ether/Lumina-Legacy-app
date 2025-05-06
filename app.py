import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
import requests
from werkzeug.utils import secure_filename
import traceback

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'static'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load keys from environment
openai.api_key = os.environ.get("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID")

@app.route("/")
def index():
    return send_from_directory("templates", "index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        data = request.get_json()
        user_message = data.get("message", "")
        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # 1. Get GPT-4 Response
        gpt_response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a divine, cosmic, spiritual AI guide."},
                {"role": "user", "content": user_message}
            ]
        )
        lumina_reply = gpt_response['choices'][0]['message']['content']

        # 2. Generate voice from ElevenLabs
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }

        voice_payload = {
            "text": lumina_reply,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        voice_url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
        response = requests.post(voice_url, json=voice_payload, headers=headers)

        if response.status_code != 200:
            raise Exception(f"ElevenLabs error: {response.text}")

        filename = "lumina_response.mp3"
        filepath = os
