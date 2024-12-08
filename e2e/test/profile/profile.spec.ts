// test/profile/profile.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('프로필 테스트', () => {
  const helpers = new TestHelpers();

  test('프로필 수정', async ({ page }) => {
    const credentials = helpers.generateUserCredentials(1);
    await helpers.registerUser(page, credentials);
    
    // 프로필 페이지로 이동
    await page.goto('/profile');
    
    // 이름 변경
    const newName = `Updated ${credentials.name}`;
    await page.fill('input[id="name"]', newName);
    await page.click('button:has-text("저장")');
    
    // 변경 확인
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.alert')).toBeVisible();
    await page.reload();
    await expect(page.locator('input[id="name"]')).toHaveValue(newName);
  });
});