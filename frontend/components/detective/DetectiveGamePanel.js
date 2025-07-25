import React, { useState } from 'react';
import { Button, Text, Card, Badge, Select, Textarea } from '@vapor-ui/core';
import { Flex, Box, HStack, VStack } from '../ui/Layout';
import { useDetectiveGame } from '../../hooks/useDetectiveGame';

const DetectiveGamePanel = ({ socketRef, roomId, currentUser }) => {
  const {
    gameState,
    personas,
    modes,
    loading,
    error,
    gameMessages,
    isInGame,
    timeRemaining,
    startGame,
    joinGame,
    requestClue,
    submitGuess,
    chatWithDetective,
    endGame,
    clearError,
    formatTimeRemaining,
    isGameActive,
    isHost,
    participantCount
  } = useDetectiveGame(socketRef, roomId, currentUser);

  const [selectedPersona, setSelectedPersona] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showStartForm, setShowStartForm] = useState(false);

  const handleStartGame = async () => {
    if (!selectedPersona || !selectedMode) {
      alert('페르소나와 게임 모드를 선택해주세요.');
      return;
    }

    await startGame(selectedPersona, selectedMode);
    setShowStartForm(false);
    setSelectedPersona('');
    setSelectedMode('');
  };

  const handleSubmitGuess = async () => {
    if (!guessInput.trim()) return;
    
    await submitGuess(guessInput);
    setGuessInput('');
  };

  const handleChatWithDetective = async () => {
    if (!chatInput.trim()) return;
    
    await chatWithDetective(chatInput);
    setChatInput('');
  };

  const getPersonaStyle = (personaId) => {
    const styles = {
      holmes: { color: '#8B4513', backgroundColor: '#F5E6D3' },
      poirot: { color: '#4B0082', backgroundColor: '#E6E6FA' },
      marple: { color: '#8B008B', backgroundColor: '#FFE4E1' },
      conan: { color: '#1E90FF', backgroundColor: '#E0F6FF' }
    };
    return styles[personaId] || { color: '#333', backgroundColor: '#F5F5F5' };
  };

  const renderGameMessage = (message, index) => {
    const personaStyle = message.persona ? getPersonaStyle(message.persona.id || 'holmes') : {};

    switch (message.type) {
      case 'detective':
        return (
          <Card.Root key={index} style={{ marginBottom: '12px', ...personaStyle }}>
            <Card.Body style={{ padding: '16px' }}>
              <HStack gap="200" align="center" style={{ marginBottom: '8px' }}>
                <Text style={{ fontSize: '20px' }}>{message.persona?.emoji}</Text>
                <Text typography="heading6" style={{ fontWeight: 'bold' }}>
                  {message.persona?.name}
                </Text>
                {message.askedBy && (
                  <Badge color="info" size="sm">
                    {message.askedBy}님의 질문에 답변
                  </Badge>
                )}
              </HStack>
              <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {message.message}
              </Text>
              <Text typography="caption" style={{ color: '#666', marginTop: '8px' }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            </Card.Body>
          </Card.Root>
        );

      case 'clue':
        return (
          <Card.Root key={index} style={{ marginBottom: '12px', backgroundColor: '#FFF9C4' }}>
            <Card.Body style={{ padding: '16px' }}>
              <HStack gap="200" align="center" style={{ marginBottom: '8px' }}>
                <Text style={{ fontSize: '20px' }}>🔍</Text>
                <Text typography="heading6" style={{ fontWeight: 'bold', color: '#B8860B' }}>
                  새로운 단서
                </Text>
                <Badge color="warning" size="sm">
                  {message.revealedBy}님이 발견
                </Badge>
              </HStack>
              <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {message.clue}
              </Text>
              <Text typography="caption" style={{ color: '#666' }}>
                남은 단서: {message.cluesRemaining}/{message.totalClues}
              </Text>
            </Card.Body>
          </Card.Root>
        );

      case 'guess':
        return (
          <Card.Root key={index} style={{ 
            marginBottom: '12px', 
            backgroundColor: message.correct ? '#E8F5E8' : '#FFF2F2' 
          }}>
            <Card.Body style={{ padding: '16px' }}>
              <HStack gap="200" align="center" style={{ marginBottom: '8px' }}>
                <Text style={{ fontSize: '20px' }}>
                  {message.correct ? '🎉' : '🤔'}
                </Text>
                <Text typography="heading6" style={{ fontWeight: 'bold' }}>
                  {message.guesser}님의 추리
                </Text>
                <Badge color={message.correct ? 'success' : 'danger'} size="sm">
                  {message.correct ? '정답!' : '오답'}
                </Badge>
              </HStack>
              <Text style={{ marginBottom: '8px', fontStyle: 'italic' }}>
                "{message.guess}"
              </Text>
              <Text style={{ color: message.correct ? '#2E7D32' : '#C62828' }}>
                {message.message}
              </Text>
              {message.hint && (
                <Text typography="caption" style={{ color: '#666', marginTop: '4px' }}>
                  힌트: {message.hint}
                </Text>
              )}
              {message.solution && (
                <Text style={{ marginTop: '8px', fontWeight: 'bold', color: '#2E7D32' }}>
                  해답: {message.solution}
                </Text>
              )}
            </Card.Body>
          </Card.Root>
        );

      case 'solved':
        return (
          <Card.Root key={index} style={{ marginBottom: '12px', backgroundColor: '#E8F5E8' }}>
            <Card.Body style={{ padding: '16px', textAlign: 'center' }}>
              <Text style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</Text>
              <Text typography="heading5" style={{ fontWeight: 'bold', color: '#2E7D32', marginBottom: '8px' }}>
                사건 해결!
              </Text>
              <Text style={{ marginBottom: '4px' }}>
                승자: <strong>{message.winner}</strong>
              </Text>
              <Text typography="caption" style={{ color: '#666' }}>
                점수: {message.score}점
              </Text>
            </Card.Body>
          </Card.Root>
        );

      case 'system':
        return (
          <Card.Root key={index} style={{ marginBottom: '12px', backgroundColor: '#F5F5F5' }}>
            <Card.Body style={{ padding: '12px', textAlign: 'center' }}>
              <Text typography="caption" style={{ color: '#666' }}>
                {message.message}
              </Text>
            </Card.Body>
          </Card.Root>
        );

      default:
        return null;
    }
  };

  if (error) {
    return (
      <Card.Root style={{ backgroundColor: '#FFEBEE' }}>
        <Card.Body style={{ padding: '16px' }}>
          <Text style={{ color: '#C62828', marginBottom: '8px' }}>
            오류: {error}
          </Text>
          <Button size="sm" onClick={clearError}>
            확인
          </Button>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <VStack gap="300" style={{ padding: '16px' }}>
      {/* 게임 상태 헤더 */}
      {isGameActive ? (
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <HStack gap="200" align="center">
                <Text style={{ fontSize: '24px' }}>{gameState.persona.emoji}</Text>
                <VStack gap="50">
                  <Text typography="heading6" style={{ fontWeight: 'bold' }}>
                    {gameState.persona.name} 탐정과 함께하는 {gameState.mode.name}
                  </Text>
                  <Text typography="caption" style={{ color: '#666' }}>
                    참가자: {participantCount}명 | 시간: {formatTimeRemaining()}
                  </Text>
                </VStack>
              </HStack>
              {isHost && (
                <Button 
                  color="danger" 
                  size="sm" 
                  onClick={endGame}
                  disabled={loading}
                >
                  게임 종료
                </Button>
              )}
            </Flex>
          </Card.Header>
        </Card.Root>
      ) : (
        <Card.Root>
          <Card.Body style={{ padding: '16px', textAlign: 'center' }}>
            <Text style={{ fontSize: '32px', marginBottom: '8px' }}>🕵️</Text>
            <Text typography="heading5" style={{ marginBottom: '8px' }}>
              탐정 게임
            </Text>
            <Text typography="body2" style={{ color: '#666', marginBottom: '16px' }}>
              명탐정과 함께 미스터리를 해결해보세요!
            </Text>
            
            {!showStartForm ? (
              <Button 
                color="primary" 
                onClick={() => setShowStartForm(true)}
                disabled={loading}
              >
                게임 시작하기
              </Button>
            ) : (
              <VStack gap="200" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <Select
                  value={selectedPersona}
                  onChange={(e) => setSelectedPersona(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">탐정 선택...</option>
                  {personas.map(persona => (
                    <option key={persona.id} value={persona.id}>
                      {persona.emoji} {persona.name}
                    </option>
                  ))}
                </Select>
                
                <Select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">게임 모드 선택...</option>
                  {modes.map(mode => (
                    <option key={mode.id} value={mode.id}>
                      {mode.name}
                    </option>
                  ))}
                </Select>
                
                <HStack gap="200">
                  <Button 
                    color="primary" 
                    onClick={handleStartGame}
                    disabled={loading || !selectedPersona || !selectedMode}
                  >
                    시작
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowStartForm(false)}
                    disabled={loading}
                  >
                    취소
                  </Button>
                </HStack>
              </VStack>
            )}
          </Card.Body>
        </Card.Root>
      )}

      {/* 게임 참가 버튼 */}
      {isGameActive && !isInGame && (
        <Card.Root>
          <Card.Body style={{ padding: '16px', textAlign: 'center' }}>
            <Text style={{ marginBottom: '12px' }}>
              진행 중인 게임에 참가하시겠습니까?
            </Text>
            <Button 
              color="primary" 
              onClick={joinGame}
              disabled={loading}
            >
              게임 참가
            </Button>
          </Card.Body>
        </Card.Root>
      )}

      {/* 게임 메시지 */}
      {gameMessages.length > 0 && (
        <VStack gap="200">
          {gameMessages.map(renderGameMessage)}
        </VStack>
      )}

      {/* 게임 컨트롤 */}
      {isGameActive && isInGame && (
        <VStack gap="200">
          {/* 단서 요청 */}
          <Card.Root>
            <Card.Body style={{ padding: '16px' }}>
              <Text typography="heading6" style={{ marginBottom: '8px' }}>
                🔍 단서 요청
              </Text>
              <Button 
                color="secondary" 
                onClick={requestClue}
                disabled={loading}
                style={{ width: '100%' }}
              >
                새로운 단서 요청
              </Button>
            </Card.Body>
          </Card.Root>

          {/* 추리 제출 */}
          <Card.Root>
            <Card.Body style={{ padding: '16px' }}>
              <Text typography="heading6" style={{ marginBottom: '8px' }}>
                💡 추리 제출
              </Text>
              <VStack gap="200">
                <Textarea
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="당신의 추리를 입력하세요..."
                  rows={3}
                  style={{ width: '100%' }}
                />
                <Button 
                  color="success" 
                  onClick={handleSubmitGuess}
                  disabled={loading || !guessInput.trim()}
                  style={{ width: '100%' }}
                >
                  추리 제출
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* 탐정과 대화 */}
          <Card.Root>
            <Card.Body style={{ padding: '16px' }}>
              <Text typography="heading6" style={{ marginBottom: '8px' }}>
                💬 탐정과 대화
              </Text>
              <VStack gap="200">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="탐정에게 질문하세요..."
                  rows={2}
                  style={{ width: '100%' }}
                />
                <Button 
                  color="info" 
                  onClick={handleChatWithDetective}
                  disabled={loading || !chatInput.trim()}
                  style={{ width: '100%' }}
                >
                  질문하기
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      )}
    </VStack>
  );
};

export default DetectiveGamePanel;