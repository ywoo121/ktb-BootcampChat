import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import { MessageService } from '../services/message-service';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

test.describe('AI 대화 시나리오', () => {
  const helpers = new TestHelpers();
  let messageService: MessageService;

  test.beforeAll(async () => {
    messageService = new MessageService();
  });

  test('AI와의 복잡한 대화', async ({ browser }) => {  
    const page = await browser.newPage();
    const creds = helpers.getTestUser(0);
    await helpers.registerUser(page, creds);
    const roomName = await helpers.joinOrCreateRoom(page, 'AI-Chat');

    // 인사 메시지 생성 및 전송
    const greeting = await messageService.generateMessage('GREETING', {
      USER_NAME: creds.name,
      ROOM_NAME: roomName
    });
    await helpers.sendAIMessage(page, greeting, 'wayneAI');
    await expect(page.locator('.message-ai').last()).toBeVisible();

    // 비즈니스 관련 질문 생성 및 전송
    const businessQuestion = await messageService.generateMessage('GROUP_CHAT', {
      CURRENT_TOPIC: '기술 트렌드',
      USER_NAME: creds.name
    });
    await helpers.sendAIMessage(page, businessQuestion, 'wayneAI');
    const businessResponse = await page.locator('.message-ai').nth(1);
    await expect(businessResponse).toBeVisible();

    // 코드 리뷰 요청 생성 및 전송
    const codeReviewRequest = await messageService.generateMessage('CHAT_RESPONSE', {
      PREV_MESSAGE: 'function sum(a, b) { return a + b; }',
      USER_NAME: creds.name
    });
    await helpers.sendAIMessage(page, codeReviewRequest, 'wayneAI');
    const codeReviewResponse = await page.locator('.message-ai').nth(2);
    await expect(codeReviewResponse).toBeVisible();

    // // 응답 검증
    // const messages = await page.locator('.message-ai').all();
    // expect(messages).toHaveLength(3);

    // // 각 응답이 적절한 내용을 포함하는지 확인
    // for (const message of messages) {
    //   const content = await message.textContent();
    //   // expect(content?.length).toBeGreaterThan(0);
    //   expect(content).not.toContain('error');
    //   expect(content).not.toContain('Error');
    // }
  });

  test('AI와의 기술 토론', async ({ browser }) => {  
    const page = await browser.newPage();
    const creds = helpers.getTestUser(1);
    await helpers.registerUser(page, creds);
    await helpers.joinOrCreateRoom(page, 'AI-Tech-Discussion');

    // 기술 토론 주제
    const topics = ['AI 윤리', '웹 개발 트렌드', '클라우드 컴퓨팅'];

    for (const topic of topics) {
      // 토론 질문 생성 및 전송
      const question = await messageService.generateMessage('GROUP_CHAT', {
        CURRENT_TOPIC: topic,
        USER_NAME: creds.name
      });
      
      await helpers.sendAIMessage(page, question, 'wayneAI');
      
      // AI 응답 대기 및 확인
      const response = await page.locator('.message-ai').last();
      await expect(response).toBeVisible();
      const content = await response.textContent();
      // expect(content).toBeTruthy();
    }

    // 전체 대화 내용 확인
    // const allMessages = await page.locator('.message-ai').all();
    // expect(allMessages).toHaveLength(topics.length);
  });
});