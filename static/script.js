window.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-btn');
    const stopButton = document.getElementById('stop-btn');
    const orb = document.querySelector('.orb');
    const subtitle = document.getElementById('subtitle');

    let recognition;
    let listening = false;

    async function getResponse(text) {
        subtitle.innerText = '✨ Thinking...';

        const response = await fetch('/generate-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_input: text })
        });

        if (!response.ok) {
            subtitle.innerText = '⚠️ There was a problem.';
            throw new Error('Response not ok');
        }

        const data = await response.json();
        const audio = new Audio(data.audio_url);
        subtitle.innerText = data.text;
        audio.play();
    }

    function startListening() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition not supported in this browser.');
            return;
        }

        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            listening = true;
            orb.classList.add('glow');
            subtitle.innerText = '🎤 Listening...';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            subtitle.innerText = `You said: ${transcript}`;
            getResponse(transcript);
        };

        recognition.onerror = (event) => {
            subtitle.innerText = '⚠️ Mic error.';
        };

        recognition.onend = () => {
            listening = false;
            orb.classList.remove('glow');
        };

        recognition.start();
    }

    function stopListening() {
        if (recognition && listening) {
            recognition.stop();
        }
    }

    startButton.addEventListener('click', startListening);
    stopButton.addEventListener('click', stopListening);
});
