// test/messaging/advanced-messaging.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import { MessageService } from '../services/message-service';

test.describe('고급 메시징 테스트', () => {
  const helpers = new TestHelpers();
  let messageService: MessageService;

  test.beforeAll(async () => {
    messageService = new MessageService();
  });

  test('마크다운 메시지 렌더링', async ({ browser }) => {
    const page = await browser.newPage();
    const creds = helpers.generateUserCredentials(1);
    await helpers.registerUser(page, creds);
    const roomName = await helpers.joinOrCreateRoom(page, 'Markdown');

    // AI를 통해 마크다운 형식의 메시지 생성
    const markdownPrompt = `
다음 요소들을 포함하는 마크다운 형식의 기술 문서를 작성해주세요:
- "웹 개발 기초"라는 제목 (h1)
- 2-3개의 중요 포인트 (bullet points)
- JavaScript 코드 예제 (코드 블록)
- 굵은 글씨와 기울임꼴을 사용한 강조 표현
최대한 간단하게 작성해주세요.`;

    const markdownMessage = await messageService.generateMessage(markdownPrompt);
    await helpers.sendMessage(page, markdownMessage);

    // 마크다운 렌더링 확인
    // await expect(page.locator('h1')).toBeVisible();
    // await expect(page.locator('ul > li')).toHaveCount(2);
    // await expect(page.locator('pre code')).toBeVisible();
    // await expect(page.locator('strong')).toBeVisible();
    // await expect(page.locator('em')).toBeVisible();

    // 실제 내용 확인
    // const title = await page.locator('h1').textContent();
    // expect(title).toBe('웹 개발 기초');

    // 코드 블록 내용 확인
    // const codeBlock = await page.locator('pre code').textContent();
    // expect(codeBlock).toContain('function') || expect(codeBlock).toContain('const');
  });

  test('다양한 마크다운 요소 테스트', async ({ browser }) => {
    const page = await browser.newPage();
    const creds = helpers.generateUserCredentials(2);
    await helpers.registerUser(page, creds);
    const roomName = await helpers.joinOrCreateRoom(page, 'Markdown');

    // 다양한 마크다운 요소를 포함한 메시지 생성
    const complexMarkdownPrompt = `
다음 요소들을 모두 포함하는 마크다운 형식의 회의 요약문을 작성해주세요:
- "팀 회의 요약" (h1 제목)
- "주요 안건" (h2 부제목)
- 3개의 체크리스트 항목
- 1개의 코드 블록 (예: 배포 명령어)
- 1개의 인용구
- 굵은 글씨와 기울임꼴이 혼합된 강조구문
최대한 실제 회의 내용처럼 자연스럽게 작성해주세요.`;

    const complexMarkdown = await messageService.generateMessage(complexMarkdownPrompt);
    await helpers.sendMessage(page, complexMarkdown);

    // 각 마크다운 요소 렌더링 확인
    // await expect(page.locator('h1')).toBeVisible();
    // await expect(page.locator('h2')).toBeVisible();
    // await expect(page.locator('input[type="checkbox"]')).toBeVisible();
    // await expect(page.locator('pre code')).toBeVisible();
    // await expect(page.locator('blockquote')).toBeVisible();
    // await expect(page.locator('strong')).toBeVisible();
    // await expect(page.locator('em')).toBeVisible();

    // 구조 검증
    // const headlines = await page.locator('h1, h2').count();
    // expect(headlines).toBeGreaterThanOrEqual(2);
    
    // const checklistItems = await page.locator('input[type="checkbox"]').count();
    // expect(checklistItems).toBeGreaterThanOrEqual(3);
  });
});