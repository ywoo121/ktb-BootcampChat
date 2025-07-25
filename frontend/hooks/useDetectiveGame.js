import { useState, useEffect, useCallback, useRef } from 'react';
import detectiveGameService from '../services/detectiveGameService';

export const useDetectiveGame = (socketRef, roomId, currentUser) => {
  const [gameState, setGameState] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [modes, setModes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gameMessages, setGameMessages] = useState([]);
  const [isInGame, setIsInGame] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);

  // 페르소나와 모드 목록 로드
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const [personasData, modesData] = await Promise.all([
          detectiveGameService.getAvailablePersonas(),
          detectiveGameService.getAvailableModes()
        ]);
        setPersonas(personasData);
        setModes(modesData);
      } catch (error) {
        console.error('Failed to load game data:', error);
        setError('게임 데이터 로딩에 실패했습니다.');
      }
    };

    loadGameData();
  }, []);

  // 게임 상태 체크
  const checkGameState = useCallback(async () => {
    if (!roomId) return;

    try {
      const response = await detectiveGameService.getGameStatus(roomId);
      if (response.success && response.game) {
        setGameState(response.game);
        setIsInGame(response.game.participants.includes(currentUser?.id));
        setTimeRemaining(response.game.timeRemaining);
      } else {
        setGameState(null);
        setIsInGame(false);
        setTimeRemaining(0);
      }
    } catch (error) {
      // 게임이 없는 경우는 정상적인 상황이므로 에러로 처리하지 않음
      setGameState(null);
      setIsInGame(false);
      setTimeRemaining(0);
    }
  }, [roomId, currentUser?.id]);

  // 타이머 관리
  useEffect(() => {
    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timeRemaining]);

  // 소켓 이벤트 리스너
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    // 게임 시작 이벤트
    const handleGameStarted = (data) => {
      setGameState(data.game);
      setIsInGame(data.game.participants.includes(currentUser?.id));
      setTimeRemaining(data.game.timeRemaining);
      setGameMessages(prev => [...prev, {
        type: 'system',
        message: data.message,
        timestamp: data.timestamp
      }]);
    };

    // 플레이어 참가 이벤트
    const handlePlayerJoined = (data) => {
      setGameMessages(prev => [...prev, {
        type: 'system',
        message: `${data.userName}님이 게임에 참가했습니다.`,
        timestamp: data.timestamp
      }]);
    };

    // 탐정 메시지
    const handleDetectiveMessage = (data) => {
      setGameMessages(prev => [...prev, {
        type: 'detective',
        persona: data.persona,
        message: data.message,
        originalMessage: data.originalMessage,
        askedBy: data.askedBy,
        timestamp: data.timestamp
      }]);
    };

    // 단서 공개
    const handleClueRevealed = (data) => {
      setGameMessages(prev => [...prev, {
        type: 'clue',
        clue: data.clue,
        revealedBy: data.revealedBy,
        cluesRemaining: data.cluesRemaining,
        totalClues: data.totalClues,
        persona: data.persona,
        timestamp: data.timestamp
      }]);
    };

    // 추리 제출
    const handleGuessSubmitted = (data) => {
      setGameMessages(prev => [...prev, {
        type: 'guess',
        guesser: data.guesser,
        guess: data.guess,
        correct: data.correct,
        message: data.message,
        solution: data.solution,
        hint: data.hint,
        score: data.score,
        persona: data.persona,
        timestamp: data.timestamp
      }]);
    };

    // 게임 해결
    const handleGameSolved = (data) => {
      setGameMessages(prev => [...prev, {
        type: 'solved',
        winner: data.winner,
        solution: data.solution,
        score: data.score,
        persona: data.persona,
        timestamp: data.timestamp
      }]);
    };

    // 게임 종료
    const handleGameEnded = (data) => {
      setGameState(null);
      setIsInGame(false);
      setTimeRemaining(0);
      setGameMessages(prev => [...prev, {
        type: 'system',
        message: `게임이 종료되었습니다. (${data.endedBy}님이 종료)`,
        summary: data.summary,
        timestamp: data.timestamp
      }]);
    };

    // 게임 상태 업데이트
    const handleGameState = (data) => {
      if (data.game) {
        setGameState(data.game);
        setIsInGame(data.game.participants.includes(currentUser?.id));
        setTimeRemaining(data.game.timeRemaining);
      }
    };

    // 에러 처리
    const handleGameError = (data) => {
      setError(data.error);
      setLoading(false);
    };

    // 이벤트 리스너 등록
    socket.on('detectiveGameStarted', handleGameStarted);
    socket.on('detectiveGamePlayerJoined', handlePlayerJoined);
    socket.on('detectiveMessage', handleDetectiveMessage);
    socket.on('detectiveClueRevealed', handleClueRevealed);
    socket.on('detectiveGuessSubmitted', handleGuessSubmitted);
    socket.on('detectiveGameSolved', handleGameSolved);
    socket.on('detectiveGameEnded', handleGameEnded);
    socket.on('detectiveGameState', handleGameState);
    socket.on('detectiveGameError', handleGameError);

    return () => {
      socket.off('detectiveGameStarted', handleGameStarted);
      socket.off('detectiveGamePlayerJoined', handlePlayerJoined);
      socket.off('detectiveMessage', handleDetectiveMessage);
      socket.off('detectiveClueRevealed', handleClueRevealed);
      socket.off('detectiveGuessSubmitted', handleGuessSubmitted);
      socket.off('detectiveGameSolved', handleGameSolved);
      socket.off('detectiveGameEnded', handleGameEnded);
      socket.off('detectiveGameState', handleGameState);
      socket.off('detectiveGameError', handleGameError);
    };
  }, [socketRef, currentUser?.id]);

  // 게임 시작
  const startGame = useCallback(async (persona, mode) => {
    if (!socketRef?.current || !roomId) return;

    setLoading(true);
    setError(null);

    try {
      // Socket으로 게임 시작 요청
      socketRef.current.emit('startDetectiveGame', {
        roomId,
        persona,
        mode
      });
    } catch (error) {
      console.error('Start game error:', error);
      setError('게임 시작에 실패했습니다.');
      setLoading(false);
    }
  }, [socketRef, roomId]);

  // 게임 참가
  const joinGame = useCallback(async () => {
    if (!socketRef?.current || !roomId) return;

    setLoading(true);
    setError(null);

    try {
      socketRef.current.emit('joinDetectiveGame', { roomId });
    } catch (error) {
      console.error('Join game error:', error);
      setError('게임 참가에 실패했습니다.');
      setLoading(false);
    }
  }, [socketRef, roomId]);

  // 단서 요청
  const requestClue = useCallback(async () => {
    if (!socketRef?.current || !roomId) return;

    setLoading(true);
    setError(null);

    try {
      socketRef.current.emit('requestClue', { roomId });
    } catch (error) {
      console.error('Request clue error:', error);
      setError('단서 요청에 실패했습니다.');
      setLoading(false);
    }
  }, [socketRef, roomId]);

  // 추리 제출
  const submitGuess = useCallback(async (guess) => {
    if (!socketRef?.current || !roomId || !guess.trim()) return;

    setLoading(true);
    setError(null);

    try {
      socketRef.current.emit('submitGuess', {
        roomId,
        guess: guess.trim()
      });
    } catch (error) {
      console.error('Submit guess error:', error);
      setError('추리 제출에 실패했습니다.');
      setLoading(false);
    }
  }, [socketRef, roomId]);

  // 탐정과 대화
  const chatWithDetective = useCallback(async (message) => {
    if (!socketRef?.current || !roomId || !message.trim()) return;

    try {
      socketRef.current.emit('detectiveChat', {
        roomId,
        message: message.trim()
      });
    } catch (error) {
      console.error('Detective chat error:', error);
      setError('탐정과의 대화에 실패했습니다.');
    }
  }, [socketRef, roomId]);

  // 게임 종료
  const endGame = useCallback(async () => {
    if (!socketRef?.current || !roomId) return;

    setLoading(true);
    setError(null);

    try {
      socketRef.current.emit('endDetectiveGame', { roomId });
    } catch (error) {
      console.error('End game error:', error);
      setError('게임 종료에 실패했습니다.');
      setLoading(false);
    }
  }, [socketRef, roomId]);

  // 게임 상태 새로고침
  const refreshGameState = useCallback(async () => {
    if (!socketRef?.current || !roomId) return;

    try {
      socketRef.current.emit('getDetectiveGameState', { roomId });
    } catch (error) {
      console.error('Refresh game state error:', error);
      setError('게임 상태 새로고침에 실패했습니다.');
    }
  }, [socketRef, roomId]);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 게임 메시지 클리어
  const clearGameMessages = useCallback(() => {
    setGameMessages([]);
  }, []);

  // 시간 포맷팅
  const formatTimeRemaining = useCallback(() => {
    if (timeRemaining <= 0) return '00:00';
    
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  return {
    // State
    gameState,
    personas,
    modes,
    loading,
    error,
    gameMessages,
    isInGame,
    timeRemaining,
    
    // Actions
    startGame,
    joinGame,
    requestClue,
    submitGuess,
    chatWithDetective,
    endGame,
    refreshGameState,
    clearError,
    clearGameMessages,
    checkGameState,
    
    // Utilities
    formatTimeRemaining,
    
    // Computed
    isGameActive: gameState && gameState.status === 'active',
    isHost: gameState && gameState.hostUserId === currentUser?.id,
    participantCount: gameState ? gameState.participants.length : 0
  };
};