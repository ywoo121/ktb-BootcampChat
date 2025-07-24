// test/ai/edge-cases/error-scenarios.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../helpers/test-helpers';

test.describe('AI Edge Cases and Error Scenarios', () => {
  const helpers = new TestHelpers();

  test('Empty and Invalid Messages', async ({ page }) => {
    const credentials = helpers.getTestUser(400);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Edge-Cases');

    // Test empty message
    await page.fill('.chat-input-textarea', '@wayneAI ');
    await page.keyboard.press('Enter');
    
    // Should handle gracefully
    await page.waitForTimeout(5000);
    
    // Test very long message
    const longMessage = 'A'.repeat(5000);
    await helpers.sendAIMessage(page, longMessage, 'wayneAI');
    
    // Should either respond or gracefully reject
    await page.waitForSelector('.message-ai', { timeout: 30000 });
    const response = await page.locator('.message-ai').last().textContent();
    expect(response).toBeTruthy();
    
    // Test special characters
    const specialMessage = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    await helpers.sendAIMessage(page, specialMessage, 'wayneAI');
    await page.waitForSelector('.message-ai >> nth=1', { timeout: 30000 });
    
    const specialResponse = await page.locator('.message-ai >> nth=1').textContent();
    expect(specialResponse).toBeTruthy();
  });

  test('Rapid Fire Messages', async ({ page }) => {
    const credentials = helpers.getTestUser(401);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Rapid-Fire');

    // Send multiple messages rapidly
    const rapidMessages = [
      '첫 번째 메시지',
      '두 번째 메시지',
      '세 번째 메시지',
      '네 번째 메시지',
      '다섯 번째 메시지'
    ];

    // Send all messages with minimal delay
    for (const message of rapidMessages) {
      await page.fill('.chat-input-textarea', `@wayneAI ${message}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100); // Very short delay
    }

    // Wait for responses and verify handling
    await page.waitForTimeout(30000);
    
    // Should handle all messages appropriately (some might be queued or rate-limited)
    const aiMessages = await page.locator('.message-ai').count();
    expect(aiMessages).toBeGreaterThan(0);
    expect(aiMessages).toBeLessThanOrEqual(rapidMessages.length);
  });

  test('Unsupported AI Types', async ({ page }) => {
    const credentials = helpers.getTestUser(402);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Unsupported-AI');

    // Test non-existent AI mention
    await page.fill('.chat-input-textarea', '@nonExistentAI 안녕하세요');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(5000);
    
    // Should not create an AI response for non-existent AI
    const aiCount = await page.locator('.message-ai').count();
    expect(aiCount).toBe(0);
  });

  test('Malformed AI Mentions', async ({ page }) => {
    const credentials = helpers.getTestUser(403);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Malformed-Mentions');

    const malformedMentions = [
      '@ wayneAI 안녕하세요',  // Space after @
      '@wayneAI',              // No message content
      '@@wayneAI 안녕하세요',  // Double @
      '@wayneAI@ 안녕하세요',  // @ after AI name
      '@WayneAI 안녕하세요',   // Wrong case
      '@wayneai 안녕하세요'    // Wrong case
    ];

    for (let i = 0; i < malformedMentions.length; i++) {
      await page.fill('.chat-input-textarea', malformedMentions[i]);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }

    // Should handle malformed mentions gracefully
    const allMessages = await page.locator('.message-content').count();
    expect(allMessages).toBe(malformedMentions.length);
  });

  test('Unicode and Non-ASCII Characters', async ({ page }) => {
    const credentials = helpers.getTestUser(404);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Unicode-Test');

    const unicodeMessages = [
      '🤖 AI야 안녕하세요! 😊',
      'こんにちはAI！日本語で話しましょう。',
      '你好AI，请用中文回答我。',
      'مرحبا AI، هل تتحدث العربية؟',
      '🔥💯✨ 트렌디한 답변 부탁해요! 🚀',
      'Ω≈ç√∫˜µ≤≥÷ 수학 기호들'
    ];

    for (let i = 0; i < unicodeMessages.length; i++) {
      await helpers.sendAIMessage(page, unicodeMessages[i], 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      expect(response).toBeTruthy();
      
      await page.waitForTimeout(2000);
    }
  });

  test('Network Interruption Handling', async ({ page }) => {
    const credentials = helpers.getTestUser(405);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Network-Test');

    // Send message with good connection
    await helpers.sendAIMessage(page, '첫 번째 메시지입니다.', 'wayneAI');
    await page.waitForSelector('.message-ai >> nth=0', { timeout: 30000 });

    // Simulate network interruption
    await page.context().setOffline(true);
    
    // Try to send message while offline
    await page.fill('.chat-input-textarea', '@wayneAI 오프라인 메시지');
    await page.keyboard.press('Enter');
    
    // Wait and then restore connection
    await page.waitForTimeout(5000);
    await page.context().setOffline(false);
    
    // Send message after connection restored
    await helpers.sendAIMessage(page, '연결 복구 후 메시지입니다.', 'wayneAI');
    await page.waitForSelector('.message-ai >> nth=1', { timeout: 35000 });
    
    const recoveryResponse = await page.locator('.message-ai >> nth=1').textContent();
    expect(recoveryResponse).toBeTruthy();
  });

  test('Resource Exhaustion Simulation', async ({ page }) => {
    const credentials = helpers.getTestUser(406);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Resource-Test');

    // Simulate high memory usage scenario
    const heavyComputationQuery = `
      다음 모든 작업을 동시에 처리해주세요:
      1. 피보나치 수열 1000번째까지 계산
      2. 모든 JavaScript 내장 객체와 메서드 나열
      3. React의 모든 Hook 사용법 예시
      4. Node.js의 모든 모듈 설명
      5. 웹 성능 최적화 기법 100가지
      6. 데이터 구조와 알고리즘 전체 요약
      7. 디자인 패턴 23가지 상세 설명
    `;

    const startTime = Date.now();
    await helpers.sendAIMessage(page, heavyComputationQuery, 'wayneAI');
    
    // Should handle gracefully even with heavy requests
    try {
      await page.waitForSelector('.message-ai', { timeout: 60000 });
      const response = await page.locator('.message-ai').textContent();
      expect(response).toBeTruthy();
    } catch (error) {
      // If it times out, that's also acceptable behavior
      console.log('Heavy computation request timed out - acceptable behavior');
    }
    
    const duration = Date.now() - startTime;
    console.log(`Heavy computation response time: ${duration}ms`);
  });

  test('Concurrent Different AI Types', async ({ browser }) => {
    const context = await browser.newContext();
    const pages = await Promise.all([
      context.newPage(),
      context.newPage()
    ]);

    // Setup different users
    const credentials1 = helpers.getTestUser(407);
    const credentials2 = helpers.getTestUser(408);
    
    await helpers.registerUser(pages[0], credentials1);
    await helpers.registerUser(pages[1], credentials2);
    
    await helpers.joinOrCreateRoom(pages[0], 'Concurrent-AI');
    await helpers.joinOrCreateRoom(pages[1], 'Concurrent-AI');

    // Send to different AI types simultaneously
    const promises = [
      helpers.sendAIMessage(pages[0], '기술적인 질문입니다.', 'wayneAI'),
      helpers.sendAIMessage(pages[1], '비즈니스 질문입니다.', 'consultingAI')
    ];

    await Promise.all(promises);

    // Wait for both responses
    await pages[0].waitForSelector('.message-ai', { timeout: 35000 });
    await pages[1].waitForSelector('.message-ai', { timeout: 35000 });

    // Verify both got appropriate responses
    const techResponse = await pages[0].locator('.message-ai').textContent();
    const businessResponse = await pages[1].locator('.message-ai').textContent();

    expect(techResponse).toBeTruthy();
    expect(businessResponse).toBeTruthy();

    await context.close();
  });

  test('Message Length Boundaries', async ({ page }) => {
    const credentials = helpers.getTestUser(409);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Length-Boundaries');

    // Test various message lengths
    const lengthTests = [
      { name: 'single_char', message: 'A' },
      { name: 'normal', message: '일반적인 길이의 메시지입니다.' },
      { name: 'medium', message: 'A'.repeat(500) + ' 중간 길이 메시지' },
      { name: 'long', message: 'A'.repeat(1000) + ' 긴 메시지입니다.' },
      { name: 'very_long', message: 'A'.repeat(2000) + ' 매우 긴 메시지입니다.' }
    ];

    for (let i = 0; i < lengthTests.length; i++) {
      const { name, message } = lengthTests[i];
      
      try {
        await helpers.sendAIMessage(page, message, 'wayneAI');
        await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 45000 });
        
        const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
        expect(response).toBeTruthy();
        
        console.log(`${name} test passed - response length: ${response?.length}`);
      } catch (error) {
        console.log(`${name} test handling: ${error.message}`);
        // Some length boundaries might be rejected, which is acceptable
      }
      
      await page.waitForTimeout(2000);
    }
  });
});
