# ClueAgent

ClueAgent is a desktop voice assistant built with Electron and Python. It listens for spoken commands, converts speech to text, and provides simple responses without requiring API keys.

## Features
- Voice input with Google Speech Recognition
- Quick responses for greetings, time queries, and help requests
- Continuous listening with microphone control
- Electron-based desktop interface

## Quick Start

### Run with launcher
- Double-click `ClueAgent.bat` to start both backend and frontend.

### Run manually
- Start backend:
  ```bash
  cd backend
  python app.py
  ```
- Start frontend in a separate terminal:
  ```bash
  cd frontend
  npm start
  ```

## Usage
- Grant microphone access when prompted
- Speak clearly into the microphone
- View recognized text and assistant responses in the overlay

## Shortcuts
- `Ctrl+Shift+H` or `F12`: Toggle visibility
- `Ctrl+Shift+M`: Pause/resume listening

## Requirements
- Python 3.7+ with pip
- Node.js and npm
- Microphone access
- Internet connection for speech recognition

## Troubleshooting
- Backend fails: verify Python installation and run `pip install -r requirements.txt`
- Frontend fails: verify Node.js installation and run `cd frontend && npm install`
- Microphone issues: check permissions and close other audio apps

## Project Structure
```
ClueAgent/
├── backend/
│   ├── app.py
│   └── package-lock.json
├── frontend/
│   ├── index.html
│   ├── main.js
│   ├── preload.js
│   ├── script.js
│   ├── style.css
│   └── package.json
├── ClueAgent.bat
├── start_backend.bat
├── start_frontend.bat
├── start_clueagent.ps1
└── requirements.txt
```
