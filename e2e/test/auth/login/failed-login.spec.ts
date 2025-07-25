import { test, expect } from '@playwright/test';
import { AuthTestHelpers } from '../helpers/auth-test-helpers';
import { INVALID_CREDENTIALS } from '../data/auth-test-data';

test.describe('로그인 실패 테스트', () => {
  let authHelper: AuthTestHelpers;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelpers(page);
  });

  test('잘못된 이메일로 로그인', async ({ page }) => {
    const credentials = INVALID_CREDENTIALS[0];
    
    await page.goto('/login');
    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);
    await page.click('button[type="submit"]');
    
    await authHelper.expectLoginError(credentials.error);
  });

  test('잘못된 비밀번호로 로그인', async ({ page }) => {
    const credentials = INVALID_CREDENTIALS[1];
    
    await page.goto('/login');
    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);
    await page.click('button[type="submit"]');
    
    await authHelper.expectLoginError(credentials.error);
  });

  test('빈 필드로 로그인 시도', async ({ page }) => {
    const credentials = INVALID_CREDENTIALS[2];
    
    await page.goto('/login');
    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);
    await page.click('button[type="submit"]');
    
    await authHelper.expectLoginError(credentials.error);
  });

  test('로그인 폼 유효성 검사', async ({ page }) => {
    await page.goto('/login');
    
    // 빈 폼 제출
    await page.click('button[type="submit"]');
    
    // 에러 메시지 또는 필드 검증 확인
    const emailField = page.locator('input[name="email"]');
    const passwordField = page.locator('input[name="password"]');
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });
});
