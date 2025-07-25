import React, { useState } from 'react';
import { IconButton, Tooltip } from '@vapor-ui/core';
import TranslationModal from './TranslationModal';

const TranslationButton = ({ 
  message, 
  socketRef, 
  currentRoom,
  className = ""
}) => {
  const [showTranslationModal, setShowTranslationModal] = useState(false);

  const handleTranslateClick = (e) => {
    e.stopPropagation();
    setShowTranslationModal(true);
  };

  // Don't show translation button for non-text messages or empty content
  if (!message?.content || message.type !== 'text' || message.content.trim().length === 0) {
    return null;
  }

  return (
    <>
      <Tooltip content="메시지 번역">
        <IconButton
          size="sm"
          variant="ghost"
          onClick={handleTranslateClick}
          className={`translation-button ${className}`}
          aria-label="메시지 번역"
        >
          <svg 
            width={16} 
            height={16} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
          </svg>
        </IconButton>
      </Tooltip>

      <TranslationModal
        isOpen={showTranslationModal}
        onClose={() => setShowTranslationModal(false)}
        originalText={message.content}
        messageId={message._id}
        socketRef={socketRef}
        currentRoom={currentRoom}
      />

      <style jsx>{`
        .translation-button {
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        .translation-button:hover {
          opacity: 1;
          color: #007bff;
        }

        .translation-button:focus-visible {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
};

export default TranslationButton;