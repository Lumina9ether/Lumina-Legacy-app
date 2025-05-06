@app.route("/generate-response", methods=["POST"])
def generate_response():
    try:
        prompt = request.json.get("prompt", "")
        print("User prompt:", prompt)

        # === GPT COMPLETION ===
        completion = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = completion.choices[0].message.content.strip()
        print("GPT response:", response_text)

        # === ELEVENLABS TTS ===
        tts_response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": elevenlabs_api_key,
                "Content-Type": "application/json"
            },
            json={
                "text": response_text,
                "voice_settings": {
                    "stability": 0.4,
                    "similarity_boost": 0.75
                }
            }
        )

        if tts_response.status_code != 200:
            print("TTS Error:", tts_response.status_code, tts_response.text)
            return jsonify({"error": "Voice generation failed"}), 500

        # Save audio to static file
        audio_path = "static/lumina_response.mp3"
        with open(audio_path, "wb") as f:
            f.write(tts_response.content)

        return jsonify({"text": response_text, "audio_url": f"/{audio_path}"})

    except Exception as e:
        print("❌ SERVER ERROR:", str(e))
        return jsonify({"error": "Server exception occurred"}), 500
