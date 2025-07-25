import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/authService'; // or wherever your authService is

const useTTSPlayer = ({ socketRef, onError }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const playedMessagesRef = useRef(new Set());

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  // Initialize Web Audio API for better control
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  }, []);

  // Stop current audio playback
  const stopAudio = useCallback((onStopped) => {
    try {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setIsPlaying(false);
      setCurrentMessageId(null);
      setAudioProgress(0);
      if (currentMessageId) {
        playedMessagesRef.current.delete(currentMessageId);
      }
      if (onStopped) onStopped();
    } catch (error) {
      console.error('Stop audio error:', error);
    }
  }, []);

  // Play audio from buffer
  const playAudioBuffer = useCallback(async (audioBuffer, messageId) => {
    try {
      initializeAudioContext();

      // Stop any currently playing audio
      stopAudio();

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      if (!gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }
      source.connect(gainNodeRef.current);

      sourceRef.current = source;
      setCurrentMessageId(messageId);
      setIsPlaying(true);
      setAudioProgress(0);

      // Start progress tracking
      const duration = audioBuffer.duration;
      const startTime = audioContextRef.current.currentTime;

      progressIntervalRef.current = setInterval(() => {
        const elapsed = audioContextRef.current.currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAudioProgress(progress);

        if (progress >= 1) {
          clearInterval(progressIntervalRef.current);
          setIsPlaying(false);
          setCurrentMessageId(null);
          setAudioProgress(0);
        }
      }, 100);

      // Handle audio end
      source.onended = () => {
        setIsPlaying(false);
        setCurrentMessageId(null);
        setAudioProgress(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };

      source.start();

    } catch (error) {
      console.error('Audio playback error:', error);
      setError('Audio playback failed');
      onError?.('Audio playback failed');
      setIsPlaying(false);
      setCurrentMessageId(null);
    }
  }, [initializeAudioContext, onError, stopAudio]);

  // Fallback to HTTP API for TTS
  const fallbackToHttpTTS = useCallback(async (text, aiType, messageId) => {
    try {
      setIsGenerating(true);

      // Get auth headers
      const user = authService.getCurrentUser();
      const headers = {
        'Content-Type': 'application/json',
        ...(user?.token && { 'x-auth-token': user.token }),
        ...(user?.sessionId && { 'x-session-id': user.sessionId }),
      };

      const response = await axios.post(`${API_BASE_URL}/api/audio/tts/stream`, {
        text,
        aiType
      }, {
        responseType: 'arraybuffer',
        timeout: 300000, // 5 minute timeout
        headers,
      });

      initializeAudioContext();
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioBuffer = await audioContextRef.current.decodeAudioData(response.data);
      await playAudioBuffer(audioBuffer, messageId);

    } catch (error) {
      console.error('HTTP TTS fallback error:', error);
      setError('TTS generation failed');
      onError?.('TTS generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [initializeAudioContext, playAudioBuffer, onError, API_BASE_URL]);

  // Play TTS via API call
  const playTTS = useCallback(async (text, aiType, messageId) => {
    if (playedMessagesRef.current.has(messageId)) return;
    playedMessagesRef.current.add(messageId);
    try {
      setError(null);
      setIsGenerating(true);

      // First try to get cached audio via socket
      if (socketRef?.current) {
        socketRef.current.emit('requestTTS', {
          messageId,
          text,
          aiType
        });

        // Set a timeout for socket response
        const socketTimeout = setTimeout(() => {
          // If socket doesn't respond in 2 seconds, fall back to HTTP API
          fallbackToHttpTTS(text, aiType, messageId);
        }, 2000);

        // Store timeout reference to clear it if socket responds
        const originalTimeout = socketTimeout;

        // Listen for socket TTS response
        const handleTTSReady = (data) => {
          if (data.messageId === messageId) {
            clearTimeout(originalTimeout);
            setIsGenerating(false);

            try {
              // Convert base64 to audio buffer
              const binaryString = atob(data.audioData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
              }
              audioContextRef.current.decodeAudioData(bytes.buffer)
                .then(audioBuffer => {
                  playAudioBuffer(audioBuffer, messageId);
                })
                .catch(error => {
                  console.error('Audio decode error:', error);
                  fallbackToHttpTTS(text, aiType, messageId);
                });

            } catch (error) {
              console.error('TTS data processing error:', error);
              fallbackToHttpTTS(text, aiType, messageId);
            }

            socketRef.current.off('ttsReady', handleTTSReady);
          }
        };

        const handleTTSError = (data) => {
          if (data.messageId === messageId) {
            clearTimeout(originalTimeout);
            console.error('Socket TTS error:', data.error);
            fallbackToHttpTTS(text, aiType, messageId);
            socketRef.current.off('ttsError', handleTTSError);
          }
        };

        socketRef.current.on('ttsReady', handleTTSReady);
        socketRef.current.on('ttsError', handleTTSError);

      } else {
        // No socket connection, use HTTP API directly
        await fallbackToHttpTTS(text, aiType, messageId);
      }

    } catch (error) {
      console.error('TTS request error:', error);
      setError('TTS generation failed');
      onError?.('TTS generation failed');
      setIsGenerating(false);
    }
  }, [socketRef, onError, playAudioBuffer, fallbackToHttpTTS]);

  // Set volume
  const setVolume = useCallback((volume) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = Math.max(0, Math.min(1, volume));
    }
  }, []);

  // Check if message is currently playing
  const isMessagePlaying = useCallback((messageId) => {
    return isPlaying && currentMessageId === messageId;
  }, [isPlaying, currentMessageId]);

  // Check if message is currently generating
  const isMessageGenerating = useCallback((messageId) => {
    return isGenerating && currentMessageId === messageId;
  }, [isGenerating, currentMessageId]);

  // Toggle play/pause for a specific message
  const togglePlayback = useCallback((text, aiType, messageId) => {
    if (isMessagePlaying(messageId)) {
      stopAudio();
    } else {
      playTTS(text, aiType, messageId);
    }
  }, [isMessagePlaying, stopAudio, playTTS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      playedMessagesRef.current.clear();
    };
  }, [stopAudio]);

  return {
    isPlaying,
    isGenerating,
    error,
    currentMessageId,
    audioProgress,
    playTTS,
    stopAudio,
    setVolume,
    togglePlayback,
    isMessagePlaying,
    isMessageGenerating,
    clearError: () => setError(null)
  };
};

export default useTTSPlayer;
