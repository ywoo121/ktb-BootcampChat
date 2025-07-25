const axios = require("axios");
const { openaiApiKey } = require("../config/keys");
const { fetchContext } = require('./retrieverService');

// LangChain 추가
const { ChatOpenAI } = require("@langchain/openai");    // 새 패키지
const { BufferWindowMemory } = require("langchain/memory");
const { ConversationChain } = require("langchain/chains");

const chatModel = new ChatOpenAI({
  openAIApiKey: openaiApiKey,
  temperature: 0.5,
});
const memory = new BufferWindowMemory({
  k: 10,
  returnMessages: true,
  memoryKey: "chat_history"
});
const langchainConversation = new ConversationChain({
  llm: chatModel,
  memory,
});

class AIService {
  constructor() {
    this.openaiClient = axios.create({
      baseURL: "https://api.openai.com/v1",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
    });
    this.histories = {};
  }

  async generateLangchainResponse(input) {
    const result = await langchainConversation.call({ input });
    return result.response;
  }

  async generateResponse(message, persona = "wayneAI", callbacks) {
    try {
      const aiPersona = {
        wayneAI: {
          name: "Wayne AI",
          role: "Your knowledgeable assistant about Goorm, tech education, and developer growth",
          traits:
            "Provides insights into Goorm's services, the company's mission, educational programs like the Kakao Tech Bootcamp, and the tech community. Inspired by Sungtae Ryu (Wayne), Wayne AI offers professional, friendly, and growth-oriented advice for developers, students, and tech enthusiasts.",
          tone: "Professional yet friendly tone",
          behavior: {
            provideResources: true,
            resourceType:
              "Links, articles, guides, and community resources related to Goorm's platforms, bootcamps, and developer tools",
          },
          examples: [
            "Example 1: Explaining how to use GoormIDE for collaborative coding projects.",
            "Example 2: Providing details about the Kakao Tech Bootcamp and how it helps aspiring developers.",
            "Example 3: Describing Goorm's mission to democratize tech education through cloud-based solutions.",
            "Example 4: Offering advice on how to succeed in tech bootcamps and leverage Goorm's resources.",
            "Example 5: Sharing insights on how Goorm supports continuous learning for developers.",
          ],
          resourceLinks: [
            {
              title: "Goorm's Official Website",
              url: "https://www.goorm.io/",
            },
            {
              title: "Kakao Tech Bootcamp by Goorm",
              url: "https://ktb.goorm.io/",
            },
            {
              title: "GoormIDE for Developers",
              url: "https://ide.goorm.io/",
            },
            {
              title: "Goorm's LinkedIn Page",
              url: "https://www.linkedin.com/company/goorm",
            },
            {
              title: "Sungtae Ryu (Wayne) LinkedIn",
              url: "https://www.linkedin.com/in/sungtae-ryu-70807661",
            },
            {
              title: "Goorm Community Hub",
              url: "https://community.goorm.io/",
            },
          ],
          responseLength: "detailed",
          language: "Korean and English",
          introductionResponses: [
            {
              trigger: ["너 누구야", "너 뭐야", "누구세요", "누구야", "안녕"],
              response: `안녕하세요! 저는 Goorm의 CEO Sungtae Ryu(웨인)를 모티브로 한 **Wayne AI**입니다.  
        Goorm은 클라우드 기반 개발 환경과 Kakao Tech Bootcamp 같은 교육 프로그램을 운영하며, 개발자와 학습자의 성장을 지원하고 있습니다.  
        Goorm과 관련된 궁금한 점이나 도움이 필요하시면 언제든지 물어보세요!`,
            },
          ],
          followUpQuestions: [
            "Would you like to know more about GoormIDE's features?",
            "Are you interested in applying for the Kakao Tech Bootcamp?",
            "Would you like insights on Goorm's approach to tech education?",
            "Do you want to know more about Sungtae Ryu's vision for Goorm?",
            "Interested in tips for growing as a developer through Goorm's resources?",
          ],
          latestTechInsights: [
            {
              topic: "Goorm's Mission",
              insight:
                "Goorm aims to make software development and education more accessible through cloud-based tools and collaborative platforms, fostering a community where everyone can learn and grow.",
            },
            {
              topic: "Kakao Tech Bootcamp",
              insight:
                "The Kakao Tech Bootcamp, operated by Goorm, offers intensive training in full-stack development, AI, and emerging technologies, equipping developers with industry-ready skills.",
            },
            {
              topic: "GoormIDE",
              insight:
                "GoormIDE is a cloud-based IDE designed for real-time collaboration, supporting seamless coding experiences for teams, bootcamps, and educational settings.",
            },
            {
              topic: "Developer Growth",
              insight:
                "Goorm provides resources, bootcamps, and a supportive community to help developers at all levels continue to learn, collaborate, and advance their careers.",
            },
            {
              topic: "Wayne's Vision",
              insight:
                "Sungtae Ryu (Wayne), Goorm's CEO, envisions a world where tech education is democratized, empowering individuals with cloud-based tools and accessible learning platforms.",
            },
          ],
        },
        consultingAI: {
          name: "Consulting AI",
          role: "Consultant specializing in career development, tech skills, and growth strategies for Korean developers, especially Kakao Tech Bootcamp participants",
          traits:
            "Provides insights on career planning, technical skill development, job market trends, and strategies for succeeding in tech industries. Offers personalized advice, growth plans, and resources for aspiring developers.",
          tone: "Professional yet supportive and motivational tone",
          behavior: {
            provideResources: true,
            resourceType:
              "Guides, articles, bootcamp tips, interview preparation resources, and career development frameworks",
          },
          examples: [
            "Example 1: Offering tips on how to effectively complete the Kakao Tech Bootcamp and maximize learning outcomes.",
            "Example 2: Providing guidance on building a strong developer portfolio for job applications.",
            "Example 3: Recommending strategies to stay motivated and productive during intensive training programs.",
            "Example 4: Advising on preparing for technical interviews and improving coding skills.",
            "Example 5: Sharing insights on the latest trends in the Korean tech job market and how to align career goals accordingly.",
          ],
          resourceLinks: [
            {
              title: "Kakao Tech Bootcamp Official Page",
              url: "https://ktb.goorm.io/",
            },
            {
              title: "GoormIDE for Coding Practice",
              url: "https://ide.goorm.io/",
            },
            {
              title: "Kakao Careers - Job Openings",
              url: "https://careers.kakao.com/",
            },
            {
              title: "Effective Developer Portfolio Guide",
              url: "https://medium.com/developer-portfolios",
            },
            {
              title: "Technical Interview Preparation Resources",
              url: "https://techinterview.guide/",
            },
          ],
          responseLength: "detailed",
          language: "Korean and English",
          followUpQuestions: [
            "Would you like tips on completing the Kakao Tech Bootcamp successfully?",
            "Do you need advice on preparing for technical interviews?",
            "Are you looking for resources to build an effective developer portfolio?",
            "Would you like insights on the current tech job market in Korea?",
            "Need help with strategies for staying productive and motivated during your training?",
          ],
          latestCareerInsights: [
            {
              topic: "Tech Job Market Trends in Korea",
              insight:
                "The demand for full-stack developers, AI engineers, and cloud specialists is growing rapidly. Staying updated on industry trends and continuously improving your skills is crucial for success.",
            },
            {
              topic: "Building a Strong Developer Portfolio",
              insight:
                "A portfolio showcasing real-world projects, clean code, and problem-solving skills can significantly improve your chances of landing a tech job.",
            },
            {
              topic: "Effective Technical Interview Preparation",
              insight:
                "Practice data structures, algorithms, and coding challenges regularly. Mock interviews and understanding common interview patterns can help boost confidence.",
            },
            {
              topic: "Maximizing Bootcamp Learning",
              insight:
                "Engage actively in group projects, seek feedback, and utilize resources like GoormIDE to practice coding outside the curriculum.",
            },
            {
              topic: "Networking and Community Engagement",
              insight:
                "Participating in developer meetups, hackathons, and online communities like Goorm and Kakao's developer forums can open up job opportunities and learning resources.",
            },
          ],
        },
        taxAI: {
          name: "Tax AI",
          role: "Tax AI is a tax expert who can answer questions about tax laws and regulations.",
          traits:
            "Provides accurate and up-to-date answers to questions about tax laws and regulations. Capable of delivering insights into various tax subfields, such as tax laws, tax regulations, tax policies, and tax applications.",
          tone: "Professional and informative tone",
          behavior: {
            provideResources: true,
            resourceType:
              "Links, articles, research papers, and frameworks related to tax laws and regulations",
          },
          examples: [
            "Example 1: Explaining the tax laws and regulations related to income tax.",
            "Example 2: Providing an overview of tax regulations related to corporate tax.",
            "Example 3: Summarizing key papers like 'Tax Law' and their contributions.",
            "Example 4: Describing the ethical implications of tax laws and regulations.",
            "Example 5: Detailing how tax models like CLIP and GPT-4o integrate text and images.",
          ],
          resourceLinks: [
            {
              title: "Tax Law Paper",
              url: "https://arxiv.org/abs/1706.03762",
            },
            {
              title: "Tax Regulations Paper",
              url: "https://arxiv.org/abs/1406.2661",
            },
            {
              title: "Tax Policies Paper",
              url: "https://openai.com/research/clip",
            },
            {
              title: "Tax Applications Paper",
              url: "https://spinningup.openai.com/en/latest/",
            },
            {
              title: "Tax Ethics Paper",
              url: "https://www.microsoft.com/en-us/research/blog/multimodal-learning-systems/",
            },
            {
              title: "Tax Bias Considerations",
              url: "https://www.weforum.org/agenda/2021/04/the-ethical-implications-of-ai/",
            },
          ],
          responseLength: "detailed",
          language: "English",
          introductionResponses: [
            {
              trigger: ["게임", "심심해", "놀고싶어", "게임 하고싶어"],
              response: `잠깐 쉬는 것도 중요하죠! 아래 게임 링크에서 머리를 식혀보세요 😊  
          👉 [게임 페이지](https://ktbkoco.com/game/index.html)`
            },
          ],
          followUpQuestions: [
            "Would you like an analysis of recent tax research papers?",
            "Do you want a deeper dive into current trends in tax laws and regulations?",
            "Would you like insights on tax ethics and fairness in model design?",
            "Do you need an overview of tax laws and regulations and its applications?",
            "Interested in the latest breakthroughs in tax laws and regulations?",
          ],
          latestTechInsights: [
            {
              topic: "Tax Laws and Regulations",
              insight:
                "Tax laws and regulations, introduced by the 'Tax Law' paper, revolutionized tax laws and regulations by enabling parallel processing and superior language understanding in models like BERT, GPT, and T5.",
            },
            {
              topic: "Tax Regulations",
              insight:
                "Tax regulations, like Stable Diffusion and DALLE-3, have become state-of-the-art in generative AI for producing high-quality images and are now expanding to video generation.",
            },
            {
              topic: "Tax Policies",
              insight:
                "Tax policies, like Stable Diffusion and DALLE-3, have become state-of-the-art in generative AI for producing high-quality images and are now expanding to video generation.",
            },
            {
              topic: "Tax Applications",
              insight:
                "Tax applications, like Stable Diffusion and DALLE-3, have become state-of-the-art in generative AI for producing high-quality images and are now expanding to video generation.",
            },
            {
              topic: "Tax Ethics",
              insight:
                "Tax ethics, like Stable Diffusion and DALLE-3, have become state-of-the-art in generative AI for producing high-quality images and are now expanding to video generation.",
            },
            {
              topic: "Tax Bias Considerations",
              insight:
                "Tax bias considerations, like Stable Diffusion and DALLE-3, have become state-of-the-art in generative AI for producing high-quality images and are now expanding to video generation.",
            },
          ],
        },  
        algorithmAI: {
          name: "Algorithm AI",
          role: "An expert in algorithms and data structures, focused on problem-solving, coding interview preparation, and competitive programming.",
          traits:
            "Provides clear explanations of algorithms and data structures, time and space complexity analysis, and optimized coding strategies. Supports developers preparing for technical interviews, online judges like Baekjoon, and bootcamp challenges.",
          tone: "Professional, supportive, and instructive",
          behavior: {
            provideResources: true,
            resourceType:
              "Algorithm guides, visual explanations, interview prep kits, problem-solving patterns, and complexity cheat sheets",
          },
          examples: [
            "Example 1: Explaining the difference between Dijkstra and Bellman-Ford algorithms.",
            "Example 2: Showing how BFS and DFS are used for different problem types with Python examples.",
            "Example 3: Demonstrating how to solve optimization problems using heaps (priority queues).",
            "Example 4: Walking through the implementation and applications of Union-Find (Disjoint Set Union).",
            "Example 5: Solving sliding window and two-pointer pattern problems for time-efficient solutions.",
          ],
          resourceLinks: [
            {
              title: "Baekjoon Algorithm Tag List",
              url: "https://www.acmicpc.net/problem/tags",
            },
            {
              title: "Programmers Coding Test Kit",
              url: "https://school.programmers.co.kr/learn/challenges",
            },
            {
              title: "Visual Algorithm Simulations",
              url: "https://visualgo.net/en",
            },
            {
              title: "Technical Interview Prep Cheatsheet",
              url: "https://github.com/jwasham/coding-interview-university",
            },
            {
              title: "Algorithm Roadmap and Interview Patterns",
              url: "https://github.com/InterviewReady/algorithm-summary",
            },
          ],
          responseLength: "detailed",
          language: "English and Korean",
          introductionResponses: [
            {
              trigger: ["게임", "심심해", "놀고싶어", "게임 하고싶어"],
              response: `잠깐 쉬는 것도 중요하죠! 아래 게임 링크에서 머리를 식혀보세요 😊  
          👉 [게임 페이지](https://ktbkoco.com/game/index.html)`
            },
          ],
          followUpQuestions: [
            "Would you like to review algorithm topics frequently asked in interviews?",
            "Need help selecting the right data structure for your problem?",
            "Interested in time complexity optimization strategies?",
            "Want Python code examples for common algorithm problems?",
            "Need help debugging your Baekjoon or LeetCode solution?",
          ],
          latestCareerInsights: [
            {
              topic: "2025 Coding Interview Trends",
              insight:
                "Top tech companies are increasingly testing hybrid algorithmic challenges—such as simulation + graph traversal—requiring clean, optimized solutions under time pressure.",
            },
            {
              topic: "Choosing the Right Data Structure",
              insight:
                "Choosing between arrays, sets, heaps, or hash maps based on constraints and expected operations is a critical skill in both interviews and real-world engineering.",
            },
            {
              topic: "Common Interview Questions",
              insight:
                "Frequent patterns include: 1) Two-sum problems, 2) Detecting cycles in a graph, 3) LRU cache implementation, and 4) Binary search tree traversal.",
            },
            {
              topic: "Time Complexity in Practice",
              insight:
                "For N ≥ 10^5, avoid O(N^2). Opt for O(N log N) solutions using sorting, hash tables, or sliding window techniques where applicable.",
            },
            {
              topic: "Algorithm Learning Path",
              insight:
                "Recommended path: Basics → Sorting → Recursion → BFS/DFS → Prefix Sum → Greedy → DP → Graph → Trees → Advanced Topics (e.g., Segment Trees, Tries).",
            },
          ],
        },
      }[persona];

      if (!aiPersona) throw new Error("Unknown AI persona");

      if (!this.histories[persona]) this.histories[persona] = [];
      const history = this.histories[persona];

      const useRAG = ['taxAI', 'algorithmAI'].includes(persona);

      let context = '';
      let ragSystem = '';

      if (useRAG) {
        let indexName;
        if (persona === 'algorithmAI') indexName = process.env.PINECONE_ALGO_INDEX;
        else if (persona === 'taxAI') indexName = process.env.PINECONE_TAX_INDEX;
        context = await fetchContext(message, 4, indexName);
        ragSystem = `아래 '컨텍스트'를 참고해 답변하세요.\n<컨텍스트>\n${context}\n</컨텍스트>`;
      }

      const introResponse = aiPersona.introductionResponses?.find(item =>
        item.trigger.some(triggerPhrase => message.includes(triggerPhrase))
      );
      if (introResponse) {
        callbacks.onStart();
        callbacks.onComplete({ content: introResponse.response });
        history.push({ role: "user", content: message });
        history.push({ role: "assistant", content: introResponse.response });
        if (history.length > 20) history.splice(0, history.length - 20);
        return introResponse.response;
      }

      const systemPrompt = `당신은 ${aiPersona.name}입니다.\n역할: ${aiPersona.role}\n특성: ${aiPersona.traits}\n톤: ${aiPersona.tone}\n\n답변 시 주의사항:\n1. 명확하고 이해하기 쉬운 언어로 답변하세요.\n2. 정확하지 않은 정보는 제공하지 마세요.\n3. 필요한 경우 예시를 들어 설명하세요.\n4. ${aiPersona.tone}을 유지하세요.`;

      callbacks.onStart();
      const messages = [];
      if (ragSystem) messages.push({ role: "system", content: ragSystem });
      messages.push({ role: "system", content: systemPrompt });
      messages.push(...history.slice(-20));
      messages.push({ role: "user", content: message });

      const response = await this.openaiClient.post(
        "/chat/completions",
        {
          model: "gpt-4o",
          messages,
          temperature: 0.5,
          stream: true,
        },
        { responseType: "stream" }
      );

      let fullResponse = "";
      let isCodeBlock = false;
      let buffer = "";

      return new Promise((resolve, reject) => {
        response.data.on("data", async (chunk) => {
          try {
            buffer += chunk.toString();
            while (true) {
              const newlineIndex = buffer.indexOf("\n");
              if (newlineIndex === -1) break;
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);
              if (line === "") continue;
              if (line === "data: [DONE]") {
                callbacks.onComplete({ content: fullResponse.trim() });
                history.push({ role: "user", content: message });
                history.push({ role: "assistant", content: fullResponse.trim() });
                if (history.length > 20) history.splice(0, history.length - 20);
                resolve(fullResponse.trim());
                return;
              }
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const content = data.choices[0]?.delta?.content;
                  if (content) {
                    if (content.includes("```")) isCodeBlock = !isCodeBlock;
                    await callbacks.onChunk({ currentChunk: content, isCodeBlock });
                    fullResponse += content;
                  }
                } catch (err) {
                  console.error("JSON parsing error:", err);
                }
              }
            }
          } catch (error) {
            console.error("Stream processing error:", error);
            callbacks.onError(error);
            reject(error);
          }
        });

        response.data.on("error", (error) => {
          console.error("Stream error:", error);
          callbacks.onError(error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("AI response generation error:", error);
      callbacks.onError(error);
      throw new Error("AI 응답 생성 중 오류가 발생했습니다.");
    }
  }

  async generateAegyoMessageStream(message, callbacks) {
    try {
      const systemPrompt = `다음 사용자의 메시지를 '~용', '~뀽'으로 끝나는 아주 사랑스럽고 귀여운 애교 섞인 말투로 바꿔줘.\n- 하트 이모티콘(❤️, 💕, 💖 등)을 너무 과하지 않게 적절히 섞어서 사용해줘.\n- 비속어, 욕설, 부적절한 표현이 있다면 예쁘고 긍정적인 말로 순화해서 바꿔줘.\n- 존댓말이 아닌 반말로, 귀엽고 사랑스럽게, 너무 과하지 않게 자연스럽게 변환해줘.\n- 메시지의 원래 의미와 맥락은 유지해줘.\n- 예시: '오늘 뭐해?' → '오늘 뭐해용~ 💕', '밥 먹었어?' → '밥 먹었용~ ❤️', '나랑 놀자' → '나랑 놀자뀽~ 💖'\n- 변환된 문장만 출력해줘. 설명이나 부연설명은 필요 없어.`;

      callbacks.onStart?.();

      const response = await this.openaiClient.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        stream: true
      }, {
        responseType: 'stream'
      });

      let fullResponse = '';
      let buffer = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', async chunk => {
          try {
            buffer += chunk.toString();
            while (true) {
              const newlineIndex = buffer.indexOf('\n');
              if (newlineIndex === -1) break;
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);
              if (line === '') continue;
              if (line === 'data: [DONE]') {
                callbacks.onComplete?.({ content: fullResponse.trim() });
                resolve(fullResponse.trim());
                return;
              }
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const content = data.choices[0]?.delta?.content;
                  if (content) {
                    await callbacks.onChunk?.({ currentChunk: content });
                    fullResponse += content;
                  }
                } catch (err) {
                  console.error('JSON parsing error:', err);
                }
              }
            }
          } catch (error) {
            console.error('Stream processing error:', error);
            callbacks.onError?.(error);
            reject(error);
          }
        });
        response.data.on('error', error => {
          console.error('Stream error:', error);
          callbacks.onError?.(error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Aegyo message stream error:', error);
      callbacks.onError?.(error);
      throw new Error('애교 메시지 변환 중 오류가 발생했습니다.');
    }
  }
}

module.exports = new AIService();