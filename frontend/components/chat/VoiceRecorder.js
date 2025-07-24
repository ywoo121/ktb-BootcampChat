import React, { useState, useRef, useEffect } from 'react';
// 올바른 아이콘 이름들로 수정
import { 
  // MicrophoneIcon 대신 사용 가능한 아이콘들
  VolumeUpIcon,
  StopOutlineIcon, 
  PlayOutlineIcon 
} from '@vapor-ui/icons';
import { Button, Text } from '@vapor-ui/core';
import sttService from '../../services/sttService';

const VoiceRecorder = ({ 
  onTranscription, 
  onError, 
  disabled = false,
  className = '',
  language = 'ko' 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // 녹음 시간 업데이트
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // 녹음 시작
  const startRecording = async () => {
    try {
      setRecordingTime(0);
      await sttService.startRecording({
        sampleRate: 44100,
        channelCount: 1,
        audioBitsPerSecond: 128000,
        timeslice: 100 // 더 작은 간격으로 데이터 수집 (품질 향상)
      });
      setIsRecording(true);
      setAudioBlob(null);
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      onError?.(error.message);
    }
  };

  // 녹음 중지
  const stopRecording = async () => {
    try {
      const blob = await sttService.stopRecording();
      setIsRecording(false);
      setAudioBlob(blob);
      
      // 자동으로 변환 시작
      await transcribeAudio(blob);
    } catch (error) {
      console.error('녹음 중지 실패:', error);
      setIsRecording(false);
      onError?.(error.message);
    }
  };

  // 음성을 텍스트로 변환
  const transcribeAudio = async (blob = audioBlob) => {
    if (!blob) return;

    try {
      setIsProcessing(true);
      
      // 더 포괄적인 한국어 채팅 프롬프트
      const comprehensiveChatPrompt = [
        // 기본 인사 및 예의
        "안녕하세요", "안녕", "반갑습니다", "수고하세요", "감사합니다", "고마워요", "죄송합니다", "미안해요",
        
        // 일반적인 대화
        "네", "아니요", "맞아요", "그렇죠", "좋아요", "괜찮아요", "알겠습니다", "그래요", "정말요",
        
        // 업무/개발 관련
        "프로젝트", "개발", "코딩", "프로그래밍", "회의", "업무", "작업", "완료했습니다", "확인해주세요",
        
        // 질문/요청
        "어떻게 해야 하나요", "도움이 필요해요", "질문이 있어요", "설명해주세요", "알려주세요"
      ].join(", ");
      
      const text = await sttService.transcribeAudio(blob, {
        language: language,
        temperature: 0, // 최대 정확도
        prompt: comprehensiveChatPrompt
      });
      
      if (text.trim()) {
        onTranscription?.(text.trim());
      } else {
        onError?.('음성을 인식할 수 없습니다. 더 명확하게 말씀해주세요.');
      }
    } catch (error) {
      console.error('음성 변환 실패:', error);
      onError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 녹음된 음성 재생
  const playRecording = () => {
    if (!audioBlob || isPlaying) return;

    const audio = new Audio(URL.createObjectURL(audioBlob));
    audioRef.current = audio;
    
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(audio.src);
    };
    audio.onerror = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(audio.src);
      onError?.('음성 재생 중 오류가 발생했습니다.');
    };

    audio.play().catch(error => {
      console.error('음성 재생 실패:', error);
      setIsPlaying(false);
      onError?.('음성을 재생할 수 없습니다.');
    });
  };

  // 녹음 취소
  const cancelRecording = () => {
    if (isRecording) {
      sttService.cancelRecording();
      setIsRecording(false);
    }
    setRecordingTime(0);
    setAudioBlob(null);
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG 아이콘 컴포넌트들
  const MicIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14S15 12.66 15 11V5C15 3.34 13.66 2 12 2ZM19 11C19 14.53 16.39 17.44 13 17.93V21H11V17.93C7.61 17.44 5 14.53 5 11H7C7 13.76 9.24 16 12 16S17 13.76 17 11H19Z"/>
    </svg>
  );

  const StopIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6H18V18H6V6Z"/>
    </svg>
  );

  const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5V19L19 12L8 5Z"/>
    </svg>
  );

  return (
    <div className={`voice-recorder ${className}`}>
      <div className="voice-recorder-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isRecording && !audioBlob && (
          <Button
            variant="ghost"
            size="sm"
            onClick={startRecording}
            disabled={disabled || isProcessing}
            style={{
              color: 'var(--vapor-color-primary)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              padding: 0
            }}
            title="음성 녹음 시작"
          >
            <MicIcon />
          </Button>
        )}

        {isRecording && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={stopRecording}
              style={{
                color: 'var(--vapor-color-danger)',
                borderColor: 'var(--vapor-color-danger)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                padding: 0,
                animation: 'pulse 1.5s infinite'
              }}
              title="녹음 중지"
            >
              <StopIcon />
            </Button>
            
            <Text typography="caption" style={{ color: 'var(--vapor-color-danger)', fontWeight: 'bold' }}>
              {formatTime(recordingTime)}
            </Text>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelRecording}
              style={{ fontSize: '0.75rem' }}
            >
              취소
            </Button>
          </>
        )}

        {audioBlob && !isRecording && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={playRecording}
              disabled={isPlaying || isProcessing}
              style={{
                color: 'var(--vapor-color-success)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                padding: 0
              }}
              title="녹음된 음성 재생"
            >
              <PlayIcon />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => transcribeAudio()}
              disabled={isProcessing}
              style={{ fontSize: '0.75rem' }}
            >
              {isProcessing ? '변환 중...' : '다시 변환'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAudioBlob(null);
                setRecordingTime(0);
              }}
              style={{ fontSize: '0.75rem' }}
            >
              삭제
            </Button>
          </>
        )}

        {isProcessing && (
          <Text typography="caption" style={{ color: 'var(--vapor-color-primary)' }}>
            음성을 텍스트로 변환 중...
          </Text>
        )}
        
        {!isRecording && !audioBlob && !isProcessing && (
          <Text typography="caption" style={{ color: 'var(--vapor-color-text-muted)', fontSize: '0.7rem' }}>
            💡 팁: 명확하고 천천히 말씀해주세요
          </Text>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .voice-recorder {
          background: var(--vapor-color-gray-50);
          border-radius: 8px;
          padding: 8px;
          border: 1px solid var(--vapor-color-gray-200);
        }
        
        .voice-recorder-controls {
          min-height: 40px;
        }
      `}</style>
    </div>
  );
};

export default VoiceRecorder;
