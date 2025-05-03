
from flask import Flask, request, jsonify, render_template
from openai import OpenAI
import requests
import os

app = Flask(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        data = request.get_json()
        user_input = data.get("text")

        if not user_input:
            return jsonify({"response": "I didn’t hear anything."}), 400

        # GPT-4 with new OpenAI client
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a divine cosmic AI assistant."},
                {"role": "user", "content": user_input}
            ]
        )
        reply = response.choices[0].message.content
        print("GPT Reply:", reply)

        # ElevenLabs call
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        voice_id = "EXAVITQu4vr4xnSDxMaL"
        payload = {
            "text": reply,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8
            }
        }

        voice_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers=headers,
            json=payload
        )

        if voice_response.status_code != 200:
            print("Voice synthesis failed:", voice_response.status_code, voice_response.text)
            return jsonify({"response": reply})  # Still show text response

        with open("static/lumina_response.mp3", "wb") as f:
            f.write(voice_response.content)

        return jsonify({"response": reply})

    except Exception as e:
        print("ERROR IN /generate-response:", str(e))
        return jsonify({"response": "There was an error processing your request."}), 500

if __name__ == "__main__":
    app.run(debug=True)
