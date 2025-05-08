import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
import requests
import traceback

app = Flask(__name__)
CORS(app)

# Load environment variables
openai.api_key = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

# Chat memory
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
            return jsonify({"error": "No input received"}), 400

        conversation_history.append({"role": "user", "content": user_input})

        # Trim memory to last 6 messages
        if len(conversation_history) > 6:
            conversation_history.pop(0)

        # Get AI response
        chat_response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a warm cosmic AI with divine insight and a soothing voice."},
                *conversation_history
            ]
        )
        ai_message = chat_response.choices[0].message["content"].strip()
        conversation_history.append({"role": "assistant", "content": ai_message})

        # ElevenLabs voice synthesis
        voice_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "text": ai_message,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }
        )

        if voice_response.status_code == 200:
            with open("static/lumina_response.mp3", "wb") as f:
                f.write(voice_response.content)

            return jsonify({
                "response": ai_message,
                "audio_url": "/static/lumina_response.mp3"
            })

        else:
            print("🔴 ElevenLabs voice generation failed:", voice_response.status_code)
            print("Details:", voice_response.text)

            return jsonify({
                "response": "I'm here, but my voice is temporarily unavailable. Please continue, I’m still listening.",
                "audio_url": ""
            })

    except Exception as e:
        print("⚠️ Server error:\n", traceback.format_exc())
        return jsonify({
            "error": "Internal Server Error",
            "details": str(e)
        }), 500

@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(debug=True)
