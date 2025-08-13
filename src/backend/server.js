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
const clientProcessingFlags = new Map();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

/**
 * Generate TTS audio from text response
 */
async function generateTTSAudio(text, socket) {
  try {
    console.log('Generating TTS for:', text.substring(0, 50) + '...');
    
    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || 'tts-1',
      voice: 'alloy', // You can change this to nova, echo, fable, onyx, or shimmer
      input: text,
      response_format: 'mp3'
    });
    
    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Create temporary file for audio
    const tempAudioPath = path.join(__dirname, `temp_tts_${socket.id}.mp3`);
    fs.writeFileSync(tempAudioPath, buffer);
    
    // Read audio file and send to client
    const audioData = fs.readFileSync(tempAudioPath);
    socket.emit('tts-audio', {
      audio: audioData.toString('base64'),
      timestamp: new Date().toISOString()
    });
    
    // Clean up temporary file
    fs.unlinkSync(tempAudioPath);
    
    console.log('TTS audio generated and sent to client');
    
  } catch (error) {
    console.error('TTS generation error:', error);
    // Don't emit error for TTS failures - text response is already sent
    console.log('TTS failed, but text response was already delivered');
  }
}

/**
 * Process transcribed question through game expert AI
 */
async function processQuestion(transcribedText, socket) {
  try {
    console.log('Processing question:', transcribedText);
    
    // Generate intelligent response using MunchkinExpert + GPT
    const response = await munchkinExpert.processQuestion(transcribedText);
    
    // Send AI response back to client immediately for fast feedback
    socket.emit('ai-response', {
      question: transcribedText,
      answer: response,
      timestamp: new Date().toISOString()
    });
    
    console.log('AI Response:', response);
    
    // Generate TTS audio in parallel (don't await to avoid blocking)
    generateTTSAudio(response, socket).catch(error => {
      console.error('Background TTS generation failed:', error);
    });
    
  } catch (error) {
    console.error('Question processing error:', error);
    socket.emit('error', { message: 'Failed to process your question' });
  }
}

/**
 * Process audio buffer through OpenAI Whisper
 */
async function transcribeAudio(audioBuffer, socket) {
  const tempFilePath = path.join(__dirname, `temp_audio_${socket.id}.webm`);
  
  try {
    // Set processing flag to prevent concurrent transcriptions
    clientProcessingFlags.set(socket.id, true);
    // Validate audio buffer
    console.log(`Processing ${audioBuffer.length} audio chunks for transcription`);
    const totalBytes = audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
    console.log(`Total audio data: ${totalBytes} bytes`);
    
    // Ensure all chunks are valid Buffers
    const validBuffers = audioBuffer.filter(chunk => Buffer.isBuffer(chunk) && chunk.length > 0);
    if (validBuffers.length === 0) {
      throw new Error('No valid audio data to process');
    }
    
    // Write audio buffer to temporary file
    const combinedBuffer = Buffer.concat(validBuffers);
    fs.writeFileSync(tempFilePath, combinedBuffer);
    
    // Verify file was created and has content
    const fileStats = fs.statSync(tempFilePath);
    console.log(`Created temporary audio file: ${fileStats.size} bytes`);
    
    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
      language: 'en'
    });
    
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
  } finally {
    // Clear processing flag
    clientProcessingFlags.set(socket.id, false);
    
    // Always clean up temporary file, regardless of success or failure
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log('Cleaned up temporary audio file');
      }
    } catch (cleanupError) {
      console.error('Failed to clean up temporary file:', cleanupError);
    }
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Initialize audio buffer and processing flag for this client
  clientAudioBuffers.set(socket.id, []);
  clientProcessingFlags.set(socket.id, false);

  // Handle audio stream from client
  socket.on('audio-stream', (audioData) => {
    console.log('Received audio data from client');
    
    // Check if already processing to prevent concurrent transcriptions
    const isProcessing = clientProcessingFlags.get(socket.id) || false;
    if (isProcessing) {
      console.log('Skipping audio chunk - transcription in progress');
      return;
    }
    
    // Get client's audio buffer
    const audioBuffer = clientAudioBuffers.get(socket.id) || [];
    
    // Ensure audioData is properly converted to Buffer
    const audioChunk = Buffer.isBuffer(audioData) ? audioData : Buffer.from(audioData);
    
    // Add new audio chunk to buffer
    audioBuffer.push(audioChunk);
    clientAudioBuffers.set(socket.id, audioBuffer);
    
    // Process transcription every 2 seconds of audio data (approximately 20 chunks at 100ms each)
    if (audioBuffer.length >= 20) {
      // Process current buffer (make a shallow copy to avoid reference issues)
      const bufferCopy = [...audioBuffer];
      
      // Clear buffer for next batch BEFORE processing to avoid race conditions
      clientAudioBuffers.set(socket.id, []);
      
      // Process the copied buffer
      transcribeAudio(bufferCopy, socket);
    }
  });

  // Handle wake word detection
  socket.on('wake-word-detected', () => {
    console.log('Wake word "Hey Hexpert" detected');
    // TODO: Prepare for incoming question
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clean up client audio buffer and processing flag
    clientAudioBuffers.delete(socket.id);
    clientProcessingFlags.delete(socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Hexpert server running on port ${PORT}`);
});