document.addEventListener('DOMContentLoaded', function () {
    const micButton = document.getElementById('activate-mic');
    const stopButton = document.getElementById('stop-button');
    const orb = document.getElementById('orb');
    const subtitle = document.getElementById('subtitle');

    let recognition;
    let isListening = false;

    if (!('webkitSpeechRecognition' in window)) {
        alert('Your browser does not support Speech Recognition.');
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    micButton.addEventListener('click', () => {
        recognition.start();
        isListening = true;
        orb.classList.add('listening');
        subtitle.innerHTML = '🎙️ Listening...';
        micButton.disabled = true;
        stopButton.disabled = false;
    });

    stopButton.addEventListener('click', () => {
        recognition.stop();
        isListening = false;
        orb.classList.remove('listening');
        subtitle.innerHTML = '✨ Awaiting your divine message...';
        micButton.disabled = false;
        stopButton.disabled = true;
    });

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        subtitle.innerHTML = `🗣️ You said: ${transcript}`;
        orb.classList.remove('listening');
        micButton.disabled = false;
        stopButton.disabled = true;

        try {
            const response = await fetch('/generate-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: transcript }),
            });

            const data = await response.json();
            if (data && data.reply) {
                speakResponse(data.reply);
                subtitle.innerHTML = `💡 Lumina: ${data.reply}`;
            } else {
                subtitle.innerHTML = '⚠️ Lumina could not respond.';
            }
        } catch (error) {
            console.error('Error:', error);
            subtitle.innerHTML = '⚠️ There was a problem.';
        }
    };

    function speakResponse(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }

    recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
        subtitle.innerHTML = '⚠️ Mic error occurred.';
        micButton.disabled = false;
        stopButton.disabled = true;
    };
});
