import os
import traceback
from flask import Flask, request, jsonify, render_template
from elevenlabs import generate, save, set_api_key
from tempfile import NamedTemporaryFile
import openai

app = Flask(__name__)

# Set your API keys from environment variables
openai.api_key = os.getenv("OPENAI_API_KEY")
set_api_key(os.getenv("ELEVENLABS_API_KEY"))
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

conversation_memory = []

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/process-audio", methods=["POST"])
def process_audio():
    try:
        data = request.get_json()
        user_message = data.get("message", "")

        if not user_message:
            return jsonify({"error": "No message received"}), 400

        conversation_memory.append({"role": "user", "content": user_message})

        # Use OpenAI's current model interface
        completion = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are Lumina, a divine, helpful, high-vibration AI assistant."}
            ] + conversation_memory,
        )

        response_text = completion.choices[0].message.content.strip()
        conversation_memory.append({"role": "assistant", "content": response_text})

        # Generate voice
        audio = generate(text=response_text, voice=VOICE_ID, model="eleven_multilingual_v2")

        with NamedTemporaryFile(delete=False, suffix=".mp3", dir="static") as f:
            save(audio, f.name)
            audio_filename = os.path.basename(f.name)

        return jsonify({
            "response": response_text,
            "audio_url": f"/static/{audio_filename}"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Internal Server Error"}), 500

if __name__ == "__main__":
    app.run(debug=True)
