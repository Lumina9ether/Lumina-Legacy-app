from flask import Flask, render_template, request, send_from_directory, jsonify
import openai
import os
from werkzeug.utils import secure_filename

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        file = request.files["audio"]
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)

        # Transcribe audio
        with open(filepath, "rb") as f:
            transcript = openai.Audio.transcribe("whisper-1", f)["text"]

        # Generate GPT response
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a divine AI assistant with cosmic wisdom."},
                {"role": "user", "content": transcript}
            ]
        )
        lumina_reply = response.choices[0].message.content

        # Text-to-speech with ElevenLabs (placeholder logic)
        import requests
        eleven_api = os.getenv("ELEVENLABS_API_KEY")
        voice_id = os.getenv("ELEVENLABS_VOICE_ID")
        tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": eleven_api,
            "Content-Type": "application/json"
        }
        data = {
            "text": lumina_reply,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
        }
        tts_response = requests.post(tts_url, headers=headers, json=data)

        if tts_response.status_code == 200:
            with open("static/lumina_response.mp3", "wb") as out:
                out.write(tts_response.content)
        else:
            return jsonify({"error": "TTS generation failed."}), 500

        return jsonify({"text": lumina_reply})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Server error."}), 500

if __name__ == "__main__":
    app.run(debug=True)
