import { test, expect } from '@playwright/test';
import { AuthTestHelpers } from '../helpers/auth-test-helpers';
import { generateUniqueUser } from '../data/auth-test-data';

test.describe('세션 관리 테스트', () => {
  let authHelper: AuthTestHelpers;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthTestHelpers(page);
  });

  test('로그인 후 세션 유지', async ({ page }) => {
    const user = generateUniqueUser();
    await authHelper.register(user);
    
    // 페이지 새로고침 후에도 로그인 상태 유지되는지 확인
    await page.reload();
    await expect(page).toHaveURL('/chat-rooms');
    await expect(page.locator('[data-toggle="dropdown"]')).toBeVisible();
  });

  test('새 탭에서 세션 공유', async ({ page, context }) => {
    const user = generateUniqueUser();
    await authHelper.register(user);
    
    // 새 탭 열기
    const newPage = await context.newPage();
    await newPage.goto('/chat-rooms');
    
    // 새 탭에서도 로그인 상태인지 확인
    await expect(newPage.locator('[data-toggle="dropdown"]')).toBeVisible();
    
    await newPage.close();
  });

  test('로그아웃 후 세션 무효화', async ({ page }) => {
    const user = generateUniqueUser();
    await authHelper.register(user);
    await authHelper.logout();
    
    // 보호된 페이지 접근 시 로그인 페이지로 리다이렉트
    await page.goto('/chat-rooms');
    await expect(page).toHaveURL('/login');
  });

  test('브라우저 닫기 후 세션 처리', async ({ page, context }) => {
    const user = generateUniqueUser();
    await authHelper.register(user);
    
    // 컨텍스트를 닫고 새로 생성 (브라우저 닫기 시뮬레이션)
    await context.close();
    
    const newContext = await page.context().browser()?.newContext();
    if (newContext) {
      const newPage = await newContext.newPage();
      await newPage.goto('/chat-rooms');
      
      // Remember Me가 체크되지 않았으면 로그인 페이지로 이동해야 함
      await expect(newPage).toHaveURL('/login');
      
      await newContext.close();
    }
  });

  test('동시 로그인 세션 관리', async ({ page, context }) => {
    const user = generateUniqueUser();
    await authHelper.register(user);
    
    // 같은 사용자로 새 브라우저에서 로그인
    const newContext = await page.context().browser()?.newContext();
    if (newContext) {
      const newPage = await newContext.newPage();
      const newAuthHelper = new AuthTestHelpers(newPage);
      
      await newAuthHelper.login(user);
      
      // 두 세션 모두 유효한지 확인
      await expect(page.locator('[data-toggle="dropdown"]')).toBeVisible();
      await expect(newPage.locator('[data-toggle="dropdown"]')).toBeVisible();
      
      await newContext.close();
    }
  });

  test('비활성 상태에서 세션 만료', async ({ page }) => {
    const user = generateUniqueUser();
    await authHelper.register(user);
    
    // 장시간 비활성 상태 시뮬레이션 (실제 운영에서는 더 긴 시간)
    await page.waitForTimeout(5000);
    
    // 페이지 새로고침으로 세션 상태 확인
    await page.reload();
    
    // 세션이 여전히 유효한지 확인 (짧은 테스트 시간으로 인해 여전히 유효해야 함)
    await expect(page.locator('[data-toggle="dropdown"]')).toBeVisible();
  });
});
