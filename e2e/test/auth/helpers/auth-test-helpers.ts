// e2e/test/auth/helpers/auth-test-helpers.ts

import { Page, expect } from '@playwright/test';
import { AuthUser } from '../data/auth-test-data';

export class AuthTestHelpers {
  constructor(private page: Page) {}

  async login(user: AuthUser): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    await this.page.fill('input[name="email"]', user.email);
    await this.page.fill('input[name="password"]', user.password);

    await Promise.all([
      this.page.waitForURL('/chat-rooms', { timeout: 10000 }),
      this.page.click('button[type="submit"]')
    ]);
  }

  async register(user: AuthUser): Promise<void> {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');

    await this.page.fill('input[name="name"]', user.name);
    await this.page.fill('input[name="email"]', user.email);
    await this.page.fill('input[name="password"]', user.password);
    await this.page.fill('input[name="confirmPassword"]', user.password);

    await Promise.all([
      this.page.waitForURL('/chat-rooms', { timeout: 10000 }),
      this.page.click('button[type="submit"]')
    ]);
  }

  async logout(): Promise<void> {
    await this.page.click('[data-toggle="dropdown"]');
    await this.page.waitForSelector('.dropdown-menu', { state: 'visible' });
    await this.page.click('text=로그아웃');
    await this.page.waitForURL('/');
  }

  async expectLoginError(message: string): Promise<void> {
    const errorLocator = this.page.locator('.alert-danger, .error-message');
    await expect(errorLocator).toBeVisible({ timeout: 10000 });
    await expect(errorLocator).toContainText(message);
  }

  async attemptBruteForce(email: string, attempts: number = 6): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      await this.page.goto('/login');
      await this.page.fill('input[name="email"]', email);
      await this.page.fill('input[name="password"]', `wrong${i}`);
      await this.page.click('button[type="submit"]');
      
      if (i < attempts - 1) {
        await this.page.waitForTimeout(1000);
      }
    }
  }

  async testSecurityPayload(payload: string, field: string = 'email'): Promise<void> {
    await this.page.goto('/login');
    await this.page.fill(`input[name="${field}"]`, payload);
    await this.page.fill('input[name="password"]', 'anypassword');
    await this.page.click('button[type="submit"]');
    
    // Should show normal error, not expose system errors
    const errorLocator = this.page.locator('.alert-danger');
    await expect(errorLocator).toBeVisible();
    const errorText = await errorLocator.textContent();
    expect(errorText).not.toMatch(/sql|database|error|exception/i);
  }
}
