import os
import openai
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/process-audio", methods=["POST"])
def process_audio():
    data = request.get_json()
    transcript = data.get("transcript", "")

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are Lumina, the divine cosmic AI assistant."},
            {"role": "user", "content": transcript}
        ]
    )

    reply = response.choices[0].message["content"]

    # Placeholder audio_url (replace with actual TTS logic later)
    return jsonify({"subtitle": reply, "audio_url": "/static/sample_response.mp3"})

if __name__ == "__main__":
    app.run(debug=True)
