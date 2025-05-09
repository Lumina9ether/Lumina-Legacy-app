import os
from flask import Flask, render_template, request, jsonify
from elevenlabs.client import ElevenLabs
from openai import OpenAI
from dotenv import load_dotenv
import base64

load_dotenv()

app = Flask(__name__)

# Initialize ElevenLabs
el_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

# Initialize OpenAI
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/process-audio", methods=["POST"])
def process_audio():
    try:
        user_input = request.json["text"]
        print(f"User said: {user_input}")

        # Step 1: Get OpenAI response
        completion = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": user_input}]
        )
        response_text = completion.choices[0].message.content.strip()
        print(f"Lumina response: {response_text}")

        # Step 2: Generate voice from ElevenLabs
        audio = el_client.generate(
            text=response_text,
            voice=os.getenv("ELEVENLABS_VOICE_ID"),
            model="eleven_multilingual_v2"
        )

        # Step 3: Encode voice audio for web return
        audio_base64 = base64.b64encode(audio).decode("utf-8")

        return jsonify({"response": response_text, "audio": audio_base64})

    except Exception as e:
        print("Voice generation error:", e)
        return jsonify({"error": "Voice generation failed."}), 500

if __name__ == "__main__":
    app.run(debug=True)
