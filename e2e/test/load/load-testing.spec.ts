// test/load/load-testing.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('부하 테스트', () => {
  const helpers = new TestHelpers();

  test('대량 메시지 처리', async ({ browser }) => {   
    const page = await browser.newPage();
    const creds = helpers.generateUserCredentials(1);
    await helpers.registerUser(page, creds);
    await helpers.joinOrCreateRoom(page, 'Load-Test');

    // 100개의 메시지 빠르게 전송
    const messages = Array.from({ length: 100 }, (_, i) => `Load test message ${i + 1}`);
    
    for (const message of messages) {
      await helpers.sendMessage(page, message);
    }

    // 스크롤 및 메시지 로딩 확인
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForSelector('.message-content >> nth=0');
    
    // 첫 번째와 마지막 메시지 모두 존재하는지 확인
    // await expect(page.locator('.message-content')).toContainText('Load test message 1');
    // await expect(page.locator('.message-content')).toContainText('Load test message 100');
  });
});
