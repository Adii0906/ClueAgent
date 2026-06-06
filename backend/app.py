# app.py - Complete updated version with memory optimization and connectivity fixes

from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
import requests
import subprocess
from faster_whisper import WhisperModel
import logging

app = Flask(__name__)
CORS(app)

# Enhanced logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize faster-whisper model with ultra-fast settings
print("Loading ultra-fast whisper model...")
try:
    # Using 'tiny.en' model for maximum speed - English-only (39MB)
    whisper_model = WhisperModel(
        "tiny.en",  # English-only for 20% speed boost
        device="cpu", 
        compute_type="int8",  # Fastest compute type
        num_workers=1,  # Single worker for lower latency
        download_root=None,  # Use default cache
        local_files_only=False
    )
    print("✅ faster-whisper tiny.en model loaded successfully (ultra-fast English-only)")
except Exception as e:
    print(f"❌ Error loading faster-whisper model: {e}")
    whisper_model = None

# ✅ UPDATED: Use ultra-lightweight model for low-memory systems
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2:0.5b"  # Ultra-lightweight model (500MB)

def test_ollama_connection():
    """Test Ollama connectivity and model availability"""
    try:
        # Check if Ollama server is running
        response = requests.get("http://localhost:11434", timeout=5)
        if response.status_code != 200:
            return False, "Ollama server not responding"
        
        # Check if model exists
        models_response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if models_response.status_code == 200:
            models_data = models_response.json()
            model_names = [model['name'] for model in models_data.get('models', [])]
            
            # Check for exact model name match
            if OLLAMA_MODEL not in model_names:
                # Also check common variations
                variations = [OLLAMA_MODEL, f"{OLLAMA_MODEL}:latest", "gemma2"]
                found_model = None
                for var in variations:
                    if var in model_names:
                        found_model = var
                        break
                
                if found_model:
                    return True, f"Model found as: {found_model}"
                else:
                    return False, f"Model '{OLLAMA_MODEL}' not found. Available: {model_names}"
        
        return True, "Ollama connection successful"
        
    except requests.exceptions.ConnectionError:
        return False, "Cannot connect to Ollama server. Is it running on port 11434?"
    except Exception as e:
        return False, f"Ollama connection error: {str(e)}"

def convert_audio_to_wav(input_path, output_path):
    """Convert audio to WAV format using ffmpeg"""
    try:
        # Check if ffmpeg is available
        subprocess.run(['ffmpeg', '-version'], 
                      stdout=subprocess.DEVNULL, 
                      stderr=subprocess.DEVNULL, 
                      check=True)
        
        # Convert to WAV with specific parameters that work well with faster-whisper
        cmd = [
            'ffmpeg', '-i', input_path,
            '-acodec', 'pcm_s16le',  # 16-bit PCM
            '-ar', '16000',          # 16kHz sample rate
            '-ac', '1',              # Mono
            '-y',                    # Overwrite output
            output_path
        ]
        
        result = subprocess.run(cmd, 
                              stdout=subprocess.DEVNULL, 
                              stderr=subprocess.PIPE, 
                              check=True, 
                              text=True)
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg conversion failed: {e.stderr}")
        return False
    except FileNotFoundError:
        logger.error("FFmpeg not found. Please install ffmpeg for audio conversion.")
        return False

def transcribe_audio_with_whisper(audio_path):
    """Transcribe audio using faster-whisper with improved error handling"""
    if not whisper_model:
        return "Error: Whisper model not loaded"

    try:
        # Check if file exists and has content
        if not os.path.exists(audio_path):
            return "Error: Audio file does not exist"
        
        file_size = os.path.getsize(audio_path)
        if file_size < 100:  # Very small files are likely empty
            logger.warning(f"Audio file too small: {file_size} bytes")
            return ""

        logger.info(f"Processing audio file: {audio_path}, size: {file_size} bytes")

        # Try to transcribe the original file first
        wav_path = None
        try:
            segments, info = whisper_model.transcribe(
                audio_path,
                language="en",
                beam_size=1,  # Reduced for speed
                best_of=1,    # Reduced for speed
                temperature=0.0,
                condition_on_previous_text=False,
                compression_ratio_threshold=2.4,
                log_prob_threshold=-1.0,
                no_speech_threshold=0.6,
                initial_prompt="Transcribe this clearly spoken English audio.",
                vad_filter=True,  # Voice activity detection
                vad_parameters=dict(min_silence_duration_ms=500)
            )

        except Exception as direct_error:
            logger.warning(f"Direct transcription failed: {direct_error}")
            
            # Try converting to WAV first
            wav_path = audio_path.rsplit('.', 1)[0] + '_converted.wav'
            
            if convert_audio_to_wav(audio_path, wav_path):
                logger.info("Audio converted to WAV, retrying transcription...")
                
                segments, info = whisper_model.transcribe(
                    wav_path,
                    language="en",
                    beam_size=1,
                    best_of=1,
                    temperature=0.0,
                    condition_on_previous_text=False,
                    compression_ratio_threshold=2.4,
                    log_prob_threshold=-1.0,
                    no_speech_threshold=0.6,
                    initial_prompt="Transcribe this clearly spoken English audio.",
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500)
                )
            else:
                raise Exception(f"Could not process audio format: {direct_error}")

        # Combine all segments
        transcript_parts = []
        for segment in segments:
            text = segment.text.strip()
            if text and len(text) > 1:  # Filter out single characters
                transcript_parts.append(text)

        transcript = " ".join(transcript_parts).strip()
        
        # Clean up common transcription artifacts
        transcript = transcript.replace("  ", " ")
        transcript = transcript.replace("…", "...")
        
        # Remove converted file if created
        if wav_path and os.path.exists(wav_path):
            try:
                os.unlink(wav_path)
            except:
                pass

        logger.info(f"Transcription successful: '{transcript}'")
        return transcript

    except Exception as e:
        logger.error(f"Whisper transcription error: {str(e)}")
        
        # Clean up converted file if created
        if wav_path and os.path.exists(wav_path):
            try:
                os.unlink(wav_path)
            except:
                pass
                
        return "Error transcribing audio: Could not process audio format. Try speaking more clearly."

