let mediaRecorder;
let audioChunks = [];

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                channelCount: 1,
                sampleRate: 16000
            }
        });
        
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
        });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await processAudio(audioBlob);
            audioChunks = [];
        };

        mediaRecorder.start(1000); // Collect data every second
        updateStatus('Recording...');
        startButton.disabled = true;
        stopButton.disabled = false;
    } catch (err) {
        updateStatus('Error: ' + err.message, true);
        console.error('Error:', err);
    }
}

async function processAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
        updateStatus('Processing audio...');
        const response = await fetch('/process-audio', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        
        transcriptElement.textContent = data.transcript;
        tasksListElement.innerHTML = formatActions(data.extracted_data);
        updateStatus('Processing complete');
    } catch (err) {
        updateStatus('Error: ' + err.message, true);
        console.error('Error:', err);
    }
}