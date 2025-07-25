// test/ai/data-enhanced/ai-prompt-templates.ts

export interface PromptTemplate {
  id: string;
  category: string;
  title: string;
  prompt: string;
  expectedTopics: string[];
  aiType: 'wayneAI' | 'consultingAI';
  complexity: 'simple' | 'medium' | 'complex';
  estimatedResponseTime: number; // milliseconds
}

export const ENHANCED_PROMPT_TEMPLATES: PromptTemplate[] = [
  // Technical Prompts for wayneAI
  {
    id: 'tech-001',
    category: 'Frontend',
    title: 'React Performance Optimization',
    prompt: 'React 애플리케이션의 렌더링 성능을 개선하는 구체적인 방법들을 단계별로 설명해주세요. 각 방법의 장단점과 실제 구현 예시도 포함해주세요.',
    expectedTopics: ['React.memo', 'useMemo', 'useCallback', '가상화', '코드분할'],
    aiType: 'wayneAI',
    complexity: 'complex',
    estimatedResponseTime: 20000
  },
  {
    id: 'tech-002',
    category: 'Backend',
    title: 'Microservices Communication',
    prompt: '마이크로서비스 간 통신에서 발생할 수 있는 문제점들과 각각의 해결책을 제시해주세요. 동기/비동기 통신 패턴별로 설명해주세요.',
    expectedTopics: ['REST', 'gRPC', '메시지큐', 'Circuit Breaker', '서비스메시'],
    aiType: 'wayneAI',
    complexity: 'complex',
    estimatedResponseTime: 25000
  },
  {
    id: 'tech-003',
    category: 'DevOps',
    title: 'Container Orchestration',
    prompt: 'Kubernetes를 사용한 컨테이너 오케스트레이션의 핵심 개념과 실제 운영 시 고려사항을 설명해주세요.',
    expectedTopics: ['Pod', 'Service', 'Deployment', 'ConfigMap', 'Ingress'],
    aiType: 'wayneAI',
    complexity: 'complex',
    estimatedResponseTime: 22000
  },
  {
    id: 'tech-004',
    category: 'Database',
    title: 'Query Optimization',
    prompt: 'PostgreSQL에서 느린 쿼리를 최적화하는 방법과 인덱스 설계 전략을 실제 사례와 함께 설명해주세요.',
    expectedTopics: ['EXPLAIN', '인덱스', '쿼리플랜', '통계', '파티셔닝'],
    aiType: 'wayneAI',
    complexity: 'medium',
    estimatedResponseTime: 18000
  },
  {
    id: 'tech-005',
    category: 'Security',
    title: 'Authentication Security',
    prompt: 'JWT 기반 인증 시스템의 보안 취약점과 이를 보완하는 방법들을 구체적으로 알려주세요.',
    expectedTopics: ['JWT', '토큰만료', 'Refresh Token', 'XSS', 'CSRF'],
    aiType: 'wayneAI',
    complexity: 'medium',
    estimatedResponseTime: 15000
  },

  // Business Consulting Prompts for consultingAI
  {
    id: 'biz-001',
    category: 'Strategy',
    title: 'Digital Transformation Strategy',
    prompt: '전통적인 제조업체가 디지털 전환을 성공적으로 수행하기 위한 단계별 전략과 핵심 고려사항을 제시해주세요.',
    expectedTopics: ['디지털전환', '로드맵', '조직변화', '기술도입', 'ROI'],
    aiType: 'consultingAI',
    complexity: 'complex',
    estimatedResponseTime: 23000
  },
  {
    id: 'biz-002',
    category: 'Marketing',
    title: 'Growth Hacking Strategy',
    prompt: 'B2B SaaS 스타트업의 초기 고객 획득을 위한 그로스 해킹 전략과 실행 방안을 구체적으로 제안해주세요.',
    expectedTopics: ['그로스해킹', 'CAC', 'LTV', '퍼널최적화', 'A/B테스트'],
    aiType: 'consultingAI',
    complexity: 'complex',
    estimatedResponseTime: 20000
  },
  {
    id: 'biz-003',
    category: 'Operations',
    title: 'Remote Team Management',
    prompt: '원격 근무 환경에서 팀 생산성을 최대화하고 협업을 강화하는 관리 전략을 제안해주세요.',
    expectedTopics: ['원격근무', '생산성', '협업도구', '소통', '성과관리'],
    aiType: 'consultingAI',
    complexity: 'medium',
    estimatedResponseTime: 17000
  },
  {
    id: 'biz-004',
    category: 'Finance',
    title: 'Startup Funding Strategy',
    prompt: '시드 단계 스타트업의 투자 유치 전략과 투자자별 어프로치 방법을 알려주세요.',
    expectedTopics: ['시드투자', '피치덱', '밸류에이션', '투자자', 'Due Diligence'],
    aiType: 'consultingAI',
    complexity: 'medium',
    estimatedResponseTime: 19000
  },
  {
    id: 'biz-005',
    category: 'Innovation',
    title: 'Product Innovation Framework',
    prompt: '기존 제품의 혁신을 통한 시장 경쟁력 강화 방법과 혁신 프로세스를 설계해주세요.',
    expectedTopics: ['제품혁신', '시장분석', '고객니즈', '프로토타이핑', '검증'],
    aiType: 'consultingAI',
    complexity: 'complex',
    estimatedResponseTime: 21000
  }
];

export const STRESS_TEST_PROMPTS: PromptTemplate[] = [
  {
    id: 'stress-001',
    category: 'Heavy Load',
    title: 'Comprehensive System Design',
    prompt: `대규모 실시간 스트리밍 플랫폼을 설계해주세요. 다음 요구사항을 모두 포함해주세요:
    1. 동시 사용자 1000만명 지원
    2. 글로벌 CDN 전략
    3. 실시간 채팅 시스템
    4. 추천 알고리즘
    5. 결제 시스템 통합
    각 컴포넌트의 기술 스택과 아키텍처 결정 이유도 상세히 설명해주세요.`,
    expectedTopics: ['시스템설계', 'CDN', '스케일링', '실시간', '추천시스템'],
    aiType: 'wayneAI',
    complexity: 'complex',
    estimatedResponseTime: 45000
  }
];

export const QUICK_RESPONSE_PROMPTS: PromptTemplate[] = [
  {
    id: 'quick-001',
    category: 'Simple',
    title: 'Quick Tech Question',
    prompt: 'JavaScript에서 const와 let의 차이점은?',
    expectedTopics: ['const', 'let', '변수', '스코프'],
    aiType: 'wayneAI',
    complexity: 'simple',
    estimatedResponseTime: 8000
  },
  {
    id: 'quick-002',
    category: 'Simple',
    title: 'Quick Business Question',
    prompt: 'MVP의 의미와 중요성을 간단히 설명해주세요.',
    expectedTopics: ['MVP', '제품개발', '검증', '고객'],
    aiType: 'consultingAI',
    complexity: 'simple',
    estimatedResponseTime: 10000
  }
];
