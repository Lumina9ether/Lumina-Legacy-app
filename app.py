from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import openai
import requests
import os

app = Flask(__name__)
CORS(app)

# Set your keys here
openai.api_key = os.getenv("OPENAI_API_KEY")
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
voice_id = os.getenv("ELEVENLABS_VOICE_ID")  # or hardcode

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        prompt = request.json["prompt"]

        # 1. Get GPT response
        completion = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = completion.choices[0].message.content.strip()

        # 2. Convert to speech via ElevenLabs
        tts_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": elevenlabs_api_key,
                "Content-Type": "application/json"
            },
            json={
                "text": response_text,
                "voice_settings": {"stability": 0.4, "similarity_boost": 0.75}
            }
        )

        if tts_response.status_code != 200:
            raise Exception("Voice generation failed")

        audio_path = "static/lumina_response.mp3"
        with open(audio_path, "wb") as f:
            f.write(tts_response.content)

        return jsonify({"text": response_text, "audio_url": f"/{audio_path}"})
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Something went wrong"}), 500

if __name__ == "__main__":
    app.run(debug=True)
