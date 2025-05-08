import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
import requests
import traceback

app = Flask(__name__)
CORS(app)

# Load API keys
openai.api_key = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

# Memory buffer
conversation_history = []

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/process-audio", methods=["POST"])
def process_audio():
    try:
        data = request.get_json()
        user_input = data.get("input", "").strip()

        if not user_input:
            return jsonify({"error": "No input provided"}), 400

        # Update memory
        conversation_history.append({"role": "user", "content": user_input})
        if len(conversation_history) > 6:
            conversation_history.pop(0)

        # GPT Response
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a divine, warm, cosmic AI guide here to serve with grace and clarity."},
                *conversation_history
            ]
        )
        reply = response.choices[0].message["content"].strip()
        conversation_history.append({"role": "assistant", "content": reply})

        # Attempt voice synthesis
        try:
            voice_response = requests.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": reply,
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            )

            voice_response.raise_for_status()

            with open("static/lumina_response.mp3", "wb") as f:
                f.write(voice_response.content)

            return jsonify({
                "response": reply,
                "audio_url": "/static/lumina_response.mp3"
            })

        except Exception as voice_error:
            print("🛑 ElevenLabs failed:", voice_error)
            return jsonify({
                "response": f"{reply}\n\n(⚠️ My voice is temporarily offline, but I’m still here with you.)",
                "audio_url": ""
            })

    except Exception as e:
        print("🔥 Full traceback:\n", traceback.format_exc())
        return jsonify({"error": "Internal Server Error"}), 500

@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(debug=True)
