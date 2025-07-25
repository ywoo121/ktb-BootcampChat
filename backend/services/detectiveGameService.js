const detectivePersonas = {
  holmes: {
    name: "셜록 홈즈",
    emoji: "🔍",
    personality: "논리적이고 예리한 추리력을 가진 명탐정",
    greeting: "좋은 아침입니다! 셜록 홈즈입니다. 오늘은 어떤 미스터리를 해결해볼까요?",
    style: "deductive",
    catchphrase: "기초적인 것이군요, 왓슨!"
  },
  poirot: {
    name: "에르퀼 푸아로",
    emoji: "🥸",
    personality: "세심하고 질서정연한 벨기에 명탐정",
    greeting: "안녕하세요! 에르퀼 푸아로입니다. 제 작은 회색 뇌세포가 여러분의 수수께끼를 풀어드리겠습니다.",
    style: "methodical",
    catchphrase: "질서와 방법이 중요합니다!"
  },
  marple: {
    name: "미스 마플",
    emoji: "👵",
    personality: "온화하지만 날카로운 관찰력을 가진 할머니 탐정",
    greeting: "안녕하세요, 친애하는 여러분. 미스 마플입니다. 인간의 본성을 통해 진실을 찾아보아요.",
    style: "intuitive",
    catchphrase: "사람들은 모두 비슷해요..."
  },
  conan: {
    name: "코난 도일",
    emoji: "🕵️",
    personality: "현대적이고 과학적 수사 기법을 사용하는 젊은 탐정",
    greeting: "안녕! 나는 코난이야. 진실은 항상 하나뿐이거든!",
    style: "scientific",
    catchphrase: "진실은 항상 하나뿐!"
  }
};

const gameModes = {
  mystery_solver: {
    name: "미스터리 해결사",
    description: "플레이어가 제시한 미스터리나 문제를 탐정이 해결",
    duration: 300000 // 5분
  },
  detective_quiz: {
    name: "탐정 퀴즈",
    description: "탐정이 수수께끼나 퀴즈를 출제하고 플레이어가 맞추기",
    duration: 180000 // 3분
  },
  case_discussion: {
    name: "사건 토론",
    description: "가상의 사건을 함께 분석하고 토론하기",
    duration: 600000 // 10분
  },
  role_play: {
    name: "역할극",
    description: "탐정과 조수 역할을 나누어 사건을 해결",
    duration: 900000 // 15분
  }
};

const mysteryTemplates = [
  {
    title: "잠긴 방의 미스터리",
    scenario: "한 부유한 상인이 자신의 서재에서 죽은 채 발견되었습니다. 방은 안쪽에서 잠겨있었고, 창문도 모두 잠겨있었습니다.",
    clues: ["열쇠는 피해자의 주머니에", "창문 근처에 떨어진 화분", "책상 위의 미완성 편지"],
    solution: "피해자는 화분을 이용해 창문을 깨고 들어온 범인에게 습격당했지만, 범인은 다른 방법으로 탈출했다."
  },
  {
    title: "사라진 다이아몬드",
    scenario: "박물관에서 귀중한 다이아몬드가 사라졌습니다. CCTV에는 아무도 들어오거나 나가는 모습이 찍히지 않았습니다.",
    clues: ["청소부의 증언", "전날 밤 정전", "전시케이스의 미세한 흠집"],
    solution: "내부 직원이 정전을 이용해 미리 준비한 가짜 다이아몬드와 바꿔치기했다."
  },
  {
    title: "독이 든 커피",
    scenario: "회사 회의 중 한 임원이 커피를 마신 후 쓰러졌습니다. 모든 사람이 같은 커피포트에서 커피를 마셨지만 한 사람만 중독되었습니다.",
    clues: ["설탕 통의 위치", "피해자의 특별한 습관", "회의실의 좌석 배치"],
    solution: "범인은 피해자만이 사용하는 특별한 설탕 통에 독을 넣었다."
  }
];

class DetectiveGameService {
  constructor() {
    this.activeGames = new Map(); // roomId -> gameState
  }

  // 게임 시작
  startGame(roomId, persona, mode, userId) {
    if (!detectivePersonas[persona]) {
      throw new Error('잘못된 탐정 페르소나입니다.');
    }

    if (!gameModes[mode]) {
      throw new Error('잘못된 게임 모드입니다.');
    }

    const gameState = {
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      persona: detectivePersonas[persona],
      mode: gameModes[mode],
      hostUserId: userId,
      participants: [userId],
      status: 'active',
      startTime: new Date(),
      endTime: new Date(Date.now() + gameModes[mode].duration),
      currentMystery: null,
      cluesRevealed: [],
      guesses: [],
      score: 0
    };

    // 모드에 따라 초기 미스터리 설정
    if (mode === 'mystery_solver' || mode === 'case_discussion') {
      gameState.currentMystery = this.getRandomMystery();
    }

    this.activeGames.set(roomId, gameState);

    return {
      success: true,
      game: gameState,
      message: `${gameState.persona.emoji} ${gameState.persona.name} 탐정과 함께하는 ${gameState.mode.name} 게임이 시작되었습니다!`
    };
  }

  // 게임 참가
  joinGame(roomId, userId) {
    const game = this.activeGames.get(roomId);
    if (!game) {
      return { success: false, message: '진행 중인 게임이 없습니다.' };
    }

    if (game.participants.includes(userId)) {
      return { success: false, message: '이미 게임에 참가하고 있습니다.' };
    }

    if (game.status !== 'active') {
      return { success: false, message: '게임이 종료되었습니다.' };
    }

    game.participants.push(userId);

    return {
      success: true,
      game,
      message: `게임에 참가했습니다! 현재 참가자: ${game.participants.length}명`
    };
  }

  // 단서 요청
  getClue(roomId, userId) {
    const game = this.activeGames.get(roomId);
    if (!game || !game.participants.includes(userId)) {
      return { success: false, message: '게임에 참가하지 않았습니다.' };
    }

    if (!game.currentMystery) {
      return { success: false, message: '현재 해결할 미스터리가 없습니다.' };
    }

    const availableClues = game.currentMystery.clues.filter(
      clue => !game.cluesRevealed.includes(clue)
    );

    if (availableClues.length === 0) {
      return { success: false, message: '모든 단서가 공개되었습니다.' };
    }

    const newClue = availableClues[0];
    game.cluesRevealed.push(newClue);

    return {
      success: true,
      clue: newClue,
      cluesRemaining: availableClues.length - 1,
      message: `새로운 단서: ${newClue}`
    };
  }

  // 추리 제출
  submitGuess(roomId, userId, guess) {
    const game = this.activeGames.get(roomId);
    if (!game || !game.participants.includes(userId)) {
      return { success: false, message: '게임에 참가하지 않았습니다.' };
    }

    if (!game.currentMystery) {
      return { success: false, message: '현재 해결할 미스터리가 없습니다.' };
    }

    const guessEntry = {
      userId,
      guess,
      timestamp: new Date(),
      isCorrect: this.evaluateGuess(guess, game.currentMystery.solution)
    };

    game.guesses.push(guessEntry);

    if (guessEntry.isCorrect) {
      game.score += 100;
      return {
        success: true,
        correct: true,
        message: `🎉 정답입니다! ${game.persona.catchphrase}`,
        solution: game.currentMystery.solution,
        score: game.score
      };
    } else {
      return {
        success: true,
        correct: false,
        message: `아직 부족합니다. ${game.persona.name}이(가) 더 단서를 찾아보라고 합니다.`,
        hint: this.generateHint(game.currentMystery, game.cluesRevealed.length)
      };
    }
  }

  // 탐정 응답 생성
  generateDetectiveResponse(roomId, userMessage, userId) {
    const game = this.activeGames.get(roomId);
    if (!game) {
      return null;
    }

    const persona = game.persona;
    const responses = {
      greeting: [
        `${persona.emoji} ${persona.greeting}`,
        `안녕하세요! ${persona.name}입니다. 오늘 어떤 미스터리를 풀어볼까요?`,
        `${persona.name}이(가) 여러분을 기다리고 있었습니다!`
      ],
      encouragement: [
        `${persona.catchphrase}`,
        `좋은 관찰력이군요!`,
        `계속 생각해보세요. 답은 가까이 있습니다.`,
        `${persona.name}이(가) 여러분의 추리를 지켜보고 있습니다.`
      ],
      hint: [
        `힌트: 세부사항을 놓치지 마세요.`,
        `때로는 당연해 보이는 것이 가장 중요한 단서입니다.`,
        `모든 것은 연결되어 있습니다.`,
        `동기를 생각해보세요.`
      ]
    };

    // 메시지 유형에 따른 응답
    if (userMessage.toLowerCase().includes('안녕') || userMessage.toLowerCase().includes('hello')) {
      return this.getRandomResponse(responses.greeting);
    } else if (userMessage.includes('?') || userMessage.includes('추리') || userMessage.includes('범인')) {
      return this.getRandomResponse(responses.encouragement);
    } else if (userMessage.includes('힌트') || userMessage.includes('도움')) {
      return this.getRandomResponse(responses.hint);
    }

    return `${persona.emoji} ${persona.name}: 흥미로운 관찰이군요. 계속 조사해보시죠!`;
  }

  // 게임 종료
  endGame(roomId) {
    const game = this.activeGames.get(roomId);
    if (!game) {
      return { success: false, message: '진행 중인 게임이 없습니다.' };
    }

    game.status = 'ended';
    game.endTime = new Date();

    const result = {
      success: true,
      game,
      summary: {
        duration: game.endTime - game.startTime,
        participants: game.participants.length,
        cluesUsed: game.cluesRevealed.length,
        totalGuesses: game.guesses.length,
        finalScore: game.score
      }
    };

    this.activeGames.delete(roomId);
    return result;
  }

  // 게임 상태 조회
  getGameState(roomId) {
    const game = this.activeGames.get(roomId);
    if (!game) {
      return null;
    }

    return {
      ...game,
      timeRemaining: Math.max(0, game.endTime - new Date())
    };
  }

  // 사용 가능한 페르소나 목록
  getAvailablePersonas() {
    return Object.keys(detectivePersonas).map(key => ({
      id: key,
      ...detectivePersonas[key]
    }));
  }

  // 사용 가능한 게임 모드 목록
  getAvailableModes() {
    return Object.keys(gameModes).map(key => ({
      id: key,
      ...gameModes[key]
    }));
  }

  // 헬퍼 메서드들
  getRandomMystery() {
    return mysteryTemplates[Math.floor(Math.random() * mysteryTemplates.length)];
  }

  evaluateGuess(guess, solution) {
    const guessLower = guess.toLowerCase();
    const solutionLower = solution.toLowerCase();
    
    // 키워드 기반 평가
    const keywords = solutionLower.split(' ').filter(word => word.length > 2);
    const matchedKeywords = keywords.filter(keyword => guessLower.includes(keyword));
    
    return matchedKeywords.length >= keywords.length * 0.6; // 60% 이상 매치
  }

  generateHint(mystery, cluesRevealed) {
    const hints = [
      "동기를 생각해보세요.",
      "시간대를 고려해보세요.",
      "모든 등장인물의 행동을 분석해보세요.",
      "물리적 증거에 집중해보세요.",
      "누가 기회를 가졌는지 생각해보세요."
    ];
    
    return hints[Math.min(cluesRevealed, hints.length - 1)];
  }

  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // 자동 게임 정리 (시간 초과된 게임들)
  cleanupExpiredGames() {
    const now = new Date();
    for (const [roomId, game] of this.activeGames.entries()) {
      if (now > game.endTime) {
        this.endGame(roomId);
      }
    }
  }
}

module.exports = new DetectiveGameService();