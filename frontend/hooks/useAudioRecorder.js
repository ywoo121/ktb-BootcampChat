import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

const useAudioRecorder = ({ 
  onTranscription, 
  onError, 
  socketRef,
  chunkDuration = 3000, // Send chunks every 3 seconds
  enableRealTimeTranscription = true 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const chunksRef = useRef([]);
  const sessionIdRef = useRef(null);
  const sequenceRef = useRef(0);
  const chunkIntervalRef = useRef(null);

  // Generate unique session ID for this recording session
  const generateSessionId = useCallback(() => {
    return `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Check microphone permissions
  const checkPermissions = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser');
      }

      const permission = await navigator.permissions.query({ name: 'microphone' });
      setPermissionStatus(permission.state);
      
      permission.onchange = () => {
        setPermissionStatus(permission.state);
      };

      return permission.state === 'granted';
    } catch (error) {
      console.error('Permission check error:', error);
      setPermissionStatus('denied');
      return false;
    }
  }, []);

  // Initialize audio context and analyser for visualization
  const initializeAudioVisualization = useCallback((stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (!analyserRef.current || !isRecording) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        
        setAudioLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Audio visualization init error:', error);
    }
  }, [isRecording]);

  // Send audio chunk for real-time transcription
  const sendAudioChunk = useCallback(async (audioBlob) => {
    if (!enableRealTimeTranscription || !socketRef?.current) return;

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      socketRef.current.emit('audioChunk', {
        audioData,
        sessionId: sessionIdRef.current,
        sequence: sequenceRef.current++,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Audio chunk send error:', error);
    }
  }, [enableRealTimeTranscription, socketRef]);

  // Send complete audio for final transcription
  const sendCompleteAudio = useCallback(async (audioBlob) => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'ko'); // Korean language

      const response = await axios.post('/api/audio/stt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000 // 30 second timeout
      });

      if (response.data.transcription) {
        onTranscription?.(response.data.transcription);
      }

    } catch (error) {
      console.error('Audio transcription error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Transcription failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscription, onError]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Check permissions first
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      audioStreamRef.current = stream;
      sessionIdRef.current = generateSessionId();
      sequenceRef.current = 0;
      chunksRef.current = [];

      // Initialize audio visualization
      initializeAudioVisualization(stream);

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // Send chunk for real-time transcription
          if (enableRealTimeTranscription) {
            sendAudioChunk(event.data);
          }
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        // Send complete audio for final transcription
        sendCompleteAudio(audioBlob);
        
        // Notify completion via socket
        if (socketRef?.current && sessionIdRef.current) {
          socketRef.current.emit('audioComplete', {
            sessionId: sessionIdRef.current
          });
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      // Setup chunking interval for real-time transcription
      if (enableRealTimeTranscription && chunkDuration > 0) {
        chunkIntervalRef.current = setInterval(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.requestData();
          }
        }, chunkDuration);
      }

      console.log('Recording started with session:', sessionIdRef.current);

    } catch (error) {
      console.error('Start recording error:', error);
      const errorMessage = error.message || 'Failed to start recording';
      setError(errorMessage);
      onError?.(errorMessage);
      stopRecording();
    }
  }, [
    checkPermissions, 
    generateSessionId, 
    initializeAudioVisualization, 
    sendAudioChunk, 
    sendCompleteAudio, 
    enableRealTimeTranscription, 
    chunkDuration, 
    socketRef, 
    onError
  ]);

  // Stop recording
  const stopRecording = useCallback(() => {
    try {
      setIsRecording(false);
      setAudioLevel(0);

      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Stop audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }

      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Clear intervals and animation frames
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      console.log('Recording stopped');

    } catch (error) {
      console.error('Stop recording error:', error);
    }
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    // Handle real-time transcription chunks
    const handleTranscriptionChunk = (data) => {
      if (data.sessionId === sessionIdRef.current && data.transcription) {
        onTranscription?.(data.transcription, true); // true indicates partial transcription
      }
    };

    // Handle transcription completion
    const handleTranscriptionComplete = (data) => {
      if (data.sessionId === sessionIdRef.current) {
        console.log('Transcription session completed:', data.sessionId);
      }
    };

    // Handle transcription errors
    const handleTranscriptionError = (data) => {
      if (data.sessionId === sessionIdRef.current) {
        console.error('Transcription error:', data.error);
        setError(data.error);
        onError?.(data.error);
      }
    };

    socket.on('transcriptionChunk', handleTranscriptionChunk);
    socket.on('transcriptionComplete', handleTranscriptionComplete);
    socket.on('transcriptionError', handleTranscriptionError);

    return () => {
      socket.off('transcriptionChunk', handleTranscriptionChunk);
      socket.off('transcriptionComplete', handleTranscriptionComplete);
      socket.off('transcriptionError', handleTranscriptionError);
    };
  }, [socketRef, onTranscription, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    isRecording,
    isTranscribing,
    audioLevel,
    error,
    permissionStatus,
    startRecording,
    stopRecording,
    toggleRecording,
    clearError: () => setError(null)
  };
};

export default useAudioRecorder;
