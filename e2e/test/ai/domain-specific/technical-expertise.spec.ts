// test/ai/domain-specific/technical-expertise.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../helpers/test-helpers';

test.describe('Technical Domain AI Testing', () => {
  const helpers = new TestHelpers();

  test('Frontend Development Expertise', async ({ page }) => {
    const credentials = helpers.getTestUser(500);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Frontend-Tech');

    const frontendQuestions = [
      {
        question: 'React에서 useEffect의 클린업 함수는 언제 실행되나요?',
        expectedKeywords: ['언마운트', '의존성', '재실행', '정리', 'cleanup']
      },
      {
        question: 'CSS Grid와 Flexbox의 주요 차이점을 설명해주세요.',
        expectedKeywords: ['2차원', '1차원', '격자', '축', 'container']
      },
      {
        question: 'Webpack과 Vite의 번들링 방식 차이는 무엇인가요?',
        expectedKeywords: ['번들', '빌드', 'HMR', '개발서버', '모듈']
      },
      {
        question: 'TypeScript의 제네릭을 실제 프로젝트에서 어떻게 활용하나요?',
        expectedKeywords: ['타입', '재사용', '안전성', '컴파일', '인터페이스']
      }
    ];

    for (let i = 0; i < frontendQuestions.length; i++) {
      const { question, expectedKeywords } = frontendQuestions[i];
      
      await helpers.sendAIMessage(page, question, 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(100);
      
      // Check for technical depth
      const hasRelevantTerms = expectedKeywords.some(keyword => 
        response?.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasRelevantTerms).toBeTruthy(`Should contain relevant terms for: ${question}`);
      
      await page.waitForTimeout(2000);
    }
  });

  test('Backend Development Expertise', async ({ page }) => {
    const credentials = helpers.getTestUser(501);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Backend-Tech');

    const backendQuestions = [
      {
        question: 'Node.js의 이벤트 루프에서 process.nextTick과 setImmediate의 차이는?',
        expectedKeywords: ['이벤트루프', 'tick', 'immediate', '우선순위', '큐']
      },
      {
        question: 'SQL 인덱스의 B-Tree 구조가 성능에 미치는 영향을 설명해주세요.',
        expectedKeywords: ['인덱스', 'B-Tree', '성능', '탐색', '정렬']
      },
      {
        question: 'Redis와 Memcached의 주요 차이점과 사용 사례는?',
        expectedKeywords: ['캐시', '메모리', '영속성', '자료구조', '분산']
      },
      {
        question: 'Docker 컨테이너의 레이어 캐싱 최적화 방법을 알려주세요.',
        expectedKeywords: ['레이어', '캐싱', 'Dockerfile', '최적화', '이미지']
      }
    ];

    for (let i = 0; i < backendQuestions.length; i++) {
      const { question, expectedKeywords } = backendQuestions[i];
      
      await helpers.sendAIMessage(page, question, 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(150);
      
      const hasRelevantTerms = expectedKeywords.some(keyword => 
        response?.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasRelevantTerms).toBeTruthy(`Should contain relevant terms for: ${question}`);
      
      await page.waitForTimeout(2000);
    }
  });

  test('DevOps and Infrastructure', async ({ page }) => {
    const credentials = helpers.getTestUser(502);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'DevOps-Tech');

    const devopsQuestions = [
      {
        question: 'Kubernetes에서 Pod와 Service의 네트워킹은 어떻게 작동하나요?',
        expectedKeywords: ['Pod', 'Service', '네트워킹', 'ClusterIP', 'Endpoint']
      },
      {
        question: 'CI/CD 파이프라인에서 Blue-Green vs Rolling 배포 전략의 차이는?',
        expectedKeywords: ['배포', 'Blue-Green', 'Rolling', '무중단', '전략']
      },
      {
        question: 'Terraform의 State 파일 관리 Best Practice를 알려주세요.',
        expectedKeywords: ['State', 'Terraform', '관리', '백엔드', '잠금']
      },
      {
        question: 'Prometheus와 Grafana를 이용한 모니터링 구성 방법은?',
        expectedKeywords: ['Prometheus', 'Grafana', '모니터링', '메트릭', '대시보드']
      }
    ];

    for (let i = 0; i < devopsQuestions.length; i++) {
      const { question, expectedKeywords } = devopsQuestions[i];
      
      await helpers.sendAIMessage(page, question, 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(120);
      
      const hasRelevantTerms = expectedKeywords.some(keyword => 
        response?.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasRelevantTerms).toBeTruthy(`Should contain relevant terms for: ${question}`);
      
      await page.waitForTimeout(2000);
    }
  });

  test('Security and Best Practices', async ({ page }) => {
    const credentials = helpers.getTestUser(503);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Security-Tech');

    const securityQuestions = [
      {
        question: 'JWT 토큰의 보안 취약점과 대응 방안을 설명해주세요.',
        expectedKeywords: ['JWT', '보안', '취약점', '토큰', '암호화']
      },
      {
        question: 'SQL Injection 공격을 방지하는 방법들을 알려주세요.',
        expectedKeywords: ['SQL Injection', '방지', 'Prepared Statement', '검증', '이스케이프']
      },
      {
        question: 'HTTPS와 TLS 핸드셰이크 과정을 단계별로 설명해주세요.',
        expectedKeywords: ['HTTPS', 'TLS', '핸드셰이크', '인증서', '암호화']
      },
      {
        question: 'OWASP Top 10의 주요 보안 위협들을 설명해주세요.',
        expectedKeywords: ['OWASP', '보안', '위협', 'XSS', 'CSRF']
      }
    ];

    for (let i = 0; i < securityQuestions.length; i++) {
      const { question, expectedKeywords } = securityQuestions[i];
      
      await helpers.sendAIMessage(page, question, 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(150);
      
      const hasRelevantTerms = expectedKeywords.some(keyword => 
        response?.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasRelevantTerms).toBeTruthy(`Should contain relevant terms for: ${question}`);
      
      await page.waitForTimeout(2000);
    }
  });

  test('Database and Data Management', async ({ page }) => {
    const credentials = helpers.getTestUser(504);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Database-Tech');

    const databaseQuestions = [
      {
        question: 'MongoDB의 샤딩과 레플리케이션의 차이점을 설명해주세요.',
        expectedKeywords: ['MongoDB', '샤딩', '레플리케이션', '분산', '고가용성']
      },
      {
        question: 'PostgreSQL의 VACUUM과 ANALYZE 명령어의 역할은?',
        expectedKeywords: ['PostgreSQL', 'VACUUM', 'ANALYZE', '통계', '성능']
      },
      {
        question: 'ACID 속성과 CAP 정리의 관계를 설명해주세요.',
        expectedKeywords: ['ACID', 'CAP', '일관성', '가용성', '분할허용성']
      },
      {
        question: 'NoSQL과 SQL 데이터베이스의 선택 기준은 무엇인가요?',
        expectedKeywords: ['NoSQL', 'SQL', '선택', '기준', '용도']
      }
    ];

    for (let i = 0; i < databaseQuestions.length; i++) {
      const { question, expectedKeywords } = databaseQuestions[i];
      
      await helpers.sendAIMessage(page, question, 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(100);
      
      const hasRelevantTerms = expectedKeywords.some(keyword => 
        response?.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasRelevantTerms).toBeTruthy(`Should contain relevant terms for: ${question}`);
      
      await page.waitForTimeout(2000);
    }
  });

  test('Algorithm and Data Structure Knowledge', async ({ page }) => {
    const credentials = helpers.getTestUser(505);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Algorithm-Tech');

    const algorithmQuestions = [
      {
        question: '퀵소트와 머지소트의 시간복잡도와 공간복잡도 차이는?',
        expectedKeywords: ['퀵소트', '머지소트', '시간복잡도', '공간복잡도', 'O(n)']
      },
      {
        question: 'Dynamic Programming과 Greedy Algorithm의 차이점을 설명해주세요.',
        expectedKeywords: ['Dynamic Programming', 'Greedy', '최적해', '부분문제', '메모이제이션']
      },
      {
        question: 'Hash Table의 충돌 해결 방법들을 비교해주세요.',
        expectedKeywords: ['Hash Table', '충돌', 'Chaining', 'Open Addressing', '해시함수']
      },
      {
        question: '이진 탐색 트리와 AVL 트리의 차이점은 무엇인가요?',
        expectedKeywords: ['이진탐색트리', 'AVL', '균형', '회전', '높이']
      }
    ];

    for (let i = 0; i < algorithmQuestions.length; i++) {
      const { question, expectedKeywords } = algorithmQuestions[i];
      
      await helpers.sendAIMessage(page, question, 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(120);
      
      const hasRelevantTerms = expectedKeywords.some(keyword => 
        response?.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasRelevantTerms).toBeTruthy(`Should contain relevant terms for: ${question}`);
      
      await page.waitForTimeout(2000);
    }
  });

  test('Architecture and Design Patterns', async ({ page }) => {
    const credentials = helpers.getTestUser(506);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Architecture-Tech');

    const architectureQuestions = [
      {
        question: '마이크로서비스 아키텍처에서 Service Mesh의 역할은?',
        expectedKeywords: ['마이크로서비스', 'Service Mesh', '통신', 'Istio', '사이드카']
      },
      {
        question: 'CQRS 패턴과 Event Sourcing의 관계를 설명해주세요.',
        expectedKeywords: ['CQRS', 'Event Sourcing', '명령', '조회', '이벤트']
      },
      {
        question: 'DDD(Domain Driven Design)의 핵심 개념들을 설명해주세요.',
        expectedKeywords: ['DDD', '도메인', 'Aggregate', 'Entity', 'Value Object']
      },
      {
        question: 'Saga 패턴을 이용한 분산 트랜잭션 처리 방법은?',
        expectedKeywords: ['Saga', '분산트랜잭션', '보상', 'Orchestration', 'Choreography']
      }
    ];

    for (let i = 0; i < architectureQuestions.length; i++) {
      const { question, expectedKeywords } = architectureQuestions[i];
      
      await helpers.sendAIMessage(page, question, 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(150);
      
      const hasRelevantTerms = expectedKeywords.some(keyword => 
        response?.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasRelevantTerms).toBeTruthy(`Should contain relevant terms for: ${question}`);
      
      await page.waitForTimeout(2000);
    }
  });
});
