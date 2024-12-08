// test/ai/ai.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('AI 상호작용 테스트', () => {
  const helpers = new TestHelpers();

  test('다양한 AI와의 대화', async ({ page }) => {
    // 사용자 등록 및 채팅방 생성
    const credentials = helpers.getTestUser(Math.floor(Math.random() * 1001));
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'AI-Test');
    
    // Wayne AI와 대화
    await helpers.sendAIMessage(page, '안녕하세요', 'wayneAI');
    await expect(page.locator('.message-ai').last()).toBeVisible();
    
    // Consulting AI와 대화
    await helpers.sendAIMessage(page, '비즈니스 조언이 필요해요', 'consultingAI');
    await expect(page.locator('.message-ai').last()).toBeVisible();
    
    // 기본값(wayneAI) 사용
    await helpers.sendAIMessage(page, '감사합니다');
    await expect(page.locator('.message-ai').last()).toBeVisible();
  });
});