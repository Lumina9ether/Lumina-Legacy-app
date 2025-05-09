import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from openai import OpenAI
from elevenlabs.client import ElevenLabs
from elevenlabs import save
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
el_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")
AUDIO_PATH = "static/lumina_response.mp3"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/process-audio", methods=["POST"])
def process_audio():
    try:
        data = request.get_json()
        transcript = data.get("transcript", "")

        if not transcript:
            return jsonify({"error": "No input"}), 400

        # GPT reply
        chat = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a divine assistant with cosmic clarity."},
                {"role": "user", "content": transcript}
            ]
        )
        response_text = chat.choices[0].message.content.strip()

        # Generate voice from ElevenLabs
        audio = el_client.generate(
            text=response_text,
            voice=VOICE_ID,
            model="eleven_multilingual_v2"
        )

        save(audio, AUDIO_PATH)

        return jsonify({
            "response": response_text,
            "audio_url": f"/{AUDIO_PATH}",
            "subtitle": response_text  # optional
        })

    except Exception as e:
        print("❌ Error in /process-audio:", e)
        return jsonify({"error": "Internal server error"}), 500

@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(debug=True)
