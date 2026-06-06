@echo off
echo =============================================
echo      CluAgent Voice Assistant Startup
echo =============================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found! Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Python and Node.js detected
echo.

REM Check if Ollama is available
echo 🤖 Checking Ollama installation...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️ WARNING: Ollama not found! 
    echo Please install Ollama from: https://ollama.ai/download
    echo You can still use ClueAgent for speech-to-text without AI responses.
    echo.
) else (
    echo ✅ Ollama detected
    
    REM Check if Ollama server is running
    echo 🔍 Checking if Ollama server is running...
    curl -s http://localhost:11434 >nul 2>&1
    if errorlevel 1 (
        echo 🚀 Starting Ollama server...
        start "Ollama Server" cmd /c "ollama serve"
        timeout /t 2 /nobreak >nul
    ) else (
        echo ✅ Ollama server is already running
    )
    
    REM Check if qwen2:0.5b model is available
    echo 📋 Checking for qwen2:0.5b model...
    ollama list | findstr "qwen2:0.5b" >nul 2>&1
    if errorlevel 1 (
        echo 📥 qwen2:0.5b model not found. Installing ultra-lightweight model...
        echo This is a 500MB download for instant AI responses.
        start "Model Download" cmd /c "ollama pull qwen2:0.5b && echo Model downloaded successfully! && pause"
    ) else (
        echo ✅ qwen2:0.5b model is ready
    )
)
echo.

REM Install Python dependencies
echo 📦 Installing Python dependencies...
cd "%~dp0backend"
echo Installing optimized dependencies for ultra-fast performance...
pip install -r requirements.txt

echo.
echo 🚀 Starting Python Backend Server (using qwen2:0.5b ultra-lightweight model)...
echo ⚠️  Make sure Ollama is running with: ollama serve
echo 💾 Make sure qwen2:0.5b model is installed: ollama pull qwen2:0.5b
start "CluAgent Backend" cmd /k "python app.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo.
echo 🖥️ Starting Electron Frontend...
cd "%~dp0frontend"

REM Install Node dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    npm install
)

REM Start the frontend
npm start

echo.
echo 🎉 CluAgent is starting up!
echo.
echo KEYBOARD SHORTCUTS:
echo   Ctrl+R = Start/Resume listening (continuous recording)
echo   Ctrl+P = Stop recording and process audio immediately
echo   Ctrl+Shift+M = Toggle pause/resume listening
echo   F12 or Ctrl+Shift+H = Hide/Show overlay
echo.
echo NEW FEATURES:
echo   ✅ Continuous recording until Ctrl+P (no auto-stop!)
echo   ⚡ Ultra-fast transcription with faster-whisper tiny.en
echo   🤖 Instant AI responses with qwen2:0.5b model
echo   💬 Type messages in the text box for AI chat
echo.
pause
