# ClueAgent Setup Guide

Your ClueAgent has been updated with local AI capabilities! Here's how to get everything running:

## New Features ✨

1. **Local Speech Recognition** using Vosk (offline, no internet required)
2. **Local AI Responses** using Ollama with phi3:mini model
3. **Live Insight Feature** - Select text, copy it, press Ctrl+Shift+L for instant code/error assistance
4. **Enhanced Voice Controls** - Same listening/pause/resume functionality

## Setup Instructions

### 1. Backend Setup

#### Install Python Dependencies
```bash
cd C:\ClueAgent\backend
pip install -r requirements.txt
```

#### Install Vosk Model
1. Download a Vosk model from: https://alphacephei.com/vosk/models
2. Recommended: `vosk-model-en-us-0.22` for English (small, ~50MB)
3. Extract the downloaded model to `C:\ClueAgent\backend\vosk-model\`
4. The folder structure should be: `C:\ClueAgent\backend\vosk-model\am\`, `conf\`, etc.

#### Install and Setup Ollama
1. Download Ollama from: https://ollama.com/
2. Install Ollama
3. Open a command prompt and run:
```bash
ollama pull phi3:mini
```
4. Start Ollama service (it usually starts automatically)

### 2. Frontend Setup
No changes needed! Your existing Electron setup should work as-is.

### 3. Running the Application

#### Start Backend
```bash
cd C:\ClueAgent\backend
python app.py
```

#### Start Frontend (in another terminal)
```bash
cd C:\ClueAgent\frontend
npm start
```

## Hotkeys and Controls

- **Ctrl+Shift+M** - Toggle listening on/off
- **Ctrl+Shift+H** or **F12** - Hide/show widget
- **Ctrl+Shift+L** - Live Insight (select text, copy it first, then press this)
- **Clear** button - Clear all messages and insights

## Live Insight Feature Usage

1. Select any text (code, error message, etc.) in any application
2. Copy it (Ctrl+C)
3. Press Ctrl+Shift+L
4. See the AI assistance in the overlay!

## Troubleshooting

### Vosk Issues
- Make sure you downloaded and extracted a Vosk model to the correct path
- Check that the model folder contains `am/`, `conf/`, `ivector/` folders

### Ollama Issues
- Ensure Ollama is installed and running
- Check that phi3:mini model is pulled: `ollama list`
- If connection fails, the app will fall back to simple responses

### Audio Issues
- Make sure microphone permissions are granted
- Check Windows audio settings
- Try restarting the backend if audio stops working

### General Issues
- Make sure both backend (port 5000) and frontend are running
- Check browser console for any errors
- Restart both services if needed

## What Changed

### Backend Changes
- Replaced Google Speech Recognition with Vosk (local, offline)
- Added Ollama integration for phi3:mini model
- New `/api/code-assist` endpoint for Live Insight feature
- Better error handling and fallback responses

### Frontend Changes
- Added Live Insight hotkey (Ctrl+Shift+L)
- Enhanced UI with insight badge
- Clipboard integration for text selection
- Real-time AI responses in interview-style format

## Performance Notes

- Vosk processing is done locally and is quite fast
- phi3:mini is a lightweight model, good for quick responses
- Audio processing remains real-time with the same VOX detection
- Live Insight responses appear immediately in the overlay

Enjoy your enhanced ClueAgent! 🚀
