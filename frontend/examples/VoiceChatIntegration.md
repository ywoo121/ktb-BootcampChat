# Voice Chat Integration Guide

This guide shows how to integrate the new voice features into your existing chat implementation.

## 1. Update Your Chat Page Component

Here's how to modify your existing chat page to include voice features:

```jsx
// pages/chat.js or your main chat component
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import ChatInput from '../components/chat/ChatInput';
import ChatMessages from '../components/chat/ChatMessages';
import { useAuth } from '../hooks/useAuth';

const ChatPage = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  
  // Voice-related states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) return;

    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: {
        token,
        sessionId: user.sessionId
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, token]);

  // Handle message submission (supports both text and voice-transcribed messages)
  const handleMessageSubmit = async (messageData) => {
    if (!socketRef.current || !room) return;

    try {
      socketRef.current.emit('chatMessage', {
        room: room._id,
        type: messageData.type,
        content: messageData.content,
        fileData: messageData.fileData
      });
    } catch (error) {
      console.error('Message send error:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>{room?.name || 'Chat Room'}</h2>
      </div>

      <div className="chat-messages">
        <ChatMessages
          messages={messages}
          currentUser={user}
          room={room}
          socketRef={socketRef}
          onReactionAdd={(messageId, reaction) => {
            socketRef.current?.emit('messageReaction', {
              messageId,
              reaction,
              type: 'add'
            });
          }}
          onReactionRemove={(messageId, reaction) => {
            socketRef.current?.emit('messageReaction', {
              messageId,
              reaction,
              type: 'remove'
            });
          }}
        />
      </div>

      <div className="chat-input-container">
        <ChatInput
          message={message}
          onMessageChange={(e) => setMessage(e.target.value)}
          onSubmit={handleMessageSubmit}
          setMessage={setMessage}
          room={room}
          socketRef={socketRef} // Pass socket reference for voice features
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          showMentionList={showMentionList}
          setShowMentionList={setShowMentionList}
          mentionFilter={mentionFilter}
          setMentionFilter={setMentionFilter}
          mentionIndex={mentionIndex}
          setMentionIndex={setMentionIndex}
          getFilteredParticipants={(room) => {
            // Your existing participant filtering logic
            return room?.participants || [];
          }}
        />
      </div>
    </div>
  );
};

export default ChatPage;
```

## 2. Voice Feature Usage

### Speech-to-Text (STT)
- Click the 🎤 button on the left side of the chat input
- Speak your message
- The transcription will automatically appear in the input field
- Send the message as normal

### Text-to-Speech (TTS)
- AI messages will show a 🔊 button after completion
- Click the button to hear the AI response in the assigned voice:
  - Wayne AI → Shimmer voice (professional, clear)
  - Consulting AI → Onyx voice (motivational, energetic)
- Audio progress is shown during playback
- Click again to stop playback

## 3. Voice Configuration

### Backend Environment Variables
Make sure your backend `.env` includes:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Voice Mapping
The system automatically maps AI types to voices:
- `wayneAI` → `shimmer`
- `consultingAI` → `onyx`
- `default` → `echo`

## 4. Error Handling

Voice features include comprehensive error handling:
- Microphone permission denied
- Network issues during transcription
- TTS generation failures
- Audio playback errors

Errors are displayed as non-intrusive notifications that auto-dismiss.

## 5. Browser Compatibility

Voice features work in modern browsers that support:
- MediaRecorder API (for recording)
- Web Audio API (for playback)
- getUserMedia (for microphone access)

Fallbacks are provided for unsupported browsers.

## 6. Performance Considerations

- Audio chunks are sent every 3 seconds for real-time transcription
- TTS audio is cached and streamed for low latency
- WebRTC is used for optimal audio quality
- Automatic audio compression reduces bandwidth usage

## 7. Accessibility

- All voice controls include proper ARIA labels
- Keyboard navigation support
- Screen reader compatible
- Visual indicators for audio states

## 8. Customization

You can customize voice behavior by modifying:
- `chunkDuration` in `useAudioRecorder` hook
- Voice assignments in `backend/services/audioService.js`
- UI styling in the voice components
- Error message content and display duration
