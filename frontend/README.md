# 🤖 ClueAgent - AI Voice & Text Assistant

ClueAgent is a powerful Electron-based AI assistant that provides real-time voice and text interaction with AI models. It features a beautiful glass-morphism overlay interface that can be positioned anywhere on your desktop.

## ✨ Features

### 🎙️ **Voice Interaction**
- **Smart Voice Detection**: Automatically processes voice input with configurable silence detection
- **Optimized Audio Processing**: Fast voice-to-text transcription using Whisper
- **Intelligent Pause/Resume**: Keyboard shortcuts for seamless voice control
- **Real-time Audio Feedback**: Visual microphone indicator with pulse animations

### 💬 **Text Chat**
- **Instant Text Input**: Type questions and get AI responses immediately
- **Fast Processing**: Optimized timeouts for quick responses
- **Enter-to-Send**: Quick keyboard interaction
- **Rich Text Support**: Handles code snippets and complex queries

### 🎨 **Modern UI**
- **Glass Morphism Design**: Beautiful translucent interface with backdrop blur
- **Responsive Layout**: Dual-pane design with Live Insights and AI Response panels
- **Smooth Animations**: Fade-in effects and hover transitions
- **Status Indicators**: Clear visual feedback for all system states

### ⚡ **Performance Optimized**
- **Fast Startup**: Instant app launch without delays
- **Smart Audio Detection**: 800ms minimum clip, 600ms silence detection
- **Efficient Processing**: 30-second timeouts for text, 60-second for voice
- **Memory Friendly**: Optimized for continuous operation

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Python 3.8+** with required AI backend
- **Electron** compatible system (Windows, macOS, Linux)

### Installation

1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/clueagent.git
cd clueagent
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Start the Application**
```bash
npm start
```

4. **Start Backend Server** (in separate terminal)
```bash
cd ../backend
python app.py
```

## 🎮 Usage

### 🎤 Voice Controls
- **Start Listening**: Click microphone button or press `Ctrl+R`
- **Pause & Process**: Press `Ctrl+P` (processes current audio immediately)
- **Toggle Recording**: Click microphone icon in toolbar
- **Visual Feedback**: Microphone indicator shows current status

### ⌨️ Text Input
- **Quick Chat**: Type in the text box at the bottom
- **Send Message**: Press `Enter` or click the send button (➤)
- **Fast Responses**: Optimized for 30-second timeout
- **Code Support**: Handles programming questions and syntax

### 🛠️ Interface Controls
- **Clear History**: Click 🗑️ Clear button in top toolbar
- **Close App**: Click ✕ button in top-right corner
- **Drag Window**: Click and drag the header area
- **Resize**: App maintains 600x540px optimal size

### 📊 Status Information
- **🎤 Listening...**: Voice recording is active
- **⏸️ Paused**: Voice recording is paused (default state)
- **🔄 Processing...**: Audio/text being processed by AI
- **🤖 AI thinking...**: AI is generating response
- **❌ Error states**: Clear error messages for troubleshooting

## 📁 Project Structure

```
ClueAgent/
├── frontend/                 # Electron frontend application
│   ├── main.js              # Electron main process
│   ├── preload.js           # Secure context bridge
│   ├── index.html           # Main UI layout
│   ├── style.css            # Glass morphism styles
│   ├── script.js            # Frontend logic & AI interaction
│   └── package.json         # Frontend dependencies
├── backend/                 # Python AI backend (separate repo)
│   ├── app.py              # Flask server with AI endpoints
│   ├── requirements.txt    # Python dependencies
│   └── models/             # AI model configurations
└── README.md               # This file
```

## 🎨 UI Components

### Header Toolbar
- **Title**: ClueAgent branding with cyan glow effect
- **Status Area**: Microphone indicator, status text, badges
- **Control Buttons**: Clear (🗑️) and Close (✕) buttons

### Main Content
- **Live Insights Panel**: Real-time system status and feedback
- **AI Response Panel**: Chat history with user and AI messages
- **Text Input**: Modern input field with send button

### Visual Design
- **Colors**: Blue/cyan theme with rgba transparency
- **Animations**: Smooth transitions and hover effects  
- **Typography**: Segoe UI font family for Windows compatibility
- **Layout**: CSS Grid for responsive dual-pane design

## ⚙️ Configuration

### Audio Settings (in script.js)
```javascript
const MIN_CLIP_MS = 800;     // Minimum audio clip length
const MAX_CLIP_MS = 6000;    // Maximum audio clip length  
const SILENCE_MS = 600;      // Silence detection timeout
const SILENCE_THRESH = 0.012; // Audio sensitivity threshold
```

### API Endpoints
- **Health Check**: `GET /api/health`
- **Voice Chat**: `POST /api/voice-chat`
- **Text Assist**: `POST /api/code-assist`
- **AI Test**: `POST /api/test-ollama`

### Window Settings (in main.js)
```javascript
width: 600,
height: 540,
transparent: true,
frame: false,
alwaysOnTop: true,
resizable: false
```

## 🔧 Troubleshooting

### Common Issues

**🔌 Backend Not Running**
- Error: "Backend not running - start Python server"
- Solution: Start the Python backend server on port 5000

**🎤 Microphone Not Working**
- Error: "Microphone error: [permission details]"
- Solution: Grant microphone permissions to the app

**⏱️ Slow Responses**
- Error: "Request timed out - backend might be slow"  
- Solution: Check AI model performance, increase timeouts if needed

**❌ JSON Parse Errors**
- Error: "Failed to decode JSON object"
- Solution: Check API request format and backend logs

### Debug Mode
Enable debug logging by opening DevTools (`Ctrl+Shift+I`) and checking console output.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and formatting
- Add comments for complex logic
- Test voice and text functionality
- Ensure cross-platform compatibility
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Electron**: Cross-platform desktop framework
- **Whisper**: OpenAI's speech-to-text model
- **Ollama**: Local AI model runtime
- **CSS Glass Morphism**: Modern UI design inspiration
- **Web Audio API**: Browser-based audio processing

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/clueagent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/clueagent/discussions)
- **Email**: support@clueagent.com

---

**Made with ❤️ by the ClueAgent Team**

*ClueAgent - Your intelligent desktop companion for voice and text AI interaction.*
