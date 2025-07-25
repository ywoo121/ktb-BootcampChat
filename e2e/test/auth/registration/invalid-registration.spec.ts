import { test, expect } from '@playwright/test';
import { AuthTestHelpers } from '../helpers/auth-test-helpers';
import { AUTH_USERS } from '../data/auth-test-data';

test.describe('유효하지 않은 회원가입 테스트', () => {
  let authHelper: AuthTestHelpers;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelpers(page);
  });

  test('중복 이메일로 회원가입', async ({ page }) => {
    const existingUser = AUTH_USERS[0];
    
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Duplicate User');
    await page.fill('input[name="email"]', existingUser.email);
    await page.fill('input[name="password"]', 'NewPass123!');
    await page.fill('input[name="confirmPassword"]', 'NewPass123!');
    
    await page.click('button[type="submit"]');
    
    // 중복 이메일 에러 메시지 확인
    const errorLocator = page.locator('.alert-danger, .error-message');
    await expect(errorLocator).toBeVisible();
  });

  test('비밀번호 불일치', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPass456#');
    
    await page.click('button[type="submit"]');
    
    // 비밀번호 불일치 에러 확인
    const errorLocator = page.locator('.alert-danger, .error-message');
    await expect(errorLocator).toBeVisible();
  });

  test('잘못된 이메일 형식', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    await page.click('button[type="submit"]');
    
    // 이메일 형식 에러 확인
    const errorLocator = page.locator('.alert-danger, .error-message');
    await expect(errorLocator).toBeVisible();
  });

  test('빈 필드로 회원가입 시도', async ({ page }) => {
    await page.goto('/register');
    
    // 빈 폼 제출
    await page.click('button[type="submit"]');
    
    // 필드 검증 또는 에러 메시지 확인
    const errorLocator = page.locator('.alert-danger, .error-message');
    await expect(errorLocator).toBeVisible();
  });

  test('약한 비밀번호', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'weakpass@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    
    await page.click('button[type="submit"]');
    
    // 약한 비밀번호 에러 확인
    const errorLocator = page.locator('.alert-danger, .error-message');
    await expect(errorLocator).toBeVisible();
  });
});
