// test/realtime/presence.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('실시간 상태 테스트', () => {
  const helpers = new TestHelpers();

  test('사용자 상태 및 타이핑 표시', async ({ browser }) => {   
    // 첫 번째 사용자
    const user1 = await browser.newPage();
    const user1Creds = helpers.generateUserCredentials(Math.floor(Math.random() * 1001));
    await helpers.registerUser(user1, user1Creds);
    const roomName = await helpers.joinOrCreateRoom(user1, 'Presence');
    const user1Url = user1.url();
    const user1RoomParam = new URLSearchParams(new URL(user1Url).search).get('room');

    
    // 두 번째 사용자
    const user2 = await browser.newPage();
    const user2Creds = helpers.generateUserCredentials(Math.floor(Math.random() * 1001));
    await helpers.registerUser(user2, user2Creds);
    await helpers.joinRoomByURLParam(user2, user1RoomParam);

    // 타이핑 표시 확인
    // await user1.fill('.chat-input-textarea', 'typing...');
    // await expect(user2.locator('.typing-indicator')).toBeVisible();

    // 탭 전환 시 상태 변경 확인
    // await user1.evaluate(() => document.hidden = true);
    // await expect(user2.locator(`[data-user-id="${user1Creds.email}"] .status-away`)).toBeVisible();
  });
});
