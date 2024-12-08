// test/services/ai-service.ts

import OpenAI from 'openai';
import { TEST_PROMPTS, AI_RESPONSE_TEMPLATES } from '../data/ai-prompts';
import axios from 'axios';

interface AIConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
}

interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
}

export class AIService {
  private openai: OpenAI;
  private claudeApi: any; // Anthropic API 클라이언트
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    });
  }

  async generateResponse(
    promptKey: string,
    parameters: Record<string, string>,
    aiType: 'wayneAI' | 'consultingAI'
  ): Promise<AIResponse> {
    try {
      const promptTemplate = TEST_PROMPTS[promptKey];
      if (!promptTemplate) {
        throw new Error('Invalid prompt key');
      }

      let prompt = promptTemplate.prompt;
      for (const [key, value] of Object.entries(parameters)) {
        prompt = prompt.replace(`[${key}]`, value);
      }

      if (aiType === 'wayneAI') {
        return await this.callGPT(prompt);
      } else {
        return await this.callClaude(prompt);
      }

    } catch (error) {
      console.error('AI response generation error:', error);
      return {
        success: false,
        content: AI_RESPONSE_TEMPLATES.ERROR.API_ERROR,
        error: error.message
      };
    }
  }

  private async callGPT(prompt: string): Promise<AIResponse> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: "system", content: "당신은 WayneAI라는 AI어시스턴트입니다. 항상 한국어로 만들어주세요. \", '는 사용하지 말아주세요." },
          { role: "user", content: prompt }
        ]
      });

      return {
        success: true,
        content: completion.choices[0]?.message?.content || AI_RESPONSE_TEMPLATES.FALLBACK.DEFAULT
      };
    } catch (error) {
      throw new Error(`GPT API Error: ${error.message}`);
    }
  }

  private async callClaude(prompt: string): Promise<AIResponse> {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return {
        success: true,
        content: response.data.content[0].text
      };
    } catch (error) {
      throw new Error(`Claude API Error: ${error.message}`);
    }
  }
}