from flask import Flask, request, jsonify, render_template
import openai
import os
import requests

app = Flask(__name__)

openai.api_key = os.getenv("OPENAI_API_KEY")
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
elevenlabs_voice_id = os.getenv("ELEVENLABS_VOICE_ID")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        user_input = request.json["text"]

        completion = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a high-vibrational cosmic guide that speaks with divine love and clarity."},
                {"role": "user", "content": user_input}
            ]
        )

        lumina_reply = completion.choices[0].message.content

        # Generate speech using ElevenLabs
        audio_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{elevenlabs_voice_id}",
            headers={
                "xi-api-key": elevenlabs_api_key,
                "Content-Type": "application/json"
            },
            json={
                "text": lumina_reply,
                "voice_settings": {
                    "stability": 0.4,
                    "similarity_boost": 0.9
                }
            }
        )

        if audio_response.status_code != 200:
            return jsonify({"error": "Failed to synthesize voice."}), 500

        return jsonify({"response": lumina_reply, "audio": audio_response.content.hex()})

    except Exception as e:
        print("Error generating response:", str(e))
        return jsonify({"error": "An error occurred processing your request."}), 500

if __name__ == "__main__":
    app.run(debug=True)
