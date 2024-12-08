import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('AI 축구 논쟁 테스트', () => {
  const helpers = new TestHelpers();

  test('메시 vs 호날두 논쟁', async ({ browser }) => {
    const roomPrefix = 'Football-Debate';
    
    // GPT 사용자 (메시 지지자) 설정
    const messiSupporter = await browser.newPage();
    const messiCreds = helpers.getAITestUser('gpt');
    await helpers.registerUser(messiSupporter, messiCreds);
    
    // 메시 지지자가 방 생성 및 정확한 방 이름 저장
    const createdRoomName = await helpers.joinOrCreateRoom(messiSupporter, roomPrefix);
    console.log(`Created room name: ${createdRoomName}`);

    // 생성된 방의 URL 파라미터 확인
    const messiUrl = messiSupporter.url();
    const roomParam = new URLSearchParams(new URL(messiUrl).search).get('room');
    
    if (!roomParam) {
      throw new Error('Failed to get room name from URL');
    }
    
    // Claude 사용자 (호날두 지지자) 설정 및 같은 방으로 입장
    const ronaldoSupporter = await browser.newPage();
    const ronaldoCreds = helpers.getAITestUser('claude');
    await helpers.registerUser(ronaldoSupporter, ronaldoCreds);
    await helpers.joinRoomByURLParam(ronaldoSupporter, roomParam);

    // 양쪽 모두 동일한 채팅방에 있는지 확인
    for (const page of [messiSupporter, ronaldoSupporter]) {
      const userHostUrl = page.url();
    	const userRoomParam = new URLSearchParams(new URL(userHostUrl).search).get('room');
      expect(userRoomParam).toBe(roomParam);
    }

    // 논쟁 주제 및 포인트 정의
    const debatePoints = [
      {
        messiPoint: "메시의 드리블은 예술 수준입니다. 그의 볼 컨트롤과 민첩성은 축구 역사상 전례가 없죠.",
        ronaldoResponse: "반면 호날두는 현대 축구에서 가장 완벽한 신체 조건과 운동 능력을 보여줍니다.",
      },
      {
        messiPoint: "메시는 8번의 발롱도르 수상으로 역대 최다 수상 기록을 보유하고 있습니다.",
        ronaldoResponse: "호날두는 세 개의 다른 리그에서 우승하며 적응력과 다재다능함을 증명했습니다.",
      },
      {
        messiPoint: "메시는 월드컵에서 우승하며 마지막 퍼즐을 완성했고, 이제 GOAT 논쟁은 끝났습니다.",
        ronaldoResponse: "호날두는 챔피언스리그 역대 최다 득점자이며, 국가대표 최다 득점 기록도 보유하고 있습니다.",
      },
      {
        messiPoint: "메시의 패스와 어시스트 능력은 공격수임에도 플레이메이커 역할을 완벽히 수행합니다.",
        ronaldoResponse: "호날두의 헤딩 능력과 점프력은 인간의 한계를 뛰어넘는 수준입니다.",
      },
      {
        messiPoint: "메시는 한 클럽에서 20년 가까이 충성하며 바르셀로나의 황금기를 이끌었습니다.",
        ronaldoResponse: "호날두는 맨유, 레알 마드리드, 유벤투스에서 모두 성공을 거둔 유일한 선수입니다.",
      },
      {
        messiPoint: "메시의 왼발은 마법과도 같습니다. 그의 슈팅과 프리킥은 예술 작품이죠.",
        ronaldoResponse: "호날두의 양발 사용 능력과 다양한 슈팅 기술은 그를 완벽한 공격수로 만듭니다.",
      },
      {
        messiPoint: "메시는 더 적은 경기 수로 더 많은 도움을 기록했습니다. 이는 그의 팀 플레이 능력을 증명합니다.",
        ronaldoResponse: "호날두는 큰 경기에서 더 뛰어난 활약을 보여줍니다. 챔피언스리그 녹아웃 스테이지 기록이 이를 증명합니다.",
      },
      {
        messiPoint: "메시는 좁은 공간에서의 드리블과 볼 컨트롤로 불가능을 가능으로 만듭니다.",
        ronaldoResponse: "호날두는 압도적인 신체능력과 점프력으로 수비수들을 압도합니다.",
      },
      {
        messiPoint: "메시는 자연스러운 재능과 천부적인 감각으로 축구를 예술로 승화시킵니다.",
        ronaldoResponse: "호날두는 끊임없는 노력과 자기관리로 최정상에 오른 프로페셔널의 표본입니다.",
      },
      {
        messiPoint: "메시는 아르헨티나 대표팀을 월드컵 우승으로 이끌며 진정한 리더십을 보여줬습니다.",
        ronaldoResponse: "호날두는 포르투갈 대표팀의 역사를 새로 쓰며 국가대표 최다 득점 기록을 보유하고 있습니다.",
      }
    ];

    // 논쟁 진행
    for (const [index, point] of debatePoints.entries()) {
      // 메시 지지자의 주장
      await helpers.sendMessage(messiSupporter, point.messiPoint);

      // 잠시 대기
      await messiSupporter.waitForTimeout(2000);

      // 호날두 지지자의 반박
      await helpers.sendMessage(ronaldoSupporter, point.ronaldoResponse);

      // 대화 간격을 위한 대기
      await ronaldoSupporter.waitForTimeout(2000);
    }

    // 대화 내용 검증
    const messiMessages = await helpers.getConversationHistory(messiSupporter);
    const ronaldoMessages = await helpers.getConversationHistory(ronaldoSupporter);

    // // 메시 관련 메시지 검증
    // expect(messiMessages.filter(m => m.text.toLowerCase().includes('messi') || 
    //                                m.text.toLowerCase().includes('메시'))).toHaveLength(10);

    // // 호날두 관련 메시지 검증
    // expect(ronaldoMessages.filter(m => m.text.toLowerCase().includes('ronaldo') || 
    //                                  m.text.toLowerCase().includes('호날두'))).toHaveLength(10);

    // // AI 응답 확인
    // const messiAIResponses = await messiSupporter.locator('.message-ai').count();
    // const ronaldoAIResponses = await ronaldoSupporter.locator('.message-ai').count();

    // expect(messiAIResponses).toBe(10);
    // expect(ronaldoAIResponses).toBe(10);

    // // 테스트 종료 전 채팅방 확인
    // for (const page of [messiSupporter, ronaldoSupporter]) {
    //   const finalRoomName = await page.locator('.chat-room-title').textContent();
    //   expect(finalRoomName).toBe(roomParam);
    // }

    // 리소스 정리
    await Promise.all([messiSupporter.close(), ronaldoSupporter.close()]);
  });
});