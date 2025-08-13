/**
 * Hexpert Main Application
 * Handles UI interactions and coordinates audio/socket communication
 */

class HexpertApp {
    constructor() {
        this.socket = null;
        this.audioHandler = new AudioHandler();
        this.selectedGame = 'munchkin';
        
        this.initializeElements();
        this.setupEventListeners();
        this.connectToServer();
    }

    /**
     * Get DOM element references
     */
    initializeElements() {
        this.elements = {
            startBtn: document.getElementById('start-listening'),
            stopBtn: document.getElementById('stop-listening'),
            gameSelector: document.getElementById('game-mode'),
            connectionStatus: document.getElementById('connection-indicator'),
            listeningStatus: document.getElementById('listening-indicator'),
            transcriptOutput: document.getElementById('transcript-output')
        };
    }

    /**
     * Set up UI event listeners
     */
    setupEventListeners() {
        // Start listening button
        this.elements.startBtn.addEventListener('click', () => {
            this.startVoiceAssistant();
        });

        // Stop listening button
        this.elements.stopBtn.addEventListener('click', () => {
            this.stopVoiceAssistant();
        });

        // Game mode selector
        this.elements.gameSelector.addEventListener('change', (e) => {
            this.selectedGame = e.target.value;
            console.log(`Game mode changed to: ${this.selectedGame}`);
        });
    }

    /**
     * Connect to the backend server via Socket.IO
     */
    connectToServer() {
        this.socket = io();
        
        // Connection established
        this.socket.on('connect', () => {
            console.log('Connected to Hexpert server');
            this.updateConnectionStatus(true);
            this.audioHandler.initialize(this.socket);
        });

        // Connection lost
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus(false);
            this.stopVoiceAssistant();
        });

        // Handle transcribed text from server
        this.socket.on('transcription', (data) => {
            this.displayTranscription(data.text, data.timestamp);
        });

        // Handle AI responses
        this.socket.on('ai-response', (data) => {
            console.log('AI Response:', data.answer);
            this.displayAIResponse(data.answer, data.timestamp);
        });

        // Handle TTS audio responses
        this.socket.on('tts-audio', (data) => {
            console.log('TTS Audio received:', data.timestamp);
            this.playTTSAudio(data.audio, data.timestamp);
        });

        // Handle errors
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.displayError(error.message);
        });
    }

    /**
     * Start the voice assistant
     */
    async startVoiceAssistant() {
        try {
            await this.audioHandler.startListening();
            
            // Update UI state
            this.elements.startBtn.disabled = true;
            this.elements.stopBtn.disabled = false;
            this.updateListeningStatus(true);
            
            // Clear previous transcriptions
            this.clearTranscript();
            
            console.log('Voice assistant started');
            
        } catch (error) {
            console.error('Failed to start voice assistant:', error);
            this.displayError(error.message);
        }
    }

    /**
     * Stop the voice assistant
     */
    stopVoiceAssistant() {
        this.audioHandler.stopListening();
        
        // Update UI state
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.updateListeningStatus(false);
        
        console.log('Voice assistant stopped');
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(isConnected) {
        const indicator = this.elements.connectionStatus;
        if (isConnected) {
            indicator.textContent = 'Connected';
            indicator.className = 'status-connected';
        } else {
            indicator.textContent = 'Disconnected';
            indicator.className = 'status-disconnected';
        }
    }

    /**
     * Update listening status indicator
     */
    updateListeningStatus(isListening) {
        const indicator = this.elements.listeningStatus;
        if (isListening) {
            indicator.textContent = 'Active';
            indicator.className = 'status-active';
        } else {
            indicator.textContent = 'Inactive';
            indicator.className = 'status-inactive';
        }
    }

    /**
     * Display transcribed text in the output area
     */
    displayTranscription(text, timestamp) {
        const transcriptBox = this.elements.transcriptOutput;
        
        // Clear placeholder text
        if (transcriptBox.querySelector('.placeholder')) {
            transcriptBox.innerHTML = '';
        }
        
        // Create new transcript entry
        const entry = document.createElement('div');
        entry.className = 'transcript-text';
        entry.innerHTML = `<strong>[${new Date(timestamp).toLocaleTimeString()}] You:</strong> ${text}`;
        
        transcriptBox.appendChild(entry);
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }

    /**
     * Display AI response in the output area
     */
    displayAIResponse(response, timestamp) {
        const transcriptBox = this.elements.transcriptOutput;
        
        // Create AI response entry
        const entry = document.createElement('div');
        entry.className = 'ai-response';
        entry.style.backgroundColor = '#f0f8ff';
        entry.style.padding = '10px';
        entry.style.margin = '5px 0';
        entry.style.borderLeft = '4px solid #2196F3';
        entry.innerHTML = `<strong>[${new Date(timestamp).toLocaleTimeString()}] Hexpert:</strong><br>${response}`;
        
        transcriptBox.appendChild(entry);
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }

    /**
     * Clear transcript display
     */
    clearTranscript() {
        this.elements.transcriptOutput.innerHTML = '<p class="placeholder">Transcribed speech will appear here...</p>';
    }

    /**
     * Play TTS audio response
     */
    async playTTSAudio(base64Audio, timestamp) {
        try {
            // Convert base64 to blob
            const audioData = atob(base64Audio);
            const audioArray = new Uint8Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i);
            }
            
            const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Create and play audio element
            const audio = new Audio(audioUrl);
            
            // Add visual indicator
            this.showAudioPlayingIndicator();
            
            // Play the audio
            await audio.play();
            
            // Clean up when audio finishes
            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
                this.hideAudioPlayingIndicator();
                console.log('TTS audio playback completed');
            });
            
            // Handle playback errors
            audio.addEventListener('error', (e) => {
                console.error('Audio playback error:', e);
                URL.revokeObjectURL(audioUrl);
                this.hideAudioPlayingIndicator();
                this.displayError('Audio playback failed');
            });
            
        } catch (error) {
            console.error('TTS playback error:', error);
            this.displayError('Failed to play audio response');
        }
    }

    /**
     * Show audio playing indicator
     */
    showAudioPlayingIndicator() {
        // Add playing indicator to the latest AI response
        const responses = this.elements.transcriptOutput.querySelectorAll('.ai-response');
        if (responses.length > 0) {
            const latestResponse = responses[responses.length - 1];
            const indicator = document.createElement('span');
            indicator.className = 'audio-playing-indicator';
            indicator.innerHTML = ' 🔊';
            indicator.style.color = '#4CAF50';
            latestResponse.appendChild(indicator);
        }
    }

    /**
     * Hide audio playing indicator
     */
    hideAudioPlayingIndicator() {
        const indicators = this.elements.transcriptOutput.querySelectorAll('.audio-playing-indicator');
        indicators.forEach(indicator => indicator.remove());
    }

    /**
     * Display error messages
     */
    displayError(message) {
        const transcriptBox = this.elements.transcriptOutput;
        const errorEntry = document.createElement('div');
        errorEntry.style.color = '#f44336';
        errorEntry.innerHTML = `<strong>Error:</strong> ${message}`;
        transcriptBox.appendChild(errorEntry);
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new HexpertApp();
    console.log('Hexpert application initialized');
});