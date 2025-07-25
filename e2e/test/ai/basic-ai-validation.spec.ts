// test/ai/basic-ai-validation.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('Basic AI Validation', () => {
  const helpers = new TestHelpers();

  test('Simple AI Interaction Test', async ({ page }) => {
    // Skip browser setup, just test basic functionality
    test.setTimeout(120000); // 2 minutes timeout
    
    try {
      // Use existing user credentials
      const credentials = helpers.getTestUser(0);
      console.log('Starting registration with:', credentials.email);
      
      // Navigate directly to homepage first
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Try registration
      await helpers.registerUser(page, credentials);
      console.log('Registration successful');
      
      // Create/join a room
      const roomName = 'Basic-AI-Test-' + Date.now();
      await helpers.joinOrCreateRoom(page, roomName);
      console.log('Room created/joined:', roomName);
      
      // Test basic AI interaction
      await helpers.sendAIMessage(page, '안녕하세요 테스트입니다', 'wayneAI');
      console.log('AI message sent');
      
      // Wait for AI response
      await page.waitForSelector('.message-ai', { timeout: 30000 });
      console.log('AI response received');
      
      // Verify response
      const response = await page.locator('.message-ai').textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(10);
      
      console.log('✅ Basic AI test completed successfully');
      
    } catch (error) {
      console.error('❌ Basic AI test failed:', error);
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: `test-results/basic-ai-test-error-${Date.now()}.png`,
        fullPage: true 
      });
      
      throw error;
    }
  });

  test('Quick Wayne AI Technical Question', async ({ page }) => {
    test.setTimeout(90000);
    
    const credentials = helpers.getTestUser(1);
    
    // Navigate to home page
    await page.goto('http://localhost:3000', { timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Register/login
    await helpers.registerUser(page, credentials);
    
    // Join room
    await helpers.joinOrCreateRoom(page, 'Tech-Quick-Test');
    
    // Ask technical question
    await helpers.sendAIMessage(page, 'JavaScript의 var와 let의 차이점은?', 'wayneAI');
    
    // Wait for response
    await page.waitForSelector('.message-ai', { timeout: 25000 });
    
    const response = await page.locator('.message-ai').textContent();
    expect(response).toBeTruthy();
    expect(response?.length).toBeGreaterThan(20);
    
    // Should mention key differences
    const hasRelevantContent = /var|let|스코프|호이스팅|block/i.test(response || '');
    expect(hasRelevantContent).toBeTruthy();
    
    console.log('✅ Wayne AI technical test passed');
  });

  test('Quick Consulting AI Business Question', async ({ page }) => {
    test.setTimeout(90000);
    
    const credentials = helpers.getTestUser(2);
    
    await page.goto('http://localhost:3000', { timeout: 30000 });
    await page.waitForTimeout(1000);
    
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Business-Quick-Test');
    
    // Ask business question
    await helpers.sendAIMessage(page, '스타트업 초기 단계에서 가장 중요한 것은?', 'consultingAI');
    
    await page.waitForSelector('.message-ai', { timeout: 25000 });
    
    const response = await page.locator('.message-ai').textContent();
    expect(response).toBeTruthy();
    expect(response?.length).toBeGreaterThan(30);
    
    // Should mention business concepts
    const hasBusinessContent = /고객|시장|제품|비즈니스|전략/i.test(response || '');
    expect(hasBusinessContent).toBeTruthy();
    
    console.log('✅ Consulting AI business test passed');
  });
});
