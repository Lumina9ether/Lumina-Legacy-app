import os
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import openai
import requests
import traceback

# Initialize app
app = Flask(__name__)
CORS(app)

# Set up API keys from environment
openai.api_key = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        data = request.get_json()
        user_input = data.get("text", "")

        if not user_input:
            return jsonify({"error": "Missing text input"}), 400

        # --- GPT-4 Response ---
        gpt_response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a cosmic, divine, emotionally aware AI guide who speaks like a wise and comforting oracle."},
                {"role": "user", "content": user_input}
            ]
        )
        lumina_text = gpt_response['choices'][0]['message']['content'].strip()

        # --- ElevenLabs Voice Synthesis ---
        voice_payload = {
            "text": lumina_text,
            "voice_settings": {
                "stability": 0.45,
                "similarity_boost": 0.80
            }
        }

        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }

        tts_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            json=voice_payload,
            headers=headers
        )

        if tts_response.status_code != 200:
            return jsonify({"error": "Voice synthesis failed", "details": tts_response.text}), 500

        # Save MP3 to static
        audio_path = "static/lumina_response.mp3"
        with open(audio_path, "wb") as f:
            f.write(tts_response.content)

        return jsonify({
            "response": lumina_text,
            "audio_url": f"/{audio_path}"
        })

    except Exception as e:
        print("🔥 ERROR in /generate-response:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(debug=True)
