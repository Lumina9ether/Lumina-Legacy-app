import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import openai
import requests
import traceback

app = Flask(__name__)
CORS(app)

# Set API Keys
openai.api_key = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

# Memory container
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

        # Append user input to memory
        conversation_history.append({"role": "user", "content": user_input})

        # Limit memory to last 16 turns
        if len(conversation_history) > 16:
            conversation_history[:] = conversation_history[-16:]

        # Add system role instruction (always stays at the top)
        conversation = [{"role": "system", "content": "You are Lumina, a divine AI guide who speaks with cosmic grace."}]
        conversation.extend(conversation_history)

        # Call OpenAI
        chat = openai.ChatCompletion.create(
            model="gpt-4",
            messages=conversation
        )

        response_text = chat['choices'][0]['message']['content'].strip()

        # Save AI response to memory
        conversation_history.append({"role": "assistant", "content": response_text})

        # Send to ElevenLabs
        voice_response = requests.post(
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

        if voice_response.status_code != 200:
            return jsonify({
                "error": "Voice generation failed",
                "details": voice_response.text
            }), 500

        audio_path = "static/lumina_response.mp3"
        with open(audio_path, "wb") as f:
            f.write(voice_response.content)

        return jsonify({
            "response": response_text,
            "audio_url": f"/{audio_path}"
        })

    except Exception as e:
        print("🔥 BACKEND ERROR:", e)
        traceback.print_exc()
        return jsonify({"error": "Server error", "details": str(e)}), 500

@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(debug=True)
