import { test, expect } from '@playwright/test';
import { AuthTestHelpers } from '../helpers/auth-test-helpers';
import { generateUniqueUser } from '../data/auth-test-data';

test.describe('유효한 회원가입 테스트', () => {
  let authHelper: AuthTestHelpers;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelpers(page);
  });

  test('새 사용자 회원가입', async ({ page }) => {
    const newUser = generateUniqueUser();
    
    await authHelper.register(newUser);
    
    // 회원가입 후 채팅방 목록으로 이동 확인
    await expect(page).toHaveURL('/chat-rooms');
    await expect(page.locator('.chat-rooms-card')).toBeVisible();
  });

  test('회원가입 폼 필드 검증', async ({ page }) => {
    await page.goto('/register');
    
    // 필수 필드들이 있는지 확인
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('회원가입 후 자동 로그인', async ({ page }) => {
    const newUser = generateUniqueUser();
    
    await authHelper.register(newUser);
    
    // 로그인 상태 확인 (드롭다운 메뉴가 보이는지)
    await expect(page.locator('[data-toggle="dropdown"]')).toBeVisible();
  });
});