def generate_response_with_ollama(text, context_type="voice_chat"):
    """Generate response using memory-efficient Ollama model"""
    logger.info(f"Generating response for: '{text[:50]}...'")
    
    try:
        # Test connection first
        connected, message = test_ollama_connection()
        if not connected:
            logger.error(f"Ollama connection failed: {message}")
            return f"Error: {message}"

        # Enhanced prompts for better responses
        if context_type == "code_assist":
            prompt = f"""You are a helpful coding assistant. Analyze this code/text briefly:

{text}

Provide:
• What this code does
• Key insights
• Practical advice

Keep response under 80 words."""

        else:  # voice_chat
            prompt = f"""You are a helpful AI assistant. The user said: "{text}"

Respond naturally and helpfully in 1-2 sentences. Be conversational and direct."""

        # Optimized payload for smaller model
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": 100,  # Reduced for faster response
                "top_p": 0.9,
                "repeat_penalty": 1.1,
                "seed": -1
            }
        }

        logger.info(f"Sending request to Ollama: {OLLAMA_URL}")
        logger.info(f"Using model: {OLLAMA_MODEL}")

        # Make request with extended timeout
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        
        logger.info(f"Ollama response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result.get('response', '').strip()
            
            if not ai_response:
                return "I received your message but couldn't generate a response. Please try again."
            
            logger.info(f"✅ AI Response: '{ai_response[:50]}...'")
            return ai_response
            
        elif response.status_code == 500:
            error_detail = response.json().get('error', 'Unknown server error')
            if 'memory' in error_detail.lower():
                return f"Error: Not enough system memory. Try using a smaller model like 'gemma2:2b' or 'qwen2:1.5b'"
            return f"Error: Ollama server error - {error_detail}"
            
        elif response.status_code == 404:
            return f"Error: Model '{OLLAMA_MODEL}' not found. Run: ollama pull {OLLAMA_MODEL}"
            
        else:
            return f"Error: Ollama returned status {response.status_code}"

    except requests.exceptions.Timeout:
        logger.error("Ollama request timed out")
        return "Error: Request timed out. The model might be too slow for your system."
        
    except requests.exceptions.ConnectionError:
        logger.error("Cannot connect to Ollama")
        return "Error: Cannot connect to Ollama. Make sure it's running: ollama serve"
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return f"Error: {str(e)}"

def cleanup_files(file_paths):
    """Clean up temporary files"""
    for path in file_paths:
        try:
            if path and os.path.exists(path):
                os.unlink(path)
        except Exception:
            pass

@app.route('/api/voice-chat', methods=['POST'])
def voice_chat():
    """Handle voice chat with proper response formatting for frontend"""
    temp_paths = []
    
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'})

        audio_file = request.files['audio']
        if not audio_file.filename:
            return jsonify({'success': False, 'error': 'No audio file selected'})

        # Save uploaded file with proper extension detection
        filename = audio_file.filename or 'audio.webm'
        
        # Detect file type and use appropriate extension
        content_type = audio_file.content_type or ''
        if 'webm' in content_type or filename.endswith('.webm'):
            suffix = '.webm'
        elif 'wav' in content_type or filename.endswith('.wav'):
            suffix = '.wav'
        elif 'mp3' in content_type or filename.endswith('.mp3'):
            suffix = '.mp3'
        elif 'ogg' in content_type or filename.endswith('.ogg'):
            suffix = '.ogg'
        elif 'm4a' in content_type or filename.endswith('.m4a'):
            suffix = '.m4a'
        else:
            suffix = '.webm'  # Default fallback

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            audio_file.save(temp_file.name)
            temp_path = temp_file.name
            temp_paths.append(temp_path)

        logger.info(f"Saved audio file: {temp_path} ({os.path.getsize(temp_path)} bytes)")

        # Transcribe audio
        transcript = transcribe_audio_with_whisper(temp_path)

        if transcript.startswith("Error:"):
            cleanup_files(temp_paths)
            return jsonify({'success': False, 'error': transcript})

        if not transcript.strip():
            cleanup_files(temp_paths)
            return jsonify({
                'success': True,
                'transcript': '',
                'response': 'I didn\'t hear anything clear. Please try speaking again.',
                'insight': 'No clear speech detected'
            })

        logger.info(f"✅ Transcript: '{transcript}'")

        # Generate AI response
        ai_response = ""
        if transcript.strip():
            logger.info("Generating AI response...")
            ai_response = generate_response_with_ollama(transcript, "voice_chat")
            logger.info(f"✅ AI Response generated: '{ai_response[:50]}...'")
        else:
            ai_response = "I heard you but couldn't understand the words."

        cleanup_files(temp_paths)

        # ✅ FIXED: Ensure proper response format for frontend
        response_data = {
            'success': True,
            'transcript': transcript.strip(),
            'response': ai_response.strip(),
            'insight': f"✅ Processed with {OLLAMA_MODEL}: {len(transcript)} chars"
        }
        
        logger.info(f"Sending response to frontend: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Voice chat error: {str(e)}")
        cleanup_files(temp_paths)
        return jsonify({
            'success': False, 
            'error': f'Server error: {str(e)}'
        })

@app.route('/api/code-assist', methods=['POST'])
def code_assist():
    """Handle code assistance requests"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'success': False, 'error': 'No text provided'})

        selected_text = data['text'].strip()
        if not selected_text:
            return jsonify({'success': False, 'error': 'Empty text provided'})

        logger.info(f"Code assist for: {selected_text[:100]}...")

        # Generate response using Ollama
        try:
            ai_response = generate_response_with_ollama(selected_text, "code_assist")
            
            if ai_response.startswith("Error:"):
                ai_response = f"I can help analyze this code/text: '{selected_text[:100]}...'. Please ensure Ollama is running for detailed assistance."

        except Exception as e:
            logger.error(f"Code assist error: {e}")
            ai_response = f"Code assistance for: '{selected_text[:100]}...'. Please check syntax and logic."

        return jsonify({
            'success': True,
            'original_text': selected_text,
            'response': ai_response,
            'insight': f"📋 Code assistance: {len(selected_text)} chars analyzed"
        })

    except Exception as e:
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Enhanced health check with Ollama connectivity"""
    connected, message = test_ollama_connection()
    ffmpeg_available = check_ffmpeg_available()
    
    return jsonify({
        'success': True,
        'status': 'Backend running',
        'whisper_loaded': whisper_model is not None,
        'ollama_connected': connected,
        'ollama_message': message,
        'ffmpeg_available': ffmpeg_available,
        'model_info': {
            'whisper': 'faster-whisper-tiny',
            'llm': OLLAMA_MODEL,
            'memory_friendly': True,
            'ultra_fast': True
        }
    })

def check_ffmpeg_available():
    """Check if FFmpeg is available"""
    try:
        subprocess.run(['ffmpeg', '-version'], 
                      stdout=subprocess.DEVNULL, 
                      stderr=subprocess.DEVNULL, 
                      check=True)
        return True
    except:
        return False

@app.route('/api/test-ollama', methods=['POST'])
def test_ollama_endpoint():
    """Test Ollama connectivity from frontend"""
    try:
        data = request.get_json()
        test_text = data.get('text', 'Hello, please respond with a simple greeting.')
        
        logger.info(f"Testing Ollama with: '{test_text}'")
        response = generate_response_with_ollama(test_text, "voice_chat")
        
        return jsonify({
            'success': True,
            'input': test_text,
            'response': response,
            'connected': not response.startswith("Error:")
        })
    except Exception as e:
        logger.error(f"Test endpoint error: {e}")
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    print("🚀 Starting Ultra-Lightweight CluAgent Backend...")
    print("📋 Using faster-whisper-tiny for ultra-fast transcription (39MB)")
    print(f"🤖 Using {OLLAMA_MODEL} for responses (ultra-lightweight 500MB)")
    print("⚡ Optimized for maximum speed and minimal memory usage")
    
    # Test Ollama connection on startup
    connected, message = test_ollama_connection()
    if connected:
        print(f"✅ Ollama connection successful: {message}")
    else:
        print(f"❌ Ollama connection failed: {message}")
        print("   Make sure to run: ollama serve")
        print(f"   And ensure model is available: ollama pull {OLLAMA_MODEL}")
    
    # Check FFmpeg availability
    if check_ffmpeg_available():
        print("✅ FFmpeg available for audio conversion")
    else:
        print("⚠️ FFmpeg not found - some audio formats may not work")
        print("   Install FFmpeg: https://ffmpeg.org/download.html")
    
    print("🌐 Server running on http://localhost:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')
