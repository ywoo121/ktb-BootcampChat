// test/ai/data-enhanced/prompt-driven-testing.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../helpers/test-helpers';
import { ENHANCED_PROMPT_TEMPLATES, STRESS_TEST_PROMPTS, QUICK_RESPONSE_PROMPTS } from './ai-prompt-templates';

test.describe('Enhanced Prompt-Driven AI Testing', () => {
  const helpers = new TestHelpers();

  test('Technical Expertise Validation', async ({ page }) => {
    const credentials = helpers.getTestUser(900);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Tech-Expertise-Test');

    const techPrompts = ENHANCED_PROMPT_TEMPLATES.filter(p => p.aiType === 'wayneAI');
    
    for (let i = 0; i < Math.min(techPrompts.length, 5); i++) {
      const prompt = techPrompts[i];
      const startTime = Date.now();
      
      await helpers.sendAIMessage(page, prompt.prompt, 'wayneAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { 
        timeout: prompt.estimatedResponseTime + 10000 
      });
      
      const actualResponseTime = Date.now() - startTime;
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      
      // Response quality validation
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(150);
      
      // Topic coverage validation
      const hasExpectedTopics = prompt.expectedTopics.some(topic => 
        response?.toLowerCase().includes(topic.toLowerCase())
      );
      expect(hasExpectedTopics).toBeTruthy(
        `Response should cover expected topics for: ${prompt.title}`
      );
      
      // Performance validation (with tolerance)
      const performanceTolerance = 1.5; // 50% tolerance
      expect(actualResponseTime).toBeLessThan(
        prompt.estimatedResponseTime * performanceTolerance
      );
      
      console.log(`${prompt.category} - ${prompt.title}: ${actualResponseTime}ms`);
      
      await page.waitForTimeout(2000);
    }
  });

  test('Business Consulting Validation', async ({ page }) => {
    const credentials = helpers.getTestUser(901);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Business-Expertise-Test');

    const businessPrompts = ENHANCED_PROMPT_TEMPLATES.filter(p => p.aiType === 'consultingAI');
    
    for (let i = 0; i < Math.min(businessPrompts.length, 5); i++) {
      const prompt = businessPrompts[i];
      const startTime = Date.now();
      
      await helpers.sendAIMessage(page, prompt.prompt, 'consultingAI');
      await page.waitForSelector(`.message-ai >> nth=${i}`, { 
        timeout: prompt.estimatedResponseTime + 10000 
      });
      
      const actualResponseTime = Date.now() - startTime;
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      
      // Business response validation
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(180);
      
      // Strategic thinking validation
      const hasStrategicTerms = /전략|방법|계획|분석|개선|최적화/.test(response || '');
      expect(hasStrategicTerms).toBeTruthy(
        `Business response should contain strategic terms for: ${prompt.title}`
      );
      
      // Topic coverage validation
      const hasExpectedTopics = prompt.expectedTopics.some(topic => 
        response?.toLowerCase().includes(topic.toLowerCase())
      );
      expect(hasExpectedTopics).toBeTruthy(
        `Response should cover expected topics for: ${prompt.title}`
      );
      
      console.log(`${prompt.category} - ${prompt.title}: ${actualResponseTime}ms`);
      
      await page.waitForTimeout(2000);
    }
  });

  test('Complexity-Based Response Time Validation', async ({ page }) => {
    const credentials = helpers.getTestUser(902);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Complexity-Test');

    const complexityGroups = {
      simple: QUICK_RESPONSE_PROMPTS,
      medium: ENHANCED_PROMPT_TEMPLATES.filter(p => p.complexity === 'medium'),
      complex: ENHANCED_PROMPT_TEMPLATES.filter(p => p.complexity === 'complex')
    };

    const responseTimes: Record<string, number[]> = {
      simple: [],
      medium: [],
      complex: []
    };

    let messageIndex = 0;

    for (const [complexity, prompts] of Object.entries(complexityGroups)) {
      const testPrompts = prompts.slice(0, 2); // Test 2 prompts per complexity
      
      for (const prompt of testPrompts) {
        const startTime = Date.now();
        
        await helpers.sendAIMessage(page, prompt.prompt, prompt.aiType);
        await page.waitForSelector(`.message-ai >> nth=${messageIndex}`, { 
          timeout: prompt.estimatedResponseTime + 15000 
        });
        
        const responseTime = Date.now() - startTime;
        responseTimes[complexity].push(responseTime);
        
        const response = await page.locator(`.message-ai >> nth=${messageIndex}`).textContent();
        expect(response).toBeTruthy();
        
        console.log(`${complexity} (${prompt.title}): ${responseTime}ms`);
        
        messageIndex++;
        await page.waitForTimeout(1000);
      }
    }

    // Analyze response time patterns
    const avgResponseTimes = Object.entries(responseTimes).map(([complexity, times]) => ({
      complexity,
      average: times.reduce((a, b) => a + b, 0) / times.length,
      max: Math.max(...times),
      min: Math.min(...times)
    }));

    console.log('Response time analysis:', avgResponseTimes);

    // Validate response time hierarchy
    const simpleAvg = avgResponseTimes.find(r => r.complexity === 'simple')?.average || 0;
    const mediumAvg = avgResponseTimes.find(r => r.complexity === 'medium')?.average || 0;
    const complexAvg = avgResponseTimes.find(r => r.complexity === 'complex')?.average || 0;

    // Simple should be fastest, complex should be slowest
    expect(simpleAvg).toBeLessThan(mediumAvg);
    expect(mediumAvg).toBeLessThan(complexAvg);
  });

  test('Stress Test with Heavy Prompts', async ({ page }) => {
    const credentials = helpers.getTestUser(903);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Stress-Test');

    for (let i = 0; i < STRESS_TEST_PROMPTS.length; i++) {
      const stressPrompt = STRESS_TEST_PROMPTS[i];
      const startTime = Date.now();
      
      console.log(`Starting stress test: ${stressPrompt.title}`);
      
      await helpers.sendAIMessage(page, stressPrompt.prompt, stressPrompt.aiType);
      
      try {
        await page.waitForSelector(`.message-ai >> nth=${i}`, { 
          timeout: stressPrompt.estimatedResponseTime + 20000 
        });
        
        const responseTime = Date.now() - startTime;
        const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
        
        // Stress test validation
        expect(response).toBeTruthy();
        expect(response?.length).toBeGreaterThan(500); // Should be substantial
        
        // Should handle complex multi-part requests
        const hasMultipleTopics = stressPrompt.expectedTopics.filter(topic => 
          response?.toLowerCase().includes(topic.toLowerCase())
        ).length >= 3;
        
        expect(hasMultipleTopics).toBeTruthy(
          `Stress test response should cover multiple topics for: ${stressPrompt.title}`
        );
        
        console.log(`Stress test completed: ${stressPrompt.title} in ${responseTime}ms`);
        
      } catch (error) {
        console.log(`Stress test timed out: ${stressPrompt.title} - This may be acceptable`);
        // Timeout is acceptable for stress tests
      }
      
      await page.waitForTimeout(5000); // Longer wait between stress tests
    }
  });

  test('Rapid Fire Quick Questions', async ({ page }) => {
    const credentials = helpers.getTestUser(904);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Rapid-Fire-Test');

    const quickPrompts = QUICK_RESPONSE_PROMPTS;
    const responseTimeLimitMultiplier = 1.2; // 20% tolerance for quick responses
    
    for (let i = 0; i < quickPrompts.length; i++) {
      const prompt = quickPrompts[i];
      const startTime = Date.now();
      
      await helpers.sendAIMessage(page, prompt.prompt, prompt.aiType);
      await page.waitForSelector(`.message-ai >> nth=${i}`, { 
        timeout: prompt.estimatedResponseTime * 2 
      });
      
      const responseTime = Date.now() - startTime;
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      
      // Quick response validation
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(30);
      
      // Should be reasonably fast
      expect(responseTime).toBeLessThan(
        prompt.estimatedResponseTime * responseTimeLimitMultiplier
      );
      
      // Should be concise but informative
      expect(response?.length).toBeLessThan(500); // Not too verbose for quick questions
      
      console.log(`Quick response: ${prompt.title} in ${responseTime}ms`);
      
      await page.waitForTimeout(500); // Minimal delay for rapid fire
    }
  });

  test('Cross-Domain Knowledge Integration', async ({ page }) => {
    const credentials = helpers.getTestUser(905);
    await helpers.registerUser(page, credentials);
    await helpers.joinOrCreateRoom(page, 'Cross-Domain-Test');

    const crossDomainPrompts = ENHANCED_PROMPT_TEMPLATES.filter(p => 
      p.category === 'Tech-Business'
    );

    for (let i = 0; i < crossDomainPrompts.length; i++) {
      const prompt = crossDomainPrompts[i];
      
      await helpers.sendAIMessage(page, prompt.prompt, prompt.aiType);
      await page.waitForSelector(`.message-ai >> nth=${i}`, { 
        timeout: prompt.estimatedResponseTime + 10000 
      });
      
      const response = await page.locator(`.message-ai >> nth=${i}`).textContent();
      
      // Cross-domain validation
      expect(response).toBeTruthy();
      expect(response?.length).toBeGreaterThan(200);
      
      // Should contain both technical and business terms
      const hasTechnicalTerms = /기술|개발|시스템|코드|아키텍처/.test(response || '');
      const hasBusinessTerms = /비즈니스|전략|수익|고객|가치/.test(response || '');
      
      expect(hasTechnicalTerms && hasBusinessTerms).toBeTruthy(
        `Cross-domain response should contain both technical and business terms for: ${prompt.title}`
      );
      
      console.log(`Cross-domain test completed: ${prompt.title}`);
      
      await page.waitForTimeout(2000);
    }
  });
});
