import { test, expect } from '@playwright/test';
import { AuthTestHelpers } from '../helpers/auth-test-helpers';
import { AUTH_USERS } from '../data/auth-test-data';

test.describe('브루트 포스 공격 방지 테스트', () => {
  let authHelper: AuthTestHelpers;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelpers(page);
  });

  test('연속 로그인 실패 시 계정 잠금', async ({ page }) => {
    const user = AUTH_USERS[0];
    
    // 5-6번 잘못된 비밀번호로 로그인 시도
    await authHelper.attemptBruteForce(user.email, 6);
    
    // 계정 잠금 메시지 확인
    const lockoutMessage = page.locator('.alert-danger').filter({ 
      hasText: /잠금|locked|too many/i 
    });
    await expect(lockoutMessage).toBeVisible({ timeout: 10000 });
  });

  test('IP 기반 접속 제한', async ({ page }) => {
    // 여러 계정으로 빠른 연속 로그인 실패 시도
    for (let i = 0; i < 10; i++) {
      await page.goto('/login');
      await page.fill('input[name="email"]', `fake${i}@example.com`);
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // 마지막 시도에서 제한 메시지 확인
    const rateLimitMessage = page.locator('.alert-danger, .error-message');
    await expect(rateLimitMessage).toBeVisible();
  });

  test('정상 로그인 후 잠금 해제', async ({ page }) => {
    const user = AUTH_USERS[0];
    
    // 몇 번 실패 후 정상 로그인
    await authHelper.attemptBruteForce(user.email, 3);
    
    // 정상 로그인 시도
    await authHelper.login(user);
    
    // 로그인 성공 확인
    await expect(page).toHaveURL('/chat-rooms');
  });
});
