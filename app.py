from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import openai
import requests
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate-response', methods=['POST'])
def generate_response():
    user_input = request.json.get('text')
    if not user_input:
        return jsonify({'error': 'No input provided'}), 400

    gpt_response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": "You are Lumina, a divine AI guide."},
                  {"role": "user", "content": user_input}]
    )

    reply = gpt_response['choices'][0]['message']['content']

    # Synthesize voice using ElevenLabs (replace YOUR_API_KEY and VOICE_ID)
    voice_id = "YOUR_ELEVENLABS_VOICE_ID"
    eleven_api_key = "YOUR_ELEVENLABS_API_KEY"
    headers = {
        "xi-api-key": eleven_api_key,
        "Content-Type": "application/json"
    }
    data = {
        "text": reply,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    response = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers=headers,
        json=data
    )
    with open("static/lumina_response.mp3", "wb") as f:
        f.write(response.content)

    return jsonify({'response': reply})

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)