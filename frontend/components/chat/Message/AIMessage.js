import React, { useState } from 'react';
import PersistentAvatar from '../../common/PersistentAvatar';
import MessageContent from './MessageContent';
import MessageActions from './MessageActions';
import ReadStatus from '../ReadStatus';
import useTTSPlayer from '../../../hooks/useTTSPlayer';

const AIMessage = ({
  msg = {},
  isStreaming = false,
  isMine = false,
  currentUser = null,
  onReactionAdd,
  onReactionRemove,
  room = null,
  messageRef,
  socketRef
}) => {
  // TTS player hook
  const {
    isPlaying,
    isGenerating,
    audioProgress,
    togglePlayback,
    isMessagePlaying,
    isMessageGenerating,
    error: ttsError,
    stopAudio
  } = useTTSPlayer({
    socketRef,
    onError: (error) => console.error('TTS Error:', error)
  });
  const formattedTime = new Date(msg.timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\./g, '년').replace(/\s/g, ' ').replace('일 ', '일 ');

  // AI 사용자 정보 생성
  const aiUser = {
    name: msg.aiType === 'wayneAI' ? 'Wayne AI' : 'Consulting AI',
    email: msg.aiType === 'wayneAI' ? 'ai@wayne.ai' : 'ai@consulting.ai',
    avatarInitial: msg.aiType === 'wayneAI' ? 'W' : 'C'
  };

  const [buttonClicked, setButtonClicked] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [buttonLocked, setButtonLocked] = useState(false);

  // Handle TTS playback
  const handleTTSClick = React.useCallback(() => {
    if (buttonLocked || isMessageGenerating(msg._id) || isMessagePlaying(msg._id)) return;
    setButtonLocked(true);
    if (!msg.content || isStreaming) return;

    togglePlayback(msg.content, msg.aiType, msg._id);
  }, [buttonLocked, isMessageGenerating, isMessagePlaying, msg.content, msg.aiType, msg._id, isStreaming, togglePlayback]);

  // Get TTS button icon based on state
  const getTTSIcon = () => {
    const messageId = msg._id;

    if (isMessageGenerating(messageId)) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none">
            <animate attributeName="stroke-dasharray" values="0 31.416;15.708 15.708;0 31.416" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" values="0;-15.708;-31.416" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>
      );
    }

    if (isMessagePlaying(messageId)) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      );
    }

    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5,3 19,12 5,21"/>
      </svg>
    );
  };

  // Get voice name for display
  const getVoiceName = () => {
    switch (msg.aiType) {
      case 'wayneAI': return 'Shimmer';
      case 'consultingAI': return 'Onyx';
      default: return 'Echo';
    }
  };

  const renderContent = () => {
    if (isStreaming) {
      return (
        <>
          <MessageContent content={msg.content} />
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </>
      );
    }
    return <MessageContent content={msg.content} />;
  };

  // Reset buttonLocked when TTS generation and playback are both finished
  React.useEffect(() => {
    if (!isMessageGenerating(msg._id) && !isMessagePlaying(msg._id)) {
      setButtonLocked(false);
    }
  }, [isMessageGenerating(msg._id), isMessagePlaying(msg._id)]);

  return (
    <div className="message-group yours">
      <div className="message-sender-info">
        <PersistentAvatar
          user={aiUser}
          size="lg"
          showInitials={true}
        />
        <span className="sender-name">
          {aiUser.name}
        </span>
      </div>
      <div className="message-bubble message-ai last relative group">
        <div className="message-content">
          {renderContent()}
        </div>

        {!isStreaming && (
          <div className="message-footer">
            <div className="message-time mr-3">
              {formattedTime}
            </div>

            {/* TTS Playback Button */}
            <button
              onClick={handleTTSClick}
              disabled={buttonLocked || !msg.content || isStreaming || isMessageGenerating(msg._id) || isMessagePlaying(msg._id)}
              className="tts-button"
              aria-label={`${aiUser.name} 메시지 음성으로 듣기 (${getVoiceName()} 목소리)`}
              title={`${getVoiceName()} 목소리로 듣기`}
              style={{
                background: 'none',
                border: '1px solid var(--vapor-color-border)',
                borderRadius: 'var(--vapor-radius-sm)',
                padding: '4px 8px',
                cursor: buttonLocked || isMessageGenerating(msg._id) || isMessagePlaying(msg._id) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: 'var(--vapor-color-text-secondary)',
                transition: 'all 0.2s ease',
                marginRight: '8px',
                opacity: buttonLocked || isMessageGenerating(msg._id) || isMessagePlaying(msg._id) ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--vapor-color-surface-hover)';
                  e.currentTarget.style.borderColor = 'var(--vapor-color-primary)';
                  e.currentTarget.style.color = 'var(--vapor-color-primary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--vapor-color-border)';
                e.currentTarget.style.color = 'var(--vapor-color-text-secondary)';
              }}
            >
              {isMessageGenerating(msg._id) ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
              ) : (
                getTTSIcon()
              )}
            </button>

            <ReadStatus
              messageType={msg.type}
              participants={room.participants}
              readers={msg.readers}
              messageId={msg._id}
              messageRef={messageRef}
              currentUserId={currentUser.id}
              socketRef={socketRef}
            />
          </div>
        )}

        {/* Audio Progress Bar (shown when playing) */}
        {isMessagePlaying(msg._id) && audioProgress > 0 && (
          <div style={{
            width: '100%',
            height: '2px',
            backgroundColor: 'var(--vapor-color-border)',
            borderRadius: '1px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${audioProgress * 100}%`,
              height: '100%',
              backgroundColor: 'var(--vapor-color-primary)',
              transition: 'width 0.1s ease',
              borderRadius: '1px'
            }} />
          </div>
        )}

        {/* TTS Error Display */}
        {ttsError && isMessageGenerating(msg._id) && (
          <div style={{
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--vapor-radius-sm)',
            color: '#dc2626',
            fontSize: '12px'
          }}>
            ⚠️ 음성 생성 실패: {ttsError}
          </div>
        )}
      </div>

      <MessageActions
        messageId={msg._id}
        messageContent={msg.content}
        reactions={msg.reactions}
        currentUserId={currentUser?.id}
        onReactionAdd={onReactionAdd}
        onReactionRemove={onReactionRemove}
        isMine={isMine}
        room={room}
      />
    </div>
  );
};

AIMessage.defaultProps = {
  msg: {},
  isStreaming: false,
  currentUser: null,
  onReactionAdd: () => {},
  onReactionRemove: () => {},
  room: null
};

export default React.memo(AIMessage);