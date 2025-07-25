// frontend/components/chat/Message/StreamingMessage.js
import React, { useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import MessageContent from './MessageContent';

const StreamingMessage = ({ 
  content, 
  aiType, 
  timestamp,
  parsedContent,
  isComplete,
  onContentUpdate 
}) => {
  const messageRef = useRef(null);
  const lastStreamTime = useRef(Date.now());
  const streamBuffer = useRef('');

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [content]);

const aiAvatarMapping = {
  wayneAI: { initial: 'W', name: 'Wayne AI' },
  consultingAI: { initial: 'C', name: 'Consulting AI' },
  taxAI: { initial: 'T', name: 'Tax AI' },
};

// 기본값을 'Wayne AI'로 설정
const { initial, name } = aiAvatarMapping[aiType] || { initial: 'W', name: 'Wayne AI' };

return (
  <div className="message-wrapper ai-message">
    <div className="message-content">
      <div className="profile-image">
        <div className={`avatar ${!isComplete ? 'typing' : ''}`}>{initial}</div>
      </div>
      <div className="message-bubble-container">
        <div className="sender-name">
          {name}
          {!isComplete && (
            <div className="typing-indicator">
              <Timer className="animate-pulse" size={16} />
              <div className="dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};