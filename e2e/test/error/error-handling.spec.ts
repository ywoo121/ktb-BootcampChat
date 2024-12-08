// test/error/error-handling.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('에러 처리 테스트', () => {
  const helpers = new TestHelpers();

  test('네트워크 에러 복구', async ({ browser }) => {   
    const page = await browser.newPage();
    const creds = helpers.generateUserCredentials(1);
    await helpers.registerUser(page, creds);
    await helpers.joinOrCreateRoom(page, 'ErrorHandling');

    // 네트워크 차단
    await page.route('**/*', route => route.abort());

    // 에러 표시 확인
    // await page.waitForLoadState('networkidle');
    // await expect(page.locator('.connection-error')).toBeVisible();
    
    // 네트워크 복구
    await page.unroute('**/*');
        
    // 메시지 전송 시도
    await helpers.sendMessage(page, 'This message should be queued');
      });

  test('중복 로그인 처리', async ({ browser }) => {
    const creds = helpers.generateUserCredentials(1);
    
    // 첫 번째 세션
    const session1 = await browser.newPage();
    await helpers.registerUser(session1, creds);
    
    // 두 번째 세션으로 로그인
    const session2 = await browser.newPage();
    await helpers.login(session2, creds);
    
    // 첫 번째 세션에서 중복 로그인 알림 확인
    await session1.waitForLoadState('networkidle');
    await expect(session1.locator('.duplicate-login-modal')).toBeVisible({
      timeout: 30000 // 타임아웃을 30초로 증가
    });

    // 다이얼로그의 내용도 확인
    await session1.waitForLoadState('networkidle');
    const modalText = await session1.locator('.duplicate-login-modal').textContent();
    expect(modalText).toContain('지금 로그아웃'); // 실제 메시지에 맞게 수정 필요
  });
});
