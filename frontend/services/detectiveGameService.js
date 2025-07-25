const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class DetectiveGameService {
  // 게임 시작
  async startGame(roomId, persona, mode) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch(`${API_URL}/api/detective-game/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId, persona, mode })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '게임 시작에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Start game error:', error);
      throw error;
    }
  }

  // 게임 참가
  async joinGame(roomId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch(`${API_URL}/api/detective-game/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '게임 참가에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Join game error:', error);
      throw error;
    }
  }

  // 단서 요청
  async requestClue(roomId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch(`${API_URL}/api/detective-game/clue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '단서 요청에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Request clue error:', error);
      throw error;
    }
  }

  // 추리 제출
  async submitGuess(roomId, guess) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch(`${API_URL}/api/detective-game/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId, guess })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '추리 제출에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Submit guess error:', error);
      throw error;
    }
  }

  // 게임 종료
  async endGame(roomId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch(`${API_URL}/api/detective-game/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '게임 종료에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('End game error:', error);
      throw error;
    }
  }

  // 게임 상태 조회
  async getGameStatus(roomId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch(`${API_URL}/api/detective-game/status/${roomId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, message: '진행 중인 게임이 없습니다.' };
        }
        throw new Error(data.message || '게임 상태 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Get game status error:', error);
      throw error;
    }
  }

  // 사용 가능한 페르소나 목록
  async getAvailablePersonas() {
    try {
      const response = await fetch(`${API_URL}/api/detective-game/personas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '페르소나 목록 조회에 실패했습니다.');
      }

      return data.personas || [];
    } catch (error) {
      console.error('Get personas error:', error);
      throw error;
    }
  }

  // 사용 가능한 게임 모드 목록
  async getAvailableModes() {
    try {
      const response = await fetch(`${API_URL}/api/detective-game/modes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '게임 모드 목록 조회에 실패했습니다.');
      }

      return data.modes || [];
    } catch (error) {
      console.error('Get modes error:', error);
      throw error;
    }
  }

  // 시간 포맷팅 유틸리티
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    } else {
      return `${seconds}초`;
    }
  }

  // 게임 모드 설명 가져오기
  getModeDescription(modeId) {
    const descriptions = {
      mystery_solver: '플레이어가 제시한 미스터리나 문제를 탐정이 해결합니다.',
      detective_quiz: '탐정이 수수께끼나 퀴즈를 출제하고 플레이어가 맞춥니다.',
      case_discussion: '가상의 사건을 함께 분석하고 토론합니다.',
      role_play: '탐정과 조수 역할을 나누어 사건을 해결합니다.'
    };
    return descriptions[modeId] || '게임 모드 설명이 없습니다.';
  }

  // 페르소나 스타일 가져오기
  getPersonaStyle(personaId) {
    const styles = {
      holmes: { color: '#8B4513', backgroundColor: '#F5E6D3' },
      poirot: { color: '#4B0082', backgroundColor: '#E6E6FA' },
      marple: { color: '#8B008B', backgroundColor: '#FFE4E1' },
      conan: { color: '#1E90FF', backgroundColor: '#E0F6FF' }
    };
    return styles[personaId] || { color: '#333', backgroundColor: '#F5F5F5' };
  }
}

export default new DetectiveGameService();