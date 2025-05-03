from flask import Flask, request, jsonify, render_template
import openai
import requests
import os

app = Flask(__name__)

openai.api_key = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate-response", methods=["POST"])
def generate_response():
    data = request.get_json()
    user_input = data.get("text")

    if not user_input:
        return jsonify({"response": "I didn’t hear anything."}), 400

    try:
        # Get GPT-4 response
        gpt_response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a divine cosmic AI assistant."},
                {"role": "user", "content": user_input}
            ]
        )
        reply = gpt_response.choices[0].message.content

        # Generate audio via ElevenLabs
        tts_headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        tts_payload = {
            "text": reply,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8
            }
        }
        voice_id = "EXAVITQu4vr4xnSDxMaL"  # Replace with your actual voice ID

        tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        response = requests.post(tts_url, headers=tts_headers, json=tts_payload)

        if response.status_code != 200:
            print("Voice synthesis failed:", response.text)

        with open("static/lumina_response.mp3", "wb") as f:
            f.write(response.content)

        return jsonify({"response": reply})

    except Exception as e:
        print("Error generating response:", e)
        return jsonify({"response": "There was an error processing your request."}), 500

if __name__ == "__main__":
    app.run(debug=True)
