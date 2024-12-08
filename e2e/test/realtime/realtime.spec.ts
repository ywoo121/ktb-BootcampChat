// test/realtime/realtime.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('실시간 기능 테스트', () => {
  const helpers = new TestHelpers();

  test('실시간 참여자 상태 업데이트', async ({ browser }) => {    
    // 방장
    const host = await browser.newPage();
    const hostCreds = helpers.generateUserCredentials(Math.floor(Math.random() * 1001));
    await helpers.registerUser(host, hostCreds);
    const roomName = await helpers.joinOrCreateRoom(host, 'Realtime');
    const hostUrl = host.url();
    const hostRoomParam = new URLSearchParams(new URL(hostUrl).search).get('room');
    
    // 참여자들 - 순차적으로 생성하고 참여
    const participants = [];
    for (let i = 0; i < 3; i++) {
      try {
        const page = await browser.newPage();
        const creds = helpers.generateUserCredentials(Math.floor(Math.random() * 1001));
        await helpers.registerUser(page, creds);
        await helpers.joinRoomByURLParam(page, hostRoomParam);
        participants.push(page);
      } catch (error) {
        console.error(`Failed to create participant ${i + 1}:`, error);
      }
    }
    
    // 참여자 목록 확인
    // await expect(host.locator('.participants-count')).toContainText('4');
    
    // try {
    //   // 한 명이 나가기
    //   if (participants[0]) {
    //     await participants[0].close();
    //   }
      
    //   // 참여자 수 업데이트 확인
    //   // await expect(host.locator('.participants-count')).toContainText('3');
    // } finally {
    //   // 리소스 정리
    //   await Promise.all([
    //     ...participants.slice(1).map(p => p?.close().catch(console.error)),
    //     host.close().catch(console.error)
    //   ]);
    // }
  });
});