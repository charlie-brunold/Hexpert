/**
 * Audio Handler for Hexpert
 * Manages microphone access, audio streaming, and wake word detection
 */

class AudioHandler {
    constructor() {
        this.mediaRecorder = null;
        this.audioStream = null;
        this.isListening = false;
        this.socket = null;
        this.audioChunks = [];
    }

    /**
     * Initialize audio handler with socket connection
     * @param {Socket} socket - Socket.IO connection
     */
    initialize(socket) {
        this.socket = socket;
        console.log('AudioHandler initialized');
    }

    /**
     * Request microphone permission and start listening
     */
    async startListening() {
        try {
            // Request microphone access
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // Create MediaRecorder for audio streaming
            this.mediaRecorder = new MediaRecorder(this.audioStream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            // Handle audio data chunks
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    
                    // Send audio data to server via Socket.IO
                    if (this.socket) {
                        this.socket.emit('audio-stream', event.data);
                    }
                }
            };

            // Start recording in chunks for real-time processing
            this.mediaRecorder.start(100); // 100ms chunks
            this.isListening = true;

            console.log('Audio listening started');
            return true;

        } catch (error) {
            console.error('Error starting audio:', error);
            throw new Error('Failed to access microphone. Please check permissions.');
        }
    }

    /**
     * Stop listening and clean up audio resources
     */
    stopListening() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }

        this.isListening = false;
        this.audioChunks = [];
        
        console.log('Audio listening stopped');
    }

    /**
     * Check if currently listening
     */
    getListeningStatus() {
        return this.isListening;
    }

    /**
     * Simulate wake word detection (placeholder for future implementation)
     * In production, this would use a wake word detection library
     */
    detectWakeWord() {
        // TODO: Implement actual wake word detection
        // For now, this is triggered manually or by server response
        if (this.socket) {
            this.socket.emit('wake-word-detected');
        }
    }
}