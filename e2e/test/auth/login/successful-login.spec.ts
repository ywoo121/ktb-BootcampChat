import { test, expect } from '@playwright/test';
import { AuthTestHelpers } from '../helpers/auth-test-helpers';
import { AUTH_USERS } from '../data/auth-test-data';

test.describe('성공적인 로그인 테스트', () => {
  let authHelper: AuthTestHelpers;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelpers(page);
  });

  test('유효한 계정으로 로그인', async ({ page }) => {
    const user = AUTH_USERS[0];
    
    await authHelper.login(user);
    
    // 채팅방 목록 페이지로 이동 확인
    await expect(page).toHaveURL('/chat-rooms');
    
    // 필수 요소들이 로드되었는지 확인
    await expect(page.locator('.chat-rooms-card')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('h5')).toHaveText('채팅방 목록');
  });

  test('로그인 후 로그아웃', async ({ page }) => {
    const user = AUTH_USERS[1];
    
    await authHelper.login(user);
    await authHelper.logout();
    
    // 홈페이지로 돌아갔는지 확인
    await expect(page).toHaveURL('/');
  });

  test('Remember Me 기능', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', AUTH_USERS[0].email);
    await page.fill('input[name="password"]', AUTH_USERS[0].password);
    
    // Remember Me 체크박스가 있다면 체크
    const rememberCheckbox = page.locator('input[name="rememberMe"]');
    if (await rememberCheckbox.isVisible()) {
      await rememberCheckbox.check();
    }
    
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/chat-rooms');
  });
});
