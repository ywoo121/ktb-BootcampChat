// test/data/ai-prompts.ts

export interface AIPrompt {
  category: string;
  purpose: string;
  prompt: string;
  parameters?: string[];
}

export const TEST_PROMPTS: Record<string, AIPrompt> = {
  GREETING: {
    category: 'Basic',
    purpose: '기본 인사',
    prompt: '안녕하세요! 저는 [AI_NAME]입니다. [USER_NAME]님과 대화를 나누게 되어 기쁩니다.',
    parameters: ['AI_NAME', 'USER_NAME']
  },
  CODE_REVIEW: {
    category: 'Development',
    purpose: '코드 리뷰',
    prompt: '다음 [LANGUAGE] 코드를 리뷰해주세요:\n[CODE]',
    parameters: ['LANGUAGE', 'CODE']
  },
  BUSINESS_ADVICE: {
    category: 'Consulting',
    purpose: '비즈니스 조언',
    prompt: '[INDUSTRY] 산업에서 [TOPIC]에 대한 조언을 제공해주세요.',
    parameters: ['INDUSTRY', 'TOPIC']
  },
  DEBATE: {
    category: 'Discussion',
    purpose: '토론 진행',
    prompt: '[TOPIC]에 대해 [STANCE] 입장에서 논의를 진행해주세요.',
    parameters: ['TOPIC', 'STANCE']
  },
  ANALYSIS: {
    category: 'Analysis',
    purpose: '데이터 분석',
    prompt: '다음 [DATA_TYPE] 데이터를 분석하고 [FOCUS_POINT]에 대한 인사이트를 제공해주세요:\n[DATA]',
    parameters: ['DATA_TYPE', 'FOCUS_POINT', 'DATA']
  }
};

// AI 응답 템플릿
export const AI_RESPONSE_TEMPLATES = {
  ERROR: {
    NO_RESPONSE: '죄송합니다. 현재 응답을 생성할 수 없습니다.',
    INVALID_PROMPT: '잘못된 프롬프트 형식입니다.',
    API_ERROR: 'AI API 호출 중 오류가 발생했습니다.'
  },
  FALLBACK: {
    DEFAULT: '이해했습니다. 어떻게 도와드릴까요?',
    CLARIFICATION: '조금 더 자세히 설명해 주시겠어요?'
  }
};