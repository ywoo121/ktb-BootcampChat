import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('메시징 테스트', () => {
  const helpers = new TestHelpers();

  test('여러 사용자간 실시간 채팅', async ({ browser }) => {
    const roomPrefix = 'Chat';
    
    // 병렬로 사용자 생성 및 등록
    const [user1, user2, user3] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
      browser.newPage()
    ]);

    const users = [user1, user2, user3];
    const credentials = users.map((_, i) => helpers.generateUserCredentials(i + 1));

    // 각 사용자 등록
    await Promise.all([
      helpers.registerUser(user1, credentials[0]),
      helpers.registerUser(user2, credentials[1]),
      helpers.registerUser(user3, credentials[2])
    ]);

    // 첫 번째 사용자가 방 생성 및 정확한 방 이름 저장
    const createdRoomName = await helpers.joinOrCreateRoom(user1, roomPrefix);
    console.log(`Created room name: ${createdRoomName}`);

    // 생성된 방의 URL 파라미터 확인
    const hostUrl = user1.url();
    const roomParam = new URLSearchParams(new URL(hostUrl).search).get('room');
    
    if (!roomParam) {
      throw new Error('Failed to get room name from URL');
    }

    // 나머지 사용자들이 같은 방으로 입장
    await helpers.joinRoomByURLParam(user2, roomParam);
    await helpers.joinRoomByURLParam(user3, roomParam);

    // 모든 사용자가 동일한 채팅방에 있는지 확인
    for (const user of users) {
      const userHostUrl = user.url();
    	const userRoomParam = new URLSearchParams(new URL(userHostUrl).search).get('room');
      expect(userRoomParam).toBe(roomParam);
    }

    // 각 사용자마다 채팅창이 로드될 때까지 대기
    await Promise.all(users.map(async user => {
      // 채팅 컨테이너가 표시될 때까지 대기
      await user.waitForLoadState('networkidle');
      await user.waitForSelector('.chat-container', { 
        state: 'visible',
        timeout: 30000 
      });
      
      // 채팅 입력창이 활성화될 때까지 대기
      await user.waitForLoadState('networkidle');
      await user.waitForSelector('.chat-input-textarea:not([disabled])', {
        state: 'visible',
        timeout: 30000
      });
    }));

    // 메시지 전송 및 검증
    const messages = [
      { user: user1, text: `안녕하세요! ${credentials[0].name}입니다.` },
      { user: user2, text: `반갑습니다! ${credentials[1].name}입니다.` },
      { user: user3, text: `안녕하세요~ ${credentials[2].name}입니다!` }
    ];

    // 메시지를 순차적으로 전송하고 각각 확인
    for (const { user, text } of messages) {
      await helpers.sendMessage(user, text);
      
      // // 모든 사용자의 화면에서 메시지가 표시되는지 확인
      // await Promise.all(users.map(async viewer => {
      //   await viewer.waitForSelector(`.message-content:has-text("${text}")`, {
      //     timeout: 10000
      //   });
      // }));
    }

    // // AI 호출 및 응답 확인
    // await helpers.sendAIMessage(user1, '우리 대화에 대해 요약해줄 수 있나요?');
    // await Promise.all(users.map(async user => {
    //   await user.waitForSelector('.message-ai', {
    //     timeout: 20000
    //   });
    // }));

    // 테스트 종료 전 채팅방 확인
    // for (const user of users) {
    //   const finalRoomName = await user.locator('.chat-room-title').textContent();
    //   expect(finalRoomName).toBe(roomParam);
    // }

    // 리소스 정리
    await Promise.all(users.map(user => user.close()));
  });

  test('파일 공유 및 이모지 반응', async ({ browser }) => {
    const roomPrefix = 'FileShare';
    
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

    // 메시지 전송 및 대기
    const testMessage = '이 메시지에 반응해보세요!';
    await helpers.sendMessage(user1, testMessage);

    // 메시지가 완전히 로드될 때까지 대기
    await user2.waitForLoadState('networkidle');
    // await user2.waitForSelector(`.message-content:has-text("${testMessage}")`, {
    //   state: 'visible',
    //   timeout: 30000
    // });

    // 메시지에 호버 및 반응 버튼 클릭
    const messageElement = user2.locator('.message-actions').last();
    // await messageElement.hover();
    
    // 반응 버튼이 나타날 때까지 대기 후 클릭
    const actionButton = messageElement.locator('button[title="리액션 추가"]');
    await actionButton.waitFor({ state: 'visible', timeout: 30000 });
    await actionButton.click();

    // 이모지 피커의 첫 번째 이모지 선택
    await messageElement.click('.emoji-picker-container button >> nth=0');
    
    // 반응이 표시되는지 확인
    // await Promise.all([
    //   user1.waitForSelector('.reaction-badge', { timeout: 30000 }),
    //   user2.waitForSelector('.reaction-badge', { timeout: 30000 })
    // ]);

    // 테스트 종료 전 채팅방 확인
    // for (const user of [user1, user2]) {
    //   const finalRoomName = await user.locator('.chat-room-title').textContent();
    //   expect(finalRoomName).toBe(roomParam);
    // }

    // 리소스 정리
    await Promise.all([user1.close(), user2.close()]);
  });
});