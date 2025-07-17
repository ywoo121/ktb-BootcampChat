# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Prerequisites
Before running the application, ensure MongoDB and Redis are running:
```bash
# Start MongoDB
mongod --dbpath ~/data/db

# Start Redis
redis-server
```

### Quick Start
```bash
# Install all dependencies (root, frontend, and backend)
npm install

# Start both frontend and backend in development mode
npm run dev
```

### All Available Commands
```bash
# Development
npm run dev              # Start both frontend and backend in dev mode
npm run dev:backend      # Start only backend in dev mode
npm run dev:frontend     # Start only frontend in dev mode

# Production
npm start                # Start both frontend and backend in production
npm run build            # Build frontend for production

# Installation
npm install              # Install all dependencies
npm run install:backend  # Install only backend dependencies
npm run install:frontend # Install only frontend dependencies

# Testing
npm test                 # Run E2E tests
```

### E2E Testing
```bash
cd e2e
npm install             # Install test dependencies
npm test               # Run all E2E tests
npm run test:headed    # Run tests with browser visible
npm run test:ui        # Open Playwright UI mode
npm run report         # Show test report
```

## Architecture Overview

### Full-Stack Real-Time Chat Application

This is a real-time chat application built with:
- **Frontend**: Next.js with React, Socket.IO client, and Vapor UI components
- **Backend**: Node.js/Express with Socket.IO, JWT authentication
- **Database**: MongoDB for persistent storage, Redis for session management
- **Real-time**: Socket.IO for bidirectional communication

### Key Components

#### Backend Structure (`/backend`)
- **Controllers**: Handle HTTP requests for auth, users, rooms, messages, files, and AI
- **Models**: Mongoose schemas for User, Room, Message, File, and AI profiles
- **Middleware**: Authentication (JWT), file upload (Multer), validation
- **Routes**: RESTful API endpoints organized by resource type
- **Services**: Business logic for AI integration, file handling, sessions
- **Sockets**: Real-time chat event handlers
- **Utils**: Encryption, Redis client, queue management

#### Frontend Structure (`/frontend`)
- **Pages**: Next.js page components for routing (login, register, chat, profile)
- **Components**: Reusable UI components, especially chat-related components
- **Hooks**: Custom React hooks for chat room management, message handling, file uploads
- **Services**: API clients for authentication, file operations, Socket.IO connection
- **Styles**: Global CSS with Bootstrap and Vapor design system

### Real-Time Communication Flow

1. **Authentication**: Users authenticate via JWT tokens stored in localStorage
2. **Socket Connection**: After login, client establishes Socket.IO connection with auth token
3. **Room Management**: Users can create/join rooms (with optional passwords)
4. **Message Flow**: 
   - Client emits message events to server
   - Server validates, stores in MongoDB, and broadcasts to room participants
   - Messages support markdown, mentions (@user), emojis, and file attachments
5. **AI Integration**: Messages mentioning @wayneAI or @consultingAI trigger AI responses

### Security Features
- Password hashing with bcrypt
- JWT-based authentication
- Message encryption (client-side with shared keys)
- File upload validation and size limits
- Rate limiting and input validation

### File Handling
- Supports images (jpg, png, gif), videos (mp4, webm), audio (mp3, wav), and PDFs
- Files stored in `/backend/uploads` with unique naming
- Size limits: Images 10MB, Videos 50MB, Audio/PDF 20MB
- Client-side preview for all supported formats

### Environment Configuration
Required environment variables:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT signing
- `REDIS_HOST/PORT`: Redis connection details
- `OPENAI_API_KEY`: For AI chat features
- `ENCRYPTION_KEY`: For message encryption
- `PASSWORD_SALT`: For additional password security
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontend

### Development Tips
- Use PM2 for process management (already configured in run.sh)
- MongoDB runs on port 27017, Redis on 6379, Backend on 5000, Frontend on 3000
- Check logs in `/logs` directory for debugging
- E2E tests cover auth, messaging, file uploads, AI interactions, and real-time features