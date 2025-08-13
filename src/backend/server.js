/**
 * Hexpert Backend Server
 * Main Express server with Socket.IO for real-time audio communication
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

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

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle audio stream from client
  socket.on('audio-stream', (audioData) => {
    console.log('Received audio data from client');
    // TODO: Process audio through OpenAI Whisper
  });

  // Handle wake word detection
  socket.on('wake-word-detected', () => {
    console.log('Wake word "Hey Hexpert" detected');
    // TODO: Prepare for incoming question
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Hexpert server running on port ${PORT}`);
});