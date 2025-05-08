import os
import traceback
from flask import Flask, request, jsonify, render_template
from elevenlabs import generate, save, set_api_key
import openai
from dotenv import load_dotenv

load_dotenv()

# === SETUP ===
app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")
set_api_key(os.getenv("ELEVENLABS_API_KEY"))

# === MEMORY BANK ===
conversation_history = []

# === HOME ROUTE ===
@app.route("/")
def home():
    return render_template("index.html")

# === AUDIO PROCESSING ROUTE ===
@app.route("/process-audio", methods=["POST"])
def process_audio():
    try:
        data = request.get_json()
        user_text = data.get("text", "")

        if not user_text:
            return jsonify({"error": "No input received"}), 400

        print(f"💬 User said: {user_text}")
        conversation_history.append({"role": "user", "content": user_text})

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=conversation_history,
            temperature=0.8
        )

        lumina_reply = response.choices[0].message.content
        print(f"🤖 Lumina replies: {lumina_reply}")
        conversation_history.append({"role": "assistant", "content": lumina_reply})

        # === Generate voice with ElevenLabs ===
        try:
            audio = generate(text=lumina_reply, voice="Rachel", model="eleven_monolingual_v1")
            save(audio, "static/lumina_response.mp3")
            return jsonify({"reply": lumina_reply})
        except Exception as ve:
            print("❌ Voice generation failed:", ve)
            return jsonify({"reply": lumina_reply, "error": "voice_failed"}), 500

    except Exception as e:
        print("🔥 Full traceback:")
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500

# === MAIN ===
if __name__ == "__main__":
    app.run(debug=True)
