# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hexpert is a voice-based AI agent web application that teaches board game rules and answers gameplay questions. The initial implementation focuses on Steve Jackson Games' Munchkin, with architecture designed for future expansion to additional games.

## Architecture

The application follows a real-time, voice-first architecture:

- **Frontend**: Vanilla JavaScript using Web Audio API for microphone capture and audio playback
- **Backend**: Node.js with Express for API endpoints and business logic
- **Real-time Communication**: Socket.IO for bidirectional audio streaming between client and server
- **AI Services**: OpenAI API integration for the complete voice pipeline:
  - Whisper for speech-to-text transcription
  - GPT-3.5-Turbo for intelligent response generation
  - TTS-1 for text-to-speech synthesis

## Development Philosophy

- **Depth over breadth**: Prioritize pristine functionality over feature quantity
- **Incremental development**: Build slowly and methodically, one feature at a time
- **High code quality**: Maintain clean, well-organized, and well-commented code. Always add a 'TODO' comment when you decide to leave a feature implementation for later.
  - Always add a 'TODO' comment when you decide to leave a feature implementation for later.
- **Diagnostic-friendly**: Structure code to enable easy problem diagnosis and debugging

## Game-Specific Architecture

The codebase is designed with a modular game system in mind:
- Game-specific rules and knowledge should be isolated into separate modules so that a user can select between numerous AI agents, each adept at a specific game
- The core voice interaction system should remain game-agnostic
- Initial development focus is Munchkin expertise, but architecture supports future game additions

## Audio Processing Pipeline

The application handles real-time audio streaming:
1. Frontend captures microphone input via Web Audio API (100ms chunks)
2. Audio streams to backend via Socket.IO in real-time
3. ✅ Backend buffers audio chunks and processes through OpenAI Whisper every 2 seconds
4. ✅ Transcribed text is sent back to frontend and displayed in transcript area
5. ✅ **NEW**: Transcribed questions processed through MunchkinExpert + GPT for intelligent responses
6. ✅ **NEW**: AI responses displayed in frontend with conversation formatting
7. TODO: Generated responses flow back through TTS-1
8. TODO: Audio response streams back to frontend for playback

## Wake Word Detection

The system responds to "Hey Hexpert" as the activation phrase before processing user questions about gameplay rules.

## Project Structure

```
Hexpert/
├── CLAUDE.md                    # This file - Claude agent guidance
├── README.md                    # Project documentation
├── package.json                 # Node.js dependencies and scripts
├── .env.example                 # Environment variables template
├── public/                      # Frontend static files (served by Express)
│   ├── index.html              # Main UI with game selector and audio controls
│   ├── app.js                  # Main frontend app class (HexpertApp)
│   ├── audio-handler.js        # Audio capture and streaming (AudioHandler)
│   └── styles.css              # UI styling
└── src/
    ├── backend/
    │   └── server.js           # Express server with Socket.IO (main entry point)
    ├── frontend/               # Future frontend modules (currently unused)
    └── games/
        └── munchkin.js         # Munchkin-specific game logic (MunchkinExpert class)
```

## Key Dependencies

- **express**: Web server framework
- **socket.io**: Real-time bidirectional communication
- **openai**: OpenAI API client for Whisper/GPT/TTS
- **dotenv**: Environment variable management
- **cors**: Cross-origin request handling
- **nodemon**: Development auto-restart (dev dependency)

## Development Commands

- `npm start`: Run production server
- `npm run dev`: Run development server with auto-restart
- `npm test`: No tests configured yet

## Environment Setup

1. Copy `.env.example` to `.env`
2. Add your OpenAI API key
3. Configure optional model preferences (defaults: gpt-3.5-turbo, whisper-1, tts-1)
4. Run `npm install` to install dependencies
5. Run `npm run dev` for development

## Core Classes and Architecture

### Backend (`src/backend/server.js`)
- Express server serving static files from `public/`
- Socket.IO server handling real-time audio streaming
- ✅ OpenAI Whisper integration implemented for speech-to-text transcription
- Real-time audio buffer management with 2-second processing windows
- Automatic temporary file handling and cleanup for Whisper API
- ✅ **NEW**: OpenAI GPT integration for intelligent responses via MunchkinExpert
- ✅ **NEW**: Question processing pipeline that triggers after transcription
- ✅ **NEW**: AI response generation and socket emission to frontend
- TODO: Integrate OpenAI TTS for voice responses

### Frontend Classes
- **HexpertApp** (`public/app.js`): Main application coordinator, handles UI interactions and socket communication
- ✅ **NEW**: AI response display with conversation formatting and timestamps
- ✅ **NEW**: Enhanced transcript display showing "You:" vs "Hexpert:" responses
- **AudioHandler** (`public/audio-handler.js`): Manages microphone access, audio streaming via Socket.IO, and wake word detection

### Game System
- **MunchkinExpert** (`src/games/munchkin.js`): Comprehensive Munchkin rules knowledge base with GPT-powered question processing
- ✅ **NEW**: OpenAI GPT integration with specialized Munchkin system prompt
- ✅ **NEW**: Intelligent rule interpretation and conversational responses
- ✅ **NEW**: Fallback to keyword-based processing if GPT fails
- Modular design allows easy addition of new game experts

## Current Implementation Status

### ✅ Completed
- Project structure and dependencies
- Basic Express server with Socket.IO
- Frontend UI with game selector and audio controls
- Audio capture and streaming infrastructure
- Comprehensive Munchkin rules knowledge base
- **OpenAI Whisper integration for speech-to-text transcription**
- **Real-time audio processing pipeline with buffering and cleanup**
- **Environment variable configuration and OpenAI client setup**
- ✅ **NEW**: **OpenAI GPT integration for intelligent Munchkin rule responses**
- ✅ **NEW**: **Complete voice-to-text-to-AI-response pipeline**
- ✅ **NEW**: **MunchkinExpert enhanced with GPT-powered question processing**
- ✅ **NEW**: **Frontend conversation display with AI responses**
- ✅ **NEW**: **Error handling and fallback systems for AI processing**

### 🔄 In Progress / TODO
- OpenAI TTS integration for voice responses
- Wake word detection implementation
- Audio response streaming back to frontend
- Test coverage

## Debugging and Diagnostics

### Server-side Debugging
- Server logs socket connections/disconnections
- Audio stream reception is logged
- ✅ Whisper transcription results are logged to console
- ✅ Audio buffer management and processing timing logged
- ✅ OpenAI API errors are caught and logged
- ✅ **NEW**: Question processing and GPT response generation logged
- ✅ **NEW**: AI response content logged for debugging
- Wake word detection events are logged
- Run with `npm run dev` for auto-restart during development

### Frontend Debugging
- Connection status displayed in UI
- Listening status displayed in UI
- ✅ Transcript output area displays real-time speech-to-text results
- ✅ **NEW**: AI responses displayed with conversation formatting and styling
- ✅ **NEW**: Conversation flow shows both user questions and Hexpert responses
- ✅ Error messages displayed in transcript area for API failures
- Browser console logs audio events and socket communication
- ✅ **NEW**: AI response data logged to browser console

### Common Issues
- Microphone permissions: Ensure HTTPS in production or localhost for development
- CORS issues: Server configured to allow all origins during development
- Socket.IO connection: Check browser console for connection errors
- ✅ Audio transcription: WebM audio files are temporarily created and cleaned up automatically