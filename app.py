from flask import Flask, request, jsonify, render_template
import os
import requests
from openai import OpenAI

app = Flask(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
voice_id = os.getenv("ELEVENLABS_VOICE_ID")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        data = request.get_json()
        prompt = data["prompt"]

        gpt_response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a cosmic AI assistant."},
                {"role": "user", "content": prompt},
            ]
        )
        response_text = gpt_response.choices[0].message.content

        # ElevenLabs audio
        voice_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": elevenlabs_api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": response_text,
            "voice_settings": {"stability": 0.4, "similarity_boost": 0.85}
        }

        audio_response = requests.post(voice_url, json=payload, headers=headers)
        audio_response.raise_for_status()

        with open("static/lumina_response.mp3", "wb") as f:
            f.write(audio_response.content)

        return jsonify({"text": response_text})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()
