from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import speech_recognition as sr
import openai
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure OpenAI API
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process-audio', methods=['POST'])
def process_audio():
    try:
        logger.debug("Received audio processing request")
        
        if 'audio' not in request.files:
            logger.error("No audio file in request")
            return jsonify({'error': 'No audio file provided'}), 400
            
        audio_file = request.files['audio']
        
        # Save the audio file temporarily
        temp_path = "temp_audio.wav"
        audio_file.save(temp_path)
        
        # Initialize recognizer
        recognizer = sr.Recognizer()
        
        # Convert audio to text
        try:
            with sr.AudioFile(temp_path) as source:
                logger.debug("Reading audio file")
                audio_data = recognizer.record(source)
                logger.debug("Converting speech to text")
                text = recognizer.recognize_google(audio_data)
                logger.debug(f"Transcribed text: {text}")
        except Exception as e:
            logger.error(f"Speech recognition error: {str(e)}")
            return jsonify({'error': f'Speech recognition failed: {str(e)}'}), 500
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
        # Process text with GPT
        try:
            logger.debug("Sending text to OpenAI")
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Extract tasks, events, and key points from this text"},
                    {"role": "user", "content": text}
                ]
            )
            extracted_data = response.choices[0].message['content']
            logger.debug(f"Extracted data: {extracted_data}")
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return jsonify({'error': f'OpenAI processing failed: {str(e)}'}), 500
        
        return jsonify({
            'transcript': text,
            'extracted_data': extracted_data
        })
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)