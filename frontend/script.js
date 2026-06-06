// script.js - Fixed version for proper UI display

const messages = document.getElementById('messages');
const insightsList = document.getElementById('insights-list');
const clearBtn = document.getElementById('clear-btn');
const closeBtn = document.getElementById('close-btn');
const statusText = document.getElementById('status-text');
const pauseBadge = document.getElementById('pause-badge');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const textInput = document.getElementById('text-input');
const sendBtn = document.getElementById('send-btn');

let mediaStream;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let listeningEnabled = false; // Default to paused
let isInitialized = false; // Flag to prevent auto-start during init

// ✅ FIXED: Enhanced UI helpers with proper error handling
function addMessage(role, text) {
    console.log(`Adding message - Role: ${role}, Text: ${text}`); // Debug log
    
    if (!messages) {
        console.error('Messages container not found!');
        return null;
    }
    
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(`message-${role}`); // Add role-specific class
    
    const prefix = role === 'you' ? '🧑 ' : role === 'ai' ? '🤖 ' : 'ℹ️ ';
    div.textContent = prefix + text;
    
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    
    // Force UI update
    div.offsetHeight; // Trigger reflow
    
    return div; // Return the created element
}

function addInsight(text) {
    console.log(`Adding insight: ${text}`); // Debug log
    
    if (!insightsList) {
        console.error('Insights list not found!');
        return;
    }
    
    const row = document.createElement('div');
    row.className = 'insight-item';
    
    const dot = document.createElement('div');
    dot.className = 'insight-dot';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'insight-text';
    textDiv.textContent = text;
    
    row.appendChild(dot);
    row.appendChild(textDiv);
    insightsList.appendChild(row);
    insightsList.scrollTop = insightsList.scrollHeight;
}

// Audio recording setup (continuous recording until Ctrl+P)
const MIN_CLIP_MS = 500; // Minimum before processing
const MAX_CLIP_MS = 30000; // Much longer clips - only stop on Ctrl+P
const SILENCE_MS = 2000; // Longer silence threshold for continuous recording
const SILENCE_THRESH = 0.008; // More sensitive for better voice detection

let audioCtx;
let analyser;
let dataArray;
let lastSpeechTs = 0;
let clipStartTs = 0;
let monitorRaf;

async function startListening() {
    if (isRecording || !listeningEnabled) return;

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000,
                sampleSize: 16,
                channelCount: 1
            }
        });

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(mediaStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);

        audioChunks = [];

        let options = [
            { mimeType: 'audio/webm;codecs=opus' },
            { mimeType: 'audio/wav' },
            { mimeType: 'audio/webm' },
            {}
        ];

        let recorder = null;
        for (let option of options) {
            try {
                if (!option.mimeType || MediaRecorder.isTypeSupported(option.mimeType)) {
                    recorder = new MediaRecorder(mediaStream, option);
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!recorder) {
            throw new Error('No supported audio format found');
        }

        mediaRecorder = recorder;

        mediaRecorder.ondataavailable = e => {
            if (e.data && e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = async () => {
            if (audioChunks.length > 0) {
                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                const blob = new Blob(audioChunks, { type: mimeType });
                
                if (blob.size > 500) {
                    await sendAudio(blob);
                }
            }
            audioChunks = [];
        };

        lastSpeechTs = Date.now();
        clipStartTs = Date.now();
        mediaRecorder.start(100);
        isRecording = true;
        statusText.textContent = '🎤 Listening...';

        const monitor = () => {
            if (!isRecording) return;

            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const energy = sum / dataArray.length / 255;

            const now = Date.now();
            
            if (energy > SILENCE_THRESH) {
                lastSpeechTs = now;
            }

            const clipAge = now - clipStartTs;
            const silenceAge = now - lastSpeechTs;
            const longEnough = clipAge >= MIN_CLIP_MS;
            const silenceReached = silenceAge >= SILENCE_MS;
            const maxReached = clipAge >= MAX_CLIP_MS;

            if ((longEnough && silenceReached) || maxReached) {
                mediaRecorder.stop();
                
                setTimeout(() => {
                    if (listeningEnabled && mediaStream) {
                        audioChunks = [];
                        lastSpeechTs = Date.now();
                        clipStartTs = Date.now();
                        try {
                            mediaRecorder.start(100);
                        } catch (e) {
                            console.error('Restart error:', e);
                            startListening();
                        }
                    }
                }, 50);
            }

            monitorRaf = requestAnimationFrame(monitor);
        };

        monitorRaf = requestAnimationFrame(monitor);

    } catch (err) {
        addInsight('❌ Microphone error: ' + err.message);
        statusText.textContent = '❌ Mic error';
        console.error('Start listening error:', err);
    }
}

// ✅ FIXED: Enhanced sendAudio with better response handling
async function sendAudio(blob) {
    let aiThinkingMessage = null;
    
    try {
        console.log('Sending audio to backend...'); // Debug log
        statusText.textContent = '🔄 Transcribing audio...';

        const form = new FormData();
        const extension = blob.type.includes('wav') ? '.wav' :
                         blob.type.includes('webm') ? '.webm' :
                         blob.type.includes('ogg') ? '.ogg' : '.webm';
        
        form.append('audio', blob, `voice_${Date.now()}${extension}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased timeout to 60 seconds

        console.log('Making request to /api/voice-chat...'); // Debug log

        const resp = await fetch('http://localhost:5000/api/voice-chat', {
            method: 'POST',
            body: form,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('Response status:', resp.status); // Debug log

        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }

        const json = await resp.json();
        console.log('Response JSON:', json); // Debug log

        if (json.success) {
            // ✅ FIXED: Always show transcript first
            if (json.transcript && json.transcript.trim()) {
                console.log('Adding transcript to UI:', json.transcript);
                addMessage('you', json.transcript);
                
                // Show AI thinking indicator
                statusText.textContent = '🤖 AI thinking...';
                aiThinkingMessage = addMessage('ai', '🤔 Thinking...');
            }

            // ✅ FIXED: Always show AI response with thinking indicator
            if (json.response && json.response.trim()) {
                console.log('Adding AI response to UI:', json.response);
                
                // Remove thinking message if it exists
                if (aiThinkingMessage && aiThinkingMessage.parentNode) {
                    aiThinkingMessage.remove();
                }
                
                addMessage('ai', json.response);
            } else {
                console.warn('No AI response received:', json);
                
                // Remove thinking message if it exists
                if (aiThinkingMessage && aiThinkingMessage.parentNode) {
                    aiThinkingMessage.remove();
                }
                
                addMessage('ai', 'I couldn\'t generate a response. Please try again.');
            }

            // Removed backend insight output to clean up insights panel

        } else {
            console.error('Backend returned error:', json);
            addInsight('❌ Error: ' + (json.error || 'Could not process audio'));
        }

    } catch (e) {
        console.error('Send audio error:', e);
        
        if (e.name === 'AbortError') {
            addInsight('⏱️ Request timed out - backend might be slow');
        } else if (e.message.includes('Failed to fetch')) {
            addInsight('🔌 Backend not running - start Python server');
        } else {
            addInsight('❌ Network error: ' + e.message);
        }
    } finally {
        statusText.textContent = listeningEnabled ? '🎤 Listening...' : '⏸️ Paused';
    }
}

function stopListening() {
    listeningEnabled = false;
    document.body.classList.add('listening-paused');
    pauseBadge.hidden = false;
    pauseResumeBtn.textContent = '▶️';
    pauseResumeBtn.title = 'Click to resume voice recording (Ctrl/Cmd+Shift+M)';
    statusText.textContent = '⏸️ Paused';

    if (monitorRaf) {
        cancelAnimationFrame(monitorRaf);
        monitorRaf = null;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
            mediaRecorder.stop();
        } catch (e) {
            console.error('Stop recorder error:', e);
        }
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }

    if (audioCtx) {
        try {
            audioCtx.close();
        } catch (e) {
            console.error('Close audio context error:', e);
        }
        audioCtx = null;
    }

    isRecording = false;
}

async function ensureListening() {
    if (!listeningEnabled) return;
    
    document.body.classList.remove('listening-paused');
    pauseBadge.hidden = true;
    pauseResumeBtn.textContent = '🎤';
    pauseResumeBtn.title = 'Click to pause voice recording (Ctrl/Cmd+Shift+M)';
    
    await startListening();
}

async function toggleListening() {
    if (listeningEnabled) {
        stopListening();
    } else {
        listeningEnabled = true;
        await ensureListening();
    }
    
    if (window.electronAPI) {
        window.electronAPI.setListeningState(listeningEnabled);
    }
}

// Event listeners
clearBtn.addEventListener('click', () => {
    messages.innerHTML = '';
    insightsList.innerHTML = '';
    addInsight('💬 Cleared conversation history');
});

closeBtn.addEventListener('click', () => {
    if (window.electronAPI) {
        window.electronAPI.closeApp();
    }
});

pauseResumeBtn.addEventListener('click', toggleListening);

// ✅ FIXED: Handle electron events with proper keyboard shortcuts
if (window.electronAPI) {
    window.electronAPI.setVisibility((_, visible) => {
        console.log('Visibility changed:', visible);
    });

    window.electronAPI.onListeningChange(async (_, on) => {
        console.log('Listening state changed:', on, 'isInitialized:', isInitialized);
        
        // Ignore state changes during initialization to prevent auto-start
        if (!isInitialized) {
            console.log('Ignoring listening change during initialization');
            return;
        }
        
        listeningEnabled = on;
        if (on) {
            await ensureListening();
        } else {
            stopListening();
        }
    });

    // ✅ NEW: Ctrl+R - Start/Resume listening
    window.electronAPI.onStartListening(async () => {
        console.log('📢 Ctrl+R pressed - Starting/Resuming listening');
        addInsight('🎤 Ctrl+R: Listening resumed');
        listeningEnabled = true;
        await ensureListening();
    });

    // ✅ NEW: Ctrl+P - Pause and immediately process current audio
    window.electronAPI.onPauseAndProcess(async () => {
        console.log('⏸️ Ctrl+P pressed - Pausing and processing');
        addInsight('⏸️ Ctrl+P: Processing current audio...');
        
        // Stop current recording and process immediately
        if (isRecording && mediaRecorder && mediaRecorder.state !== 'inactive') {
            statusText.textContent = '🔄 Processing now...';
            try {
                mediaRecorder.stop();
            } catch (e) {
                console.warn('Could not stop recorder:', e);
            }
        }
        
        // Pause listening after processing
        setTimeout(() => {
            listeningEnabled = false;
            stopListening();
            addInsight('⏸️ Listening paused. Press Ctrl+R to resume.');
        }, 100);
    });

}

// ✅ NEW: Text input functionality
async function sendTextMessage() {
    const text = textInput.value.trim();
    
    if (!text || text.length === 0) {
        addInsight('💬 Please enter some text to send');
        return;
    }
    
    // Disable input while processing
    textInput.disabled = true;
    sendBtn.disabled = true;
    
    let aiThinkingMessage = null;
    
    try {
        // Add user message to chat
        addMessage('you', text);
        addInsight(`💬 Sent: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        
        // Clear input
        textInput.value = '';
        
        // Update status and show AI thinking
        statusText.textContent = '🤖 AI thinking...';
        aiThinkingMessage = addMessage('ai', '🤔 Thinking...');
        
        // Send to backend
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Reduced from 60s to 30s
        
        const response = await fetch('http://localhost:5000/api/code-assist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.response) {
                // Remove thinking message
                if (aiThinkingMessage && aiThinkingMessage.parentNode) {
                    aiThinkingMessage.remove();
                }
                addMessage('ai', result.response);
                addInsight('✅ Text message processed');
            } else {
                // Remove thinking message
                if (aiThinkingMessage && aiThinkingMessage.parentNode) {
                    aiThinkingMessage.remove();
                }
                addInsight('❌ Could not process message: ' + (result.error || 'Unknown error'));
                addMessage('ai', 'Sorry, I couldn\'t process your message. Please try again.');
            }
        } else {
            // Remove thinking message
            if (aiThinkingMessage && aiThinkingMessage.parentNode) {
                aiThinkingMessage.remove();
            }
            addInsight('❌ Backend error during message processing');
            addMessage('ai', 'Backend error occurred. Please check if the server is running.');
        }
        
    } catch (e) {
        console.error('Send text error:', e);
        if (e.name === 'AbortError') {
            addInsight('⏱️ Message timed out - backend might be slow');
        } else if (e.message.includes('Failed to fetch')) {
            addInsight('🔌 Backend not running - start Python server');
        } else {
            addInsight('❌ Message failed: ' + e.message);
        }
        addMessage('ai', 'Sorry, there was an error processing your message.');
    } finally {
        // Re-enable input
        textInput.disabled = false;
        sendBtn.disabled = false;
        textInput.focus();
        statusText.textContent = listeningEnabled ? '🎤 Listening...' : '⏸️ Paused';
    }
}

// ✅ Text input event handlers
if (textInput && sendBtn) {
    sendBtn.addEventListener('click', sendTextMessage);
    
    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendTextMessage();
        }
    });
    
    // Focus input when page loads
    textInput.focus();
}

// ✅ FIXED: Enhanced backend health check
async function checkBackendHealth() {
    try {
        console.log('Checking backend health...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for health check
        
        const response = await fetch('http://localhost:5000/api/health', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const health = await response.json();
        
        console.log('Backend health:', health);
        
        if (health.success) {
            const modelInfo = health.model_info || {};
            // Removed backend health insight to clean up insights panel
            console.log(`Backend ready: ${modelInfo.whisper || 'whisper'} + ${modelInfo.llm || 'llm'}`);
            
            if (!health.ollama_running) {
                // Removed ollama warning insight to clean up insights panel
                console.log('Ollama not detected - responses may be limited');
            }
        }
    } catch (e) {
        console.error('Backend health check failed:', e);
        // Removed backend unreachable insight to clean up insights panel
        console.log('Backend not reachable - start Python server');
    }
}

// ✅ FIXED: Test backend connection
async function testBackendConnection() {
    try {
        console.log('Testing backend connection...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for AI test
        
        const response = await fetch('http://localhost:5000/api/test-ollama', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'Hello, this is a test' }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const result = await response.json();
        console.log('Backend test result:', result);
        
        if (result.success && result.response) {
            // Removed AI test success insight to clean up insights panel
            console.log('AI connection test successful');
            addMessage('ai', `🧪 Test: ${result.response}`);
        } else {
            // Removed AI test failure insight to clean up insights panel  
            console.log(`AI test failed: ${result.error || 'Unknown error'}`);
        }
    } catch (e) {
        console.error('Backend test failed:', e);
        // Removed backend test failure insight to clean up insights panel
        console.log('Backend test failed - check server');
    }
}

// Initialize
(async () => {
    console.log('Initializing frontend...');
    
    // Check if required elements exist
    if (!messages || !insightsList) {
        console.error('Required DOM elements not found!');
        return;
    }
    
    await checkBackendHealth();
    
    // Skip automatic backend test for faster startup
    // User can test by typing a message
    
    // Always default to paused - ignore any previous Electron state
    listeningEnabled = false;
    
    // Tell Electron we want to start paused
    if (window.electronAPI) {
        window.electronAPI.setListeningState(false);
    }
    
    // Always start in stopped/paused state
    stopListening();
    
    // Set initial status text to paused
    statusText.textContent = '⏸️ Paused';
    
    addInsight('🎤 Voice assistant ready! Type text or use voice recording to chat with AI');
    console.log('Frontend initialization complete');
    
    // Mark as initialized so future state changes are allowed
    isInitialized = true;
})();
