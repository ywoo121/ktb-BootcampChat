// test/ai/performance/response-timing.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../helpers/test-helpers';

test.describe('AI Response Performance', () => {
  const helpers = new TestHelpers();

  test('Response Time Benchmarks', async ({ page }) => {
    const credentials = helpers.getTestUser(300);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Performance-Test');

    const testQueries = [
      { type: 'simple', query: '안녕하세요', expectedMaxTime: 10000 },
      { type: 'medium', query: 'JavaScript의 기본 문법을 설명해주세요.', expectedMaxTime: 15000 },
      { type: 'complex', query: '마이크로서비스 아키텍처의 장단점과 구현 시 고려사항을 상세히 설명해주세요.', expectedMaxTime: 25000 }
    ];

    for (let i = 0; i < testQueries.length; i++) {
      const { type, query, expectedMaxTime } = testQueries[i];
      
      const startTime = Date.now();
      
      await helpers.sendAIMessage(page, query, 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`${type} query response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(expectedMaxTime);
      
      // Verify response quality isn't sacrificed for speed
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      expect(response).toBeTruthy();
      if (type === 'simple') {
        expect(response?.length).toBeGreaterThan(10);
      } else if (type === 'medium') {
        expect(response?.length).toBeGreaterThan(50);
      } else {
        expect(response?.length).toBeGreaterThan(100);
      }
      
      await page.waitForTimeout(2000);
    }
  });

  test('Concurrent AI Requests', async ({ browser }) => {
    const context = await browser.newContext();
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ]);

    // Setup users for each page
    for (let i = 0; i < pages.length; i++) {
      const credentials = helpers.getTestUser(301 + i);
      await helpers.registerUser(pages[i], credentials);
      await helpers.joinOrCreateRoom(pages[i], 'Concurrent-Test');
    }

    const queries = [
      'React 컴포넌트 최적화 방법을 알려주세요.',
      'Node.js의 이벤트 루프에 대해 설명해주세요.',
      'PostgreSQL과 MongoDB의 차이점은 무엇인가요?'
    ];

    // Send concurrent requests
    const startTime = Date.now();
    const promises = pages.map((page, index) => 
      helpers.sendAIMessage(page, queries[index], 'wayneAI')
    );
    
    await Promise.all(promises);

    // Wait for all responses
    for (let i = 0; i < pages.length; i++) {
      await pages[i].waitForSelector('.message-ai', { timeout: 35000 });
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`Concurrent requests completed in: ${totalTime}ms`);
    
    // Should handle concurrent requests reasonably well
    expect(totalTime).toBeLessThan(40000);

    // Verify all responses are received
    for (const page of pages) {
      const response = await page.locator('.message-ai').textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(50);
    }

    await context.close();
  });

  test('Memory Usage Pattern', async ({ page }) => {
    const credentials = helpers.getTestUser(304);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Memory-Test');

    // Send a series of messages to test memory accumulation
    const messageCount = 20;
    const baseQuery = 'JavaScript의 ';
    const topics = [
      '변수 선언', '함수 정의', '객체 생성', '배열 조작', '문자열 처리',
      '이벤트 처리', 'DOM 조작', 'AJAX 요청', '에러 처리', '모듈 시스템',
      '클로저', '프로토타입', '비동기 처리', '정규표현식', '타입 검사',
      'ES6 문법', '스코프', '호이스팅', '콜백', '프라미스'
    ];

    for (let i = 0; i < messageCount; i++) {
      const query = baseQuery + topics[i] + '에 대해 설명해주세요.';
      
      await helpers.sendAIMessage(page, query, 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      // Monitor page performance every 5 messages
      if ((i + 1) % 5 === 0) {
        const performanceMetrics = await page.evaluate(() => {
          return {
            heapUsed: (performance as any).memory?.usedJSHeapSize,
            heapTotal: (performance as any).memory?.totalJSHeapSize,
            heapLimit: (performance as any).memory?.jsHeapSizeLimit
          };
        });
        
        console.log(`Message ${i + 1} - Memory usage:`, performanceMetrics);
        
        // Basic memory leak detection
        if (performanceMetrics.heapUsed && performanceMetrics.heapTotal) {
          const usageRatio = performanceMetrics.heapUsed / performanceMetrics.heapTotal;
          expect(usageRatio).toBeLessThan(0.9); // Should not use more than 90% of heap
        }
      }
      
      await page.waitForTimeout(1000);
    }
  });

  test('Large Response Handling', async ({ page }) => {
    const credentials = helpers.getTestUser(305);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Large-Response-Test');

    const complexQuery = `
      다음 주제들에 대해 각각 상세히 설명해주세요:
      1. React의 생명주기 메서드와 Hooks의 관계
      2. JavaScript의 이벤트 루프와 비동기 처리
      3. RESTful API 설계 원칙과 Best Practices
      4. 웹 성능 최적화 기법 10가지
      5. 데이터베이스 정규화와 인덱싱
    `;

    const startTime = Date.now();
    
    await helpers.sendAIMessage(page, complexQuery, 'wayneAI');
    await page.waitForSelector('.message-ai', { timeout: 45000 });
    
    const responseTime = Date.now() - startTime;
    const response = await page.locator('.message-ai').textContent();
    
    // Performance expectations for large responses
    expect(responseTime).toBeLessThan(45000);
    expect(response).toBeTruthy();
    expect(response?.length).toBeGreaterThan(500); // Should be substantial
    
    // Verify response covers all requested topics
    const topics = ['React', '이벤트 루프', 'RESTful', '성능 최적화', '데이터베이스'];
    topics.forEach(topic => {
      expect(response?.includes(topic)).toBeTruthy(`Response should mention: ${topic}`);
    });
  });

  test('Error Recovery Performance', async ({ page }) => {
    const credentials = helpers.getTestUser(306);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Error-Recovery-Test');

    // Simulate network issues by temporarily going offline
    await page.context().setOffline(true);
    
    // Try to send a message while offline
    await helpers.sendAIMessage(page, '네트워크 오류 테스트', 'wayneAI');
    
    // Wait a bit then go back online
    await page.waitForTimeout(3000);
    await page.context().setOffline(false);
    
    // Send a message after recovery
    const recoveryStartTime = Date.now();
    await helpers.sendAIMessage(page, '네트워크 복구 후 첫 메시지입니다.', 'wayneAI');
    
    await page.waitForSelector('.message-ai', { timeout: 30000 });
    const recoveryTime = Date.now() - recoveryStartTime;
    
    console.log(`Recovery response time: ${recoveryTime}ms`);
    expect(recoveryTime).toBeLessThan(30000);
    
    const response = await page.locator('.message-ai').textContent();
    expect(response).toBeTruthy();
  });
});
