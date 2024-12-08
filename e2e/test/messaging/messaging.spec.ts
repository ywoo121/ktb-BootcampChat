import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('메시징 테스트', () => {
  const helpers = new TestHelpers();

  test('그룹 채팅 시나리오', async ({ browser }) => {
    const roomPrefix = 'Chat';
    
    // 첫 번째 사용자 설정
    const user1 = await browser.newPage();
    const user1Creds = helpers.getTestUser(Math.floor(Math.random() * 1001));
    await helpers.registerUser(user1, user1Creds);
    
    // 방 생성 및 정확한 방 이름 저장
    const createdRoomName = await helpers.joinOrCreateRoom(user1, roomPrefix);
    console.log(`Created room name: ${createdRoomName}`);

    // 생성된 방의 URL 파라미터 확인
    const hostUrl = user1.url();
    const roomParam = new URLSearchParams(new URL(hostUrl).search).get('room');
    
    if (!roomParam) {
      throw new Error('Failed to get room name from URL');
    }
    
    // 첫 번째 사용자 인사 (프롬프트 키 사용)
    const greeting1 = await helpers.sendMessage(user1, 'GREETING', {
      USER_NAME: user1Creds.name,
      ROOM_NAME: roomParam
    });
    
    // 두 번째 사용자 설정 및 같은 방으로 입장
    const user2 = await browser.newPage();
    const user2Creds = helpers.getTestUser(1);
    await helpers.registerUser(user2, user2Creds);
    await helpers.joinRoomByURLParam(user2, roomParam);

    // 양쪽 모두 동일한 채팅방에 있는지 확인
    for (const user of [user1, user2]) {
      const userHostUrl = user.url();
    	const userRoomParam = new URLSearchParams(new URL(userHostUrl).search).get('room');
      expect(userRoomParam).toBe(roomParam);
    }
    
    // 두 번째 사용자 인사 (프롬프트 키 사용)
    const greeting2 = await helpers.sendMessage(user2, 'GREETING', {
      USER_NAME: user2Creds.name,
      ROOM_NAME: roomParam
    });
    
    // 대화 주제에 대한 의견 교환 (프롬프트 키 사용)
    const topic = '주말 계획';
    const message1 = await helpers.sendMessage(user1, 'GROUP_CHAT', {
      CURRENT_TOPIC: topic,
      USER_NAME: user1Creds.name
    });
    
    // 이전 메시지에 대한 응답 (프롬프트 키 사용)
    const message2 = await helpers.sendMessage(user2, 'CHAT_RESPONSE', {
      PREV_MESSAGE: message1,
      USER_NAME: user2Creds.name
    });

    // AI 의견 요청 (직접 메시지 사용)
    await helpers.sendAIMessage(user1, '우리의 대화를 요약해주세요.');

    // 메시지 표시 확인
    // await expect(user1.locator('.message-content')).toContainText(greeting2);
    // await expect(user2.locator('.message-content')).toContainText(message1);
    // await expect(user1.locator('.message-ai')).toBeVisible();

    // // 테스트 종료 전 채팅방 확인
    // for (const user of [user1, user2]) {
    //   const finalRoomName = await user.locator('.chat-room-title').textContent();
    //   expect(finalRoomName).toBe(roomParam);
    // }

    // 리소스 정리
    await Promise.all([user1.close(), user2.close()]);
  });
});