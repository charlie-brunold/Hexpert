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
  - GPT-4o/GPT-3.5-Turbo for intelligent response generation
  - TTS-1 for text-to-speech synthesis

## Development Philosophy

- **Depth over breadth**: Prioritize pristine functionality over feature quantity
- **Incremental development**: Build slowly and methodically, one feature at a time
- **High code quality**: Maintain clean, well-organized, and well-commented code
- **Diagnostic-friendly**: Structure code to enable easy problem diagnosis and debugging

## Game-Specific Architecture

The codebase is designed with a modular game system in mind:
- Game-specific rules and knowledge should be isolated into separate modules so that a user can select between numerous AI agents, each adept at a specific game
- The core voice interaction system should remain game-agnostic
- Initial development focus is Munchkin expertise, but architecture supports future game additions

## Audio Processing Pipeline

The application handles real-time audio streaming:
1. Frontend captures microphone input via Web Audio API
2. Audio streams to backend via Socket.IO
3. Backend processes audio through OpenAI Whisper
4. Generated responses flow back through TTS-1
5. Audio response streams back to frontend for playback

## Wake Word Detection

The system responds to "Hey Hexpert" as the activation phrase before processing user questions about gameplay rules.