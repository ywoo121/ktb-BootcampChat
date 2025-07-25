// 한국어 STT 최적화를 위한 유틸리티
class KoreanSTTOptimizer {
  
  /**
   * 채팅 상황에 맞는 한국어 프롬프트 생성
   * @param {string} context - 추가 컨텍스트
   * @returns {string} 최적화된 프롬프트
   */
  static generateChatPrompt(context = '') {
    const commonChatPhrases = [
      // 인사말
      "안녕하세요", "안녕", "반갑습니다", "좋은 아침입니다", "수고하세요",
      
      // 일반적인 채팅 표현
      "네", "아니요", "맞아요", "그렇네요", "좋아요", "괜찮아요", "알겠습니다",
      "감사합니다", "죄송합니다", "미안해요", "고마워요",
      
      // 업무 관련
      "회의", "프로젝트", "업무", "작업", "완료", "확인", "검토", "수정",
      "개발", "코딩", "프로그래밍", "디자인", "기획", "마케팅",
      
      // 시간 관련
      "오늘", "내일", "어제", "지금", "나중에", "빨리", "천천히",
      
      // 질문/답변
      "어떻게", "왜", "언제", "어디서", "누가", "뭐", "어떤",
      "질문", "답변", "설명", "이해", "모르겠어요", "궁금해요"
    ];
    
    let prompt = commonChatPhrases.join(", ");
    
    if (context) {
      prompt += `, ${context}`;
    }
    
    return prompt;
  }
  
  /**
   * 음성 품질에 따른 설정 조정
   * @param {number} fileSize - 파일 크기 (bytes)
   * @param {string} mimeType - 파일 MIME 타입
   * @returns {Object} 최적화된 설정
   */
  static getOptimalSettings(fileSize, mimeType) {
    let temperature = 0; // 기본값: 최대 정확도
    
    // 파일 크기가 작으면 (노이즈가 많을 가능성) 약간 유연하게
    if (fileSize < 10000) { // 10KB 미만
      temperature = 0.1;
    }
    
    // WebM은 압축률이 높아 품질이 떨어질 수 있음
    if (mimeType === 'audio/webm') {
      temperature = 0.05;
    }
    
    return {
      temperature,
      language: 'ko',
      response_format: 'text'
    };
  }
  
  /**
   * 인식 결과 후처리
   * @param {string} text - 인식된 텍스트
   * @returns {string} 후처리된 텍스트
   */
  static postProcess(text) {
    if (!text) return '';
    
    let processed = text.trim();
    
    // 일반적인 오인식 패턴 수정
    const corrections = {
      '내': '네',
      '애': '에',
      '얘기': '이야기',
      '뭐야': '뭐예요',
      '야': '예요',
      '하자': '해요',
      '가자': '가요',
      '먹자': '먹어요'
    };
    
    // 단어 단위로 수정
    Object.entries(corrections).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'g');
      processed = processed.replace(regex, correct);
    });
    
    // 문장 부호 정리
    processed = processed.replace(/\s+/g, ' '); // 중복 공백 제거
    processed = processed.replace(/[.]{2,}/g, '.'); // 중복 마침표 제거
    
    return processed;
  }
}

module.exports = KoreanSTTOptimizer;
