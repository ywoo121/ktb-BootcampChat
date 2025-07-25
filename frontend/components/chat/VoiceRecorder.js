import React from 'react';
import { IconButton } from '@vapor-ui/core';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import { Toast } from '../../components/Toast';

const VoiceRecorder = ({
  onTranscription,
  onError,
  socketRef,
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const {
    isRecording,
    isTranscribing,
    audioLevel,
    error,
    permissionStatus,
    toggleRecording,
    clearError
  } = useAudioRecorder({
    onTranscription,
    onError,
    socketRef,
    enableRealTimeTranscription: true
  });

  const [showPermissionButton, setShowPermissionButton] = React.useState(false);

  // Handle transcription callback
  const handleTranscription = React.useCallback((text, isPartial = false) => {
    if (text && text.trim()) {
      onTranscription?.(text.trim(), isPartial);
    }
  }, [onTranscription]);

  // Handle error callback
  const handleError = React.useCallback((errorMessage) => {
    console.error('Voice recording error:', errorMessage);
    onError?.(errorMessage);
    clearError();
  }, [onError, clearError]);

  // Update the hooks with the callbacks
  React.useEffect(() => {
    // This ensures the hooks get the latest callbacks
  }, [handleTranscription, handleError]);

  // Determine button state and styling
  const getButtonProps = () => {
    if (disabled) {
      return {
        variant: 'ghost',
        disabled: true,
        'aria-label': '음성 입력 비활성화됨'
      };
    }

    if (isRecording) {
      return {
        variant: 'filled',
        color: 'danger',
        'aria-label': '녹음 중지하기',
        style: {
          backgroundColor: '#ff4444',
          animation: 'pulse 1.5s infinite'
        }
      };
    }

    if (isTranscribing) {
      return {
        variant: 'filled',
        color: 'primary',
        disabled: true,
        'aria-label': '음성 변환 중...'
      };
    }

    if (permissionStatus === 'denied') {
      return {
        variant: 'ghost',
        color: 'neutral',
        disabled: true,
        'aria-label': '마이크 권한이 거부됨'
      };
    }

    return {
      variant: 'ghost',
      color: 'neutral',
      'aria-label': '음성 입력 시작하기'
    };
  };

  // Get microphone icon based on state
  const getMicIcon = () => {
    if (isRecording) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
        </svg>
      );
    }

    if (isTranscribing) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          <circle cx="12" cy="8" r="2" fill="currentColor">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </svg>
      );
    }

    if (permissionStatus === 'denied') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    }

    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    );
  };

  // Handle click
  const handleClick = () => {
    if (disabled || isTranscribing) return;

    if (permissionStatus === 'denied') {
      Toast.error('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      onError?.('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      setShowPermissionButton(true);
      return;
    }

    toggleRecording();
  };

  const handleRequestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      Toast.success('마이크 권한이 허용되었습니다!');
      setShowPermissionButton(false);
    } catch (err) {
      Toast.error('마이크 권한 요청이 거부되었습니다. 브라우저 설정을 확인하세요.');
      setShowPermissionButton(true);
    }
  };

  const buttonProps = getButtonProps();

  return (
    <div className={`voice-recorder ${className}`}>
      {showPermissionButton && (
        <button
          onClick={handleRequestMicPermission}
          style={{
            marginBottom: 8,
            padding: '6px 12px',
            background: '#f59e42',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          마이크 권한 요청하기
        </button>
      )}
      <IconButton
        {...buttonProps}
        size={size}
        onClick={handleClick}
        style={{
          position: 'relative',
          transition: 'all 0.2s ease',
          ...buttonProps.style
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isRecording) {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isRecording) {
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <span style={{ position: 'relative', display: 'inline-block' }}>
          {getMicIcon()}
          {/* Audio level indicator */}
          {isRecording && audioLevel > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: `${20 + audioLevel * 10}px`,
                height: `${20 + audioLevel * 10}px`,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 68, 68, 0.3)',
                animation: 'pulse 0.5s infinite',
                pointerEvents: 'none',
                zIndex: -1
              }}
            />
          )}
          {/* Recording indicator */}
          {isRecording && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '12px',
                height: '12px',
                backgroundColor: '#ff4444',
                borderRadius: '50%',
                animation: 'blink 1s infinite'
              }}
            />
          )}
          {/* Transcribing indicator */}
          {isTranscribing && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '12px',
                height: '12px',
                backgroundColor: '#0066cc',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }}
            />
          )}
        </span>
      </IconButton>

      {/* Error indicator */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            marginTop: '4px'
          }}
        >
          {error}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .voice-recorder {
          position: relative;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default React.memo(VoiceRecorder);