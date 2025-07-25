import React, { useState, useEffect } from 'react';
import { Modal, Button, Select, Text, Spinner } from '@vapor-ui/core';
import translationService from '../../services/translationService';

const TranslationModal = ({ 
  isOpen, 
  onClose, 
  originalText, 
  messageId,
  socketRef,
  currentRoom
}) => {
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [supportedLanguages, setSupportedLanguages] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [streamingTranslation, setStreamingTranslation] = useState('');
  const [error, setError] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');

  // Load supported languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      const result = await translationService.getSupportedLanguages();
      if (result.success) {
        setSupportedLanguages(result.languages);
      }
    };
    loadLanguages();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socketRef?.current || !isOpen) return;

    const socket = socketRef.current;

    const handleTranslationStart = (data) => {
      if (data.messageId === messageId) {
        setIsTranslating(true);
        setStreamingTranslation('');
        setError('');
      }
    };

    const handleTranslationChunk = (data) => {
      if (data.messageId === messageId) {
        setStreamingTranslation(prev => prev + data.chunk);
      }
    };

    const handleTranslationComplete = (data) => {
      if (data.messageId === messageId) {
        setIsTranslating(false);
        setTranslationResult(data);
        setStreamingTranslation('');
      }
    };

    const handleTranslationError = (data) => {
      if (data.messageId === messageId) {
        setIsTranslating(false);
        setError(data.error);
        setStreamingTranslation('');
      }
    };

    const handleLanguageDetected = (data) => {
      if (data.messageId === messageId) {
        setDetectedLanguage(data.languageName);
      }
    };

    socket.on('translationStart', handleTranslationStart);
    socket.on('translationChunk', handleTranslationChunk);
    socket.on('translationComplete', handleTranslationComplete);
    socket.on('translationError', handleTranslationError);
    socket.on('languageDetected', handleLanguageDetected);

    // Detect language when modal opens
    if (originalText && !detectedLanguage) {
      socket.emit('detectLanguage', {
        text: originalText,
        messageId
      });
    }

    return () => {
      socket.off('translationStart', handleTranslationStart);
      socket.off('translationChunk', handleTranslationChunk);
      socket.off('translationComplete', handleTranslationComplete);
      socket.off('translationError', handleTranslationError);
      socket.off('languageDetected', handleLanguageDetected);
    };
  }, [socketRef, isOpen, messageId, originalText, detectedLanguage]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTranslationResult(null);
      setStreamingTranslation('');
      setError('');
      setDetectedLanguage('');
      setIsTranslating(false);
    }
  }, [isOpen]);

  const handleTranslate = () => {
    if (!socketRef?.current || !originalText || !targetLanguage || !currentRoom) {
      setError('Invalid parameters for translation');
      return;
    }

    socketRef.current.emit('translateMessage', {
      messageId,
      text: originalText,
      targetLang: targetLanguage,
      roomId: currentRoom._id
    });
  };

  const languageOptions = Object.entries(supportedLanguages).map(([code, name]) => ({
    value: code,
    label: name
  }));

  return (
    <Modal.Root open={isOpen} onOpenChange={onClose}>
      <Modal.Overlay />
      <Modal.Content className="translation-modal">
        <Modal.Header>
          <Modal.Title>메시지 번역</Modal.Title>
          <Modal.Close />
        </Modal.Header>

        <Modal.Body className="translation-modal-body">
          {/* Original Text */}
          <div className="original-text-section">
            <Text className="section-label">원본 텍스트</Text>
            {detectedLanguage && (
              <Text className="detected-language">
                감지된 언어: {detectedLanguage}
              </Text>
            )}
            <div className="text-content original-text">
              {originalText}
            </div>
          </div>

          {/* Language Selection */}
          <div className="language-selection">
            <Text className="section-label">번역할 언어</Text>
            <Select.Root 
              value={targetLanguage} 
              onValueChange={setTargetLanguage}
              disabled={isTranslating}
            >
              <Select.Trigger>
                <Select.Value placeholder="언어를 선택하세요" />
              </Select.Trigger>
              <Select.Content>
                {languageOptions.map(option => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          {/* Translation Result */}
          {(translationResult || streamingTranslation || isTranslating) && (
            <div className="translation-result-section">
              <Text className="section-label">번역 결과</Text>
              <div className="text-content translation-result">
                {isTranslating && (
                  <div className="streaming-container">
                    <Spinner size="sm" className="translation-spinner" />
                    <span className="streaming-text">
                      {streamingTranslation || '번역 중...'}
                    </span>
                  </div>
                )}
                {translationResult && !isTranslating && (
                  <div className="completed-translation">
                    {translationResult.translatedText}
                  </div>
                )}
              </div>
              {translationResult && (
                <Text className="translation-info">
                  {supportedLanguages[translationResult.sourceLang]} → {supportedLanguages[translationResult.targetLang]}
                </Text>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <Text className="error-text">오류: {error}</Text>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isTranslating}
          >
            닫기
          </Button>
          <Button 
            onClick={handleTranslate}
            disabled={isTranslating || !targetLanguage || !originalText}
          >
            {isTranslating ? (
              <>
                <Spinner size="sm" />
                번역 중...
              </>
            ) : (
              '번역하기'
            )}
          </Button>
        </Modal.Footer>
      </Modal.Content>

      <style jsx>{`
        .translation-modal {
          min-width: 500px;
          max-width: 600px;
        }

        .translation-modal-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .section-label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: block;
        }

        .detected-language {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.5rem;
          display: block;
        }

        .text-content {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 1rem;
          min-height: 80px;
          line-height: 1.5;
        }

        .original-text {
          background: #f8f9fa;
        }

        .translation-result {
          background: #e8f5e8;
          border-color: #c3e6cb;
        }

        .streaming-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .streaming-text {
          color: #333;
        }

        .completed-translation {
          color: #155724;
        }

        .translation-info {
          font-size: 0.875rem;
          color: #666;
          margin-top: 0.5rem;
          display: block;
        }

        .language-selection {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .error-message {
          padding: 0.75rem;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
        }

        .error-text {
          color: #721c24;
          margin: 0;
        }

        .translation-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Modal.Root>
  );
};

export default TranslationModal;