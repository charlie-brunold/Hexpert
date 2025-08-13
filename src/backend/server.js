/**
 * Hexpert Backend Server
 * Main Express server with Socket.IO for real-time audio communication
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const OpenAI = require('openai');
const fs = require('fs');
const MunchkinExpert = require('../games/munchkin');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize game expert with OpenAI client
const munchkinExpert = new MunchkinExpert(openai);

// Audio buffer management for each client
const clientAudioBuffers = new Map();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

/**
 * Process transcribed question through game expert AI
 */
async function processQuestion(transcribedText, socket) {
  try {
    console.log('Processing question:', transcribedText);
    
    // Generate intelligent response using MunchkinExpert + GPT
    const response = await munchkinExpert.processQuestion(transcribedText);
    
    // Send AI response back to client
    socket.emit('ai-response', {
      question: transcribedText,
      answer: response,
      timestamp: new Date().toISOString()
    });
    
    console.log('AI Response:', response);
    
  } catch (error) {
    console.error('Question processing error:', error);
    socket.emit('error', { message: 'Failed to process your question' });
  }
}

/**
 * Process audio buffer through OpenAI Whisper
 */
async function transcribeAudio(audioBuffer, socket) {
  try {
    // Create temporary file for audio processing
    const tempFilePath = path.join(__dirname, `temp_audio_${socket.id}.webm`);
    
    // Write audio buffer to temporary file
    fs.writeFileSync(tempFilePath, Buffer.concat(audioBuffer));
    
    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
      language: 'en'
    });
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    
    // Send transcription back to client and process as question
    if (transcription.text.trim()) {
      socket.emit('transcription', {
        text: transcription.text,
        timestamp: new Date().toISOString()
      });
      
      console.log('Transcribed:', transcription.text);
      
      // Process transcribed text as a Munchkin question
      await processQuestion(transcription.text, socket);
    }
    
  } catch (error) {
    console.error('Transcription error:', error);
    socket.emit('error', { message: 'Transcription failed' });
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Initialize audio buffer for this client
  clientAudioBuffers.set(socket.id, []);

  // Handle audio stream from client
  socket.on('audio-stream', (audioData) => {
    console.log('Received audio data from client');
    
    // Get client's audio buffer
    const audioBuffer = clientAudioBuffers.get(socket.id) || [];
    
    // Add new audio chunk to buffer
    audioBuffer.push(audioData);
    clientAudioBuffers.set(socket.id, audioBuffer);
    
    // Process transcription every 2 seconds of audio data (approximately 20 chunks at 100ms each)
    if (audioBuffer.length >= 20) {
      // Process current buffer
      transcribeAudio([...audioBuffer], socket);
      
      // Clear buffer for next batch
      clientAudioBuffers.set(socket.id, []);
    }
  });

  // Handle wake word detection
  socket.on('wake-word-detected', () => {
    console.log('Wake word "Hey Hexpert" detected');
    // TODO: Prepare for incoming question
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clean up client audio buffer
    clientAudioBuffers.delete(socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Hexpert server running on port ${PORT}`);
});