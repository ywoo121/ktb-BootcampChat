// test/ai/conversation-flows/multi-turn-conversations.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../helpers/test-helpers';

test.describe('Multi-turn AI Conversations', () => {
  const helpers = new TestHelpers();

  test('Technical Discussion Flow', async ({ page }) => {
    const credentials = helpers.getTestUser(100);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Tech-Deep-Dive');

    // Conversation sequence: Problem -> Solution -> Clarification -> Implementation
    const conversationFlow = [
      {
        message: '@wayneAI 우리 React 앱에서 렌더링 성능 문제가 있어요. 컴포넌트가 너무 자주 리렌더링되고 있습니다.',
        expectKeywords: ['React', '성능', '렌더링', 'memo', 'useMemo', 'useCallback']
      },
      {
        message: '@wayneAI useMemo와 useCallback의 차이점을 좀 더 자세히 설명해주세요.',
        expectKeywords: ['useMemo', 'useCallback', '값', '함수', '메모이제이션']
      },
      {
        message: '@wayneAI 실제 코드 예시를 보여주세요. useState와 함께 어떻게 사용하는지요.',
        expectKeywords: ['useState', '예시', '코드', 'const']
      },
      {
        message: '@wayneAI 이런 최적화를 언제 사용해야 하고 언제 사용하지 말아야 하나요?',
        expectKeywords: ['최적화', '사용', '성능', '측정']
      }
    ];

    for (let i = 0; i < conversationFlow.length; i++) {
      const { message, expectKeywords } = conversationFlow[i];
      
      await helpers.sendAIMessage(page, message.replace('@wayneAI ', ''), 'wayneAI');
      
      // Wait for AI response
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      // Verify response contains relevant keywords
      const responseText = await page.locator(`.message-ai >> nth=${i}`).textContent();
      const hasRelevantContent = expectKeywords.some(keyword => 
        responseText?.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(hasRelevantContent).toBeTruthy();
      
      // Add realistic delay between messages
      await page.waitForTimeout(2000 + Math.random() * 3000);
    }
  });

  test('Business Consulting Session', async ({ page }) => {
    const credentials = helpers.getTestUser(101);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Business-Strategy');

    const consultingFlow = [
      '@consultingAI 스타트업 초기 단계에서 마케팅 예산을 어떻게 배분해야 할까요?',
      '@consultingAI 디지털 마케팅과 전통적인 마케팅의 ROI 차이에 대해 설명해주세요.',
      '@consultingAI 우리 제품은 B2B SaaS입니다. 이 경우 어떤 채널이 가장 효과적일까요?',
      '@consultingAI 마케팅 성과를 측정하는 핵심 지표들은 무엇인가요?',
      '@consultingAI 제한된 예산으로 최대 효과를 내는 마케팅 전략을 추천해주세요.'
    ];

    for (let i = 0; i < consultingFlow.length; i++) {
      await helpers.sendAIMessage(page, consultingFlow[i].replace('@consultingAI ', ''), 'consultingAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      // Verify business-focused response
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(50); // Substantial response
      
      await page.waitForTimeout(1500 + Math.random() * 2500);
    }
  });

  test('Mixed AI Conversation', async ({ page }) => {
    const credentials = helpers.getTestUser(102);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Mixed-AI-Chat');

    // Alternate between different AI types
    const mixedFlow = [
      { ai: 'wayneAI', message: '프로그래밍 언어 추천해주세요. 웹 개발 초보자입니다.' },
      { ai: 'consultingAI', message: '기술 스택 선택할 때 비즈니스 관점에서 고려사항은?' },
      { ai: 'wayneAI', message: 'JavaScript와 TypeScript 중 어떤 걸 먼저 배우는 게 좋을까요?' },
      { ai: 'consultingAI', message: '개발팀 구성할 때 우선순위는 어떻게 정해야 하나요?' },
      { ai: 'wayneAI', message: '풀스택 개발자가 되려면 어떤 로드맵을 따라야 할까요?' }
    ];

    for (let i = 0; i < mixedFlow.length; i++) {
      const { ai, message } = mixedFlow[i];
      
      await helpers.sendAIMessage(page, message, ai as 'wayneAI' | 'consultingAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { timeout: 30000 });
      
      // Verify appropriate AI response based on type
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      if (ai === 'wayneAI') {
        // Technical responses should contain development-related terms
        const hasTechTerms = /코드|프로그래밍|개발|기술|언어|프레임워크/.test(response || '');
        expect(hasTechTerms).toBeTruthy();
      } else {
        // Business responses should contain business-related terms
        const hasBusinessTerms = /비즈니스|전략|관리|조직|우선순위|효율|비용/.test(response || '');
        expect(hasBusinessTerms).toBeTruthy();
      }
      
      await page.waitForTimeout(2000);
    }
  });
});
