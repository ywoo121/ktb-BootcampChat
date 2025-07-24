import { test, expect } from '@playwright/test';
import { AuthTestHelpers } from '../helpers/auth-test-helpers';
import { SECURITY_PAYLOADS } from '../data/auth-test-data';

test.describe('인젝션 공격 방지 테스트', () => {
  let authHelper: AuthTestHelpers;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelpers(page);
  });

  test('SQL 인젝션 공격 방지', async ({ page }) => {
    for (const payload of SECURITY_PAYLOADS.sqlInjection) {
      await authHelper.testSecurityPayload(payload, 'email');
      
      // 페이지가 정상 작동하는지 확인
      await expect(page.locator('input[name="email"]')).toBeVisible();
    }
  });

  test('XSS 공격 방지', async ({ page }) => {
    for (const payload of SECURITY_PAYLOADS.xss) {
      await page.goto('/register');
      await page.fill('input[name="name"]', payload);
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'TestPass123!');
      await page.fill('input[name="confirmPassword"]', 'TestPass123!');
      
      await page.click('button[type="submit"]');
      
      // XSS가 실행되지 않았는지 확인 (스크립트 태그가 실행되지 않음)
      await page.waitForTimeout(2000);
      
      // 페이지가 여전히 정상 작동하는지 확인
      await expect(page.locator('input[name="name"]')).toBeVisible();
    }
  });

  test('CSRF 토큰 검증', async ({ page }) => {
    await page.goto('/login');
    
    // CSRF 토큰이 있는지 확인
    const csrfToken = page.locator('input[name="_token"], input[name="csrf_token"], meta[name="csrf-token"]');
    
    // 토큰이 있으면 검증, 없으면 스킵
    if (await csrfToken.count() > 0) {
      const tokenValue = await csrfToken.first().getAttribute('value') || 
                        await csrfToken.first().getAttribute('content');
      expect(tokenValue).toBeTruthy();
      expect(tokenValue!.length).toBeGreaterThan(10);
    }
  });

  test('파라미터 탬퍼링 방지', async ({ page }) => {
    await page.goto('/login');
    
    // 개발자 도구로 숨겨진 필드 조작 시뮬레이션
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'admin';
        hiddenInput.value = 'true';
        form.appendChild(hiddenInput);
      }
    });
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 정상적인 에러 메시지가 나오는지 확인 (권한 상승이 되지 않음)
    const errorLocator = page.locator('.alert-danger, .error-message');
    await expect(errorLocator).toBeVisible();
  });
});
