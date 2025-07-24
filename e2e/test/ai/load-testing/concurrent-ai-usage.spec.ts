// test/ai/load-testing/concurrent-ai-usage.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../helpers/test-helpers';

test.describe('AI Load Testing and Concurrent Usage', () => {
  const helpers = new TestHelpers();

  test('High Concurrency AI Requests', async ({ browser }) => {
    const concurrentUsers = 8;
    const context = await browser.newContext();
    const pages = await Promise.all(
      Array(concurrentUsers).fill(0).map(() => context.newPage())
    );

    // Setup all users
    const setupPromises = pages.map(async (page, index) => {
      const credentials = helpers.getTestUser(800 + index);
      await helpers.registerUser(page, credentials);
      await helpers.joinOrCreateRoom(page, 'Load-Test-Room');
    });

    await Promise.all(setupPromises);

    // Prepare diverse AI requests
    const aiRequests = [
      { ai: 'wayneAI', query: 'React Hooks의 최적화 방법을 설명해주세요.' },
      { ai: 'consultingAI', query: '스타트업 마케팅 전략을 제안해주세요.' },
      { ai: 'wayneAI', query: 'Node.js 성능 튜닝 기법을 알려주세요.' },
      { ai: 'consultingAI', query: '팀 생산성 향상 방법을 제안해주세요.' },
      { ai: 'wayneAI', query: 'PostgreSQL 쿼리 최적화 방법은?' },
      { ai: 'consultingAI', query: 'B2B 영업 전략을 설계해주세요.' },
      { ai: 'wayneAI', query: 'Docker 컨테이너 보안 가이드를 제공해주세요.' },
      { ai: 'consultingAI', query: '원격 팀 관리 베스트 프랙티스는?' }
    ];

    // Execute concurrent requests
    const startTime = Date.now();
    
    const requestPromises = pages.map(async (page, index) => {
      const request = aiRequests[index];
      await helpers.sendAIMessage(page, request.query, request.ai as 'wayneAI' | 'consultingAI');
      return page.waitForSelector('.message-ai', { timeout: 45000 });
    });

    try {
      await Promise.all(requestPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(`${concurrentUsers} concurrent AI requests completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(60000); // Should complete within 60 seconds

      // Verify all responses received
      for (let i = 0; i < pages.length; i++) {
        const response = await pages[i].locator('.message-ai').textContent();
        expect(response).toBeTruthy();
        expect(response?.length).toBeGreaterThan(50);
      }

    } catch (error) {
      console.error('Concurrent request test failed:', error);
      throw error;
    } finally {
      await context.close();
    }
  });

  test('Sustained AI Load Over Time', async ({ page }) => {
    const credentials = helpers.getTestUser(810);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Sustained-Load');

    const testDuration = 5 * 60 * 1000; // 5 minutes
    const requestInterval = 15000; // 15 seconds between requests
    const expectedRequests = Math.floor(testDuration / requestInterval);
    
    const queries = [
      'JavaScript 비동기 프로그래밍 패턴을 설명해주세요.',
      '애자일 개발 방법론의 핵심 원칙은?',
      'RESTful API 설계 가이드라인을 제공해주세요.',
      '스타트업 펀딩 전략을 알려주세요.',
      'React 상태 관리 라이브러리 비교해주세요.',
      '고객 여정 맵핑 방법을 설명해주세요.'
    ];

    let completedRequests = 0;
    let failedRequests = 0;
    const responseTimes: number[] = [];

    const startTime = Date.now();
    
    while (Date.now() - startTime < testDuration) {
      const requestStartTime = Date.now();
      const query = queries[completedRequests % queries.length];
      const aiType = completedRequests % 2 === 0 ? 'wayneAI' : 'consultingAI';

      try {
        await helpers.sendAIMessage(page, query, aiType);
        await page.waitForSelector(`.message-ai >> nth=${completedRequests}`, { 
          timeout: 30000 
        });
        
        const responseTime = Date.now() - requestStartTime;
        responseTimes.push(responseTime);
        completedRequests++;
        
        console.log(`Request ${completedRequests} completed in ${responseTime}ms`);
        
      } catch (error) {
        failedRequests++;
        console.error(`Request ${completedRequests + 1} failed:`, error);
      }

      // Wait for next request interval
      if (Date.now() - startTime < testDuration) {
        await page.waitForTimeout(requestInterval);
      }
    }

    // Calculate performance metrics
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const successRate = (completedRequests / (completedRequests + failedRequests)) * 100;

    console.log('Sustained load test results:', {
      duration: testDuration / 1000,
      completedRequests,
      failedRequests,
      successRate: `${successRate.toFixed(2)}%`,
      averageResponseTime: `${averageResponseTime.toFixed(2)}ms`
    });

    // Performance assertions
    expect(successRate).toBeGreaterThan(80); // At least 80% success rate
    expect(averageResponseTime).toBeLessThan(25000); // Average under 25 seconds
    expect(completedRequests).toBeGreaterThan(expectedRequests * 0.7); // At least 70% of expected requests
  });

  test('AI Type Distribution Load Test', async ({ browser }) => {
    const context = await browser.newContext();
    const userCount = 6;
    const pages = await Promise.all(
      Array(userCount).fill(0).map(() => context.newPage())
    );

    // Setup users
    for (let i = 0; i < pages.length; i++) {
      const credentials = helpers.getTestUser(820 + i);
      await helpers.registerUser(pages[i], credentials);
      await helpers.joinOrCreateRoom(pages[i], 'AI-Distribution-Test');
    }

    // Define AI type distribution (70% wayneAI, 30% consultingAI)
    const aiDistribution = [
      { type: 'wayneAI', percentage: 70 },
      { type: 'consultingAI', percentage: 30 }
    ];

    const totalRequests = 30;
    const requestsPerAI = aiDistribution.map(ai => ({
      type: ai.type,
      count: Math.floor(totalRequests * (ai.percentage / 100))
    }));

    console.log('AI Distribution:', requestsPerAI);

    const wayneAIQueries = [
      '마이크로서비스 아키텍처 설계 원칙을 설명해주세요.',
      'GraphQL과 REST API의 차이점은?',
      'Kubernetes 배포 전략을 알려주세요.',
      '함수형 프로그래밍 개념을 설명해주세요.',
      'CI/CD 파이프라인 구축 방법은?'
    ];

    const consultingAIQueries = [
      '디지털 전환 전략을 수립해주세요.',
      '고객 만족도 향상 방법을 제안해주세요.',
      '비즈니스 모델 혁신 아이디어를 제공해주세요.',
      '조직 문화 개선 방안을 알려주세요.'
    ];

    // Execute distributed load
    const startTime = Date.now();
    let requestCount = 0;

    for (const aiRequest of requestsPerAI) {
      for (let i = 0; i < aiRequest.count; i++) {
        const pageIndex = requestCount % pages.length;
        const page = pages[pageIndex];
        
        const queries = aiRequest.type === 'wayneAI' ? wayneAIQueries : consultingAIQueries;
        const query = queries[i % queries.length];
        
        await helpers.sendAIMessage(page, query, aiRequest.type as 'wayneAI' | 'consultingAI');
        requestCount++;
        
        // Stagger requests to simulate realistic usage
        await page.waitForTimeout(500);
      }
    }

    // Wait for all responses
    const responsePromises = [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const expectedResponses = Math.ceil(totalRequests / pages.length);
      
      for (let j = 0; j < expectedResponses; j++) {
        responsePromises.push(
          page.waitForSelector(`.message-ai >> nth=${j}`, { timeout: 45000 })
            .catch(() => null) // Allow some failures
        );
      }
    }

    await Promise.allSettled(responsePromises);
    const endTime = Date.now();
    
    console.log(`Distributed load test completed in ${endTime - startTime}ms`);

    // Verify response quality across AI types
    let wayneAIResponses = 0;
    let consultingAIResponses = 0;

    for (const page of pages) {
      const responses = await page.locator('.message-ai').count();
      
      for (let i = 0; i < responses; i++) {
        const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
        if (response && response.length > 50) {
          // Classify response by content
          if (/코드|개발|기술|프로그래밍/.test(response)) {
            wayneAIResponses++;
          } else if (/비즈니스|전략|고객|조직/.test(response)) {
            consultingAIResponses++;
          }
        }
      }
    }

    console.log('Response classification:', {
      wayneAI: wayneAIResponses,
      consultingAI: consultingAIResponses,
      total: wayneAIResponses + consultingAIResponses
    });

    expect(wayneAIResponses + consultingAIResponses).toBeGreaterThan(totalRequests * 0.8);
    await context.close();
  });

  test('Peak Load Burst Testing', async ({ browser }) => {
    const context = await browser.newContext();
    const burstSize = 12;
    const pages = await Promise.all(
      Array(burstSize).fill(0).map(() => context.newPage())
    );

    // Quick setup for burst test
    const setupPromises = pages.map(async (page, index) => {
      const credentials = helpers.getTestUser(830 + index);
      await helpers.registerUser(page, credentials);
      await helpers.joinOrCreateRoom(page, 'Burst-Test');
    });

    await Promise.all(setupPromises);

    // Prepare burst queries
    const burstQueries = [
      '간단한 React 컴포넌트 예시를 보여주세요.',
      '스타트업 아이디어 검증 방법은?',
      'Git 브랜치 전략을 설명해주세요.',
      '팀 커뮤니케이션 개선 방법은?',
      'CSS Flexbox 사용법을 알려주세요.',
      '고객 피드백 수집 방법을 제안해주세요.',
      'JavaScript 디버깅 팁을 알려주세요.',
      '프로젝트 관리 도구 추천해주세요.',
      'API 문서화 방법을 설명해주세요.',
      '사용자 경험 개선 아이디어를 제공해주세요.',
      'Docker 기본 사용법을 알려주세요.',
      '브랜딩 전략을 수립해주세요.'
    ];

    // Execute burst - all requests at once
    const burstStartTime = Date.now();
    
    const burstPromises = pages.map(async (page, index) => {
      const query = burstQueries[index];
      const aiType = index % 2 === 0 ? 'wayneAI' : 'consultingAI';
      
      await helpers.sendAIMessage(page, query, aiType);
      return page.waitForSelector('.message-ai', { timeout: 60000 });
    });

    const results = await Promise.allSettled(burstPromises);
    const burstEndTime = Date.now();
    const burstDuration = burstEndTime - burstStartTime;

    // Analyze burst results
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    const successRate = (successful / burstSize) * 100;

    console.log('Burst test results:', {
      burstSize,
      successful,
      failed,
      successRate: `${successRate.toFixed(2)}%`,
      duration: `${burstDuration}ms`,
      avgTimePerRequest: `${(burstDuration / successful).toFixed(2)}ms`
    });

    // Assertions for burst test
    expect(successRate).toBeGreaterThan(60); // At least 60% should succeed under burst
    expect(burstDuration).toBeLessThan(90000); // Should complete within 90 seconds
    expect(successful).toBeGreaterThan(burstSize * 0.5); // At least half should succeed

    await context.close();
  });
});
