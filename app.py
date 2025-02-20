from flask import Flask, render_template, request, jsonify
from vosk import Model, KaldiRecognizer
import wave
import json
import os
import datetime
import re

app = Flask(__name__)

# Initialize Vosk model
model_path = "vosk-model-small-en-us-0.15"
model = Model(model_path)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file uploaded'}), 400
    
    audio_file = request.files['audio']
    
    # Save temporary wav file
    temp_path = "temp_audio.wav"
    audio_file.save(temp_path)
    
    # Process audio with Vosk
    wf = wave.open(temp_path, "rb")
    recognizer = KaldiRecognizer(model, wf.getframerate())
    
    # Process audio chunks
    transcript = ""
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if recognizer.AcceptWaveform(data):
            result = json.loads(recognizer.Result())
            transcript += result.get('text', '') + " "
    
    # Clean up
    wf.close()
    os.remove(temp_path)
    
    # Process extracted text
    processed_data = process_text(transcript)
    return jsonify(processed_data)

def process_text(text):
    # Extract meeting details
    meeting_details = extract_meeting_details(text)
    
    # Extract action items
    actions = extract_actions(text)
    
    # Extract key points
    key_points = extract_key_points(text)
    
    return {
        'transcript': text,
        'meeting_details': meeting_details,
        'actions': actions,
        'key_points': key_points
    }

def extract_meeting_details(text):
    # Basic date/time extraction using regex
    date_pattern = r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b'
    time_pattern = r'\b\d{1,2}[:]\d{2}\s*(?:AM|PM)?\b'
    
    dates = re.findall(date_pattern, text)
    times = re.findall(time_pattern, text)
    
    return {
        'dates': dates,
        'times': times
    }

def extract_actions(text):
    # Look for action keywords
    action_keywords = ['need to', 'must', 'should', 'will', 'todo', 'to-do']
    actions = []
    
    sentences = text.split('.')
    for sentence in sentences:
        for keyword in action_keywords:
            if keyword in sentence.lower():
                actions.append(sentence.strip())
                break
    
    return actions

def extract_key_points(text):
    # Look for important points
    key_phrases = ['important', 'key point', 'remember', 'note that']
    key_points = []
    
    sentences = text.split('.')
    for sentence in sentences:
        for phrase in key_phrases:
            if phrase in sentence.lower():
                key_points.append(sentence.strip())
                break
    
    return key_points

if __name__ == '__main__':
    app.run(debug=True)