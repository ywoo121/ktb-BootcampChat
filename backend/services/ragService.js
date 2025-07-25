const axios = require('axios');
const { OpenAI } = require('openai');

class RAGService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Pinecone configuration (if available)
    this.pineconeApiKey = process.env.PINECONE_API_KEY;
    this.pineconeEnvironment = process.env.PINECONE_ENVIRONMENT;
    this.pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'bootcamp-chat-knowledge';
    
    // Vector dimension for OpenAI embeddings
    this.embeddingDimension = 1536;
    
    // Knowledge base cache
    this.knowledgeCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
  }

  // Generate embeddings for text
  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  // Search for relevant context using vector similarity
  async searchRelevantContext(query, topK = 5) {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Check cache first
      const cacheKey = `search:${query}`;
      if (this.knowledgeCache.has(cacheKey)) {
        const cached = this.knowledgeCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      let relevantDocs = [];

      // If Pinecone is configured, use it for vector search
      if (this.pineconeApiKey) {
        relevantDocs = await this.searchPinecone(queryEmbedding, topK);
      } else {
        // Fallback to local knowledge base
        relevantDocs = await this.searchLocalKnowledge(query, topK);
      }

      // Cache results
      this.knowledgeCache.set(cacheKey, {
        data: relevantDocs,
        timestamp: Date.now()
      });

      return relevantDocs;
    } catch (error) {
      console.error('Context search error:', error);
      return [];
    }
  }

  // Search using Pinecone vector database
  async searchPinecone(queryEmbedding, topK) {
    try {
      const response = await axios.post(
        `https://${this.pineconeIndexName}-${this.pineconeEnvironment}.svc.${this.pineconeEnvironment}.pinecone.io/query`,
        {
          vector: queryEmbedding,
          topK: topK,
          includeMetadata: true,
          includeValues: false
        },
        {
          headers: {
            'Api-Key': this.pineconeApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.matches.map(match => ({
        content: match.metadata.content,
        source: match.metadata.source,
        score: match.score,
        title: match.metadata.title || 'Knowledge Base'
      }));
    } catch (error) {
      console.error('Pinecone search error:', error);
      return [];
    }
  }

  // Fallback local knowledge search
  async searchLocalKnowledge(query, topK) {
    // This is a simplified local knowledge base
    // In production, this would connect to a proper vector database
    const knowledgeBase = [
      {
        content: "Next.js는 React 기반의 풀스택 웹 프레임워크입니다. 서버 사이드 렌더링(SSR)과 정적 사이트 생성(SSG)을 지원합니다.",
        source: "Next.js Documentation",
        title: "Next.js 개요",
        keywords: ["nextjs", "react", "ssr", "ssg", "프레임워크"]
      },
      {
        content: "Socket.IO는 실시간 양방향 통신을 가능하게 하는 라이브러리입니다. WebSocket을 기반으로 하며 자동 재연결과 fallback 메커니즘을 제공합니다.",
        source: "Socket.IO Documentation",
        title: "Socket.IO 개요",
        keywords: ["socketio", "websocket", "실시간", "통신"]
      },
      {
        content: "MongoDB는 NoSQL 문서 데이터베이스입니다. JSON과 유사한 BSON 형식으로 데이터를 저장하며, 스키마가 유연합니다.",
        source: "MongoDB Documentation",
        title: "MongoDB 개요",
        keywords: ["mongodb", "nosql", "database", "bson", "json"]
      },
      {
        content: "Fabric.js는 HTML5 Canvas를 위한 강력한 JavaScript 라이브러리입니다. 인터랙티브한 그래픽과 애니메이션을 쉽게 만들 수 있습니다.",
        source: "Fabric.js Documentation",
        title: "Fabric.js 개요",
        keywords: ["fabricjs", "canvas", "graphics", "animation", "drawing"]
      },
      {
        content: "Redis는 인메모리 데이터 구조 저장소입니다. 캐싱, 세션 관리, 실시간 분석 등에 사용됩니다.",
        source: "Redis Documentation", 
        title: "Redis 개요",
        keywords: ["redis", "cache", "memory", "session", "storage"]
      },
      {
        content: "React는 사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리입니다. 컴포넌트 기반 아키텍처와 가상 DOM을 사용합니다.",
        source: "React Documentation",
        title: "React 개요", 
        keywords: ["react", "component", "virtual dom", "ui", "javascript"]
      }
    ];

    // Simple keyword-based search (in production, use proper vector similarity)
    const queryLower = query.toLowerCase();
    const scored = knowledgeBase
      .map(doc => {
        let score = 0;
        
        // Check title match
        if (doc.title.toLowerCase().includes(queryLower)) {
          score += 2;
        }
        
        // Check content match
        if (doc.content.toLowerCase().includes(queryLower)) {
          score += 1;
        }
        
        // Check keyword matches
        doc.keywords.forEach(keyword => {
          if (queryLower.includes(keyword.toLowerCase())) {
            score += 1.5;
          }
        });

        return { ...doc, score };
      })
      .filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  // Generate RAG-enhanced response
  async generateRAGResponse(query, aiType = 'ragAI') {
    try {
      // Search for relevant context
      const relevantDocs = await this.searchRelevantContext(query, 3);
      
      // Build context from retrieved documents
      const context = relevantDocs.length > 0
        ? relevantDocs.map(doc => `[${doc.title}]: ${doc.content}`).join('\n\n')
        : '';

      // Create system prompt with context
      const systemPrompt = this.buildSystemPrompt(aiType, context);
      
      // Generate response using OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: true
      });

      return response;
    } catch (error) {
      console.error('RAG response generation error:', error);
      throw error;
    }
  }

  // Build system prompt with context
  buildSystemPrompt(aiType, context) {
    const basePrompt = {
      ragAI: "당신은 부트캠프 학습을 도와주는 친절한 AI 어시스턴트입니다. 제공된 문서를 바탕으로 정확하고 도움이 되는 답변을 제공하세요.",
      docAI: "당신은 기술 문서 전문가입니다. 제공된 문서 내용을 바탕으로 상세하고 기술적인 설명을 제공하세요.",
      helpAI: "당신은 학습 도우미입니다. 초보자도 이해할 수 있도록 쉽게 설명해주세요."
    };

    const prompt = basePrompt[aiType] || basePrompt.ragAI;
    
    if (context) {
      return `${prompt}

참고 문서:
${context}

위 문서를 참고하여 질문에 답변해주세요. 만약 문서에 관련 정보가 없다면, 일반적인 지식을 바탕으로 도움이 되는 답변을 제공하세요.`;
    } else {
      return `${prompt}

관련 문서를 찾지 못했습니다. 일반적인 지식을 바탕으로 최대한 도움이 되는 답변을 제공해주세요.`;
    }
  }

  // Add document to knowledge base (for Pinecone)
  async addToKnowledge(content, metadata = {}) {
    try {
      if (!this.pineconeApiKey) {
        console.log('Pinecone not configured, skipping knowledge addition');
        return;
      }

      const embedding = await this.generateEmbedding(content);
      const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await axios.post(
        `https://${this.pineconeIndexName}-${this.pineconeEnvironment}.svc.${this.pineconeEnvironment}.pinecone.io/vectors/upsert`,
        {
          vectors: [
            {
              id: id,
              values: embedding,
              metadata: {
                content: content,
                ...metadata,
                timestamp: new Date().toISOString()
              }
            }
          ]
        },
        {
          headers: {
            'Api-Key': this.pineconeApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Added document to knowledge base: ${id}`);
      return id;
    } catch (error) {
      console.error('Knowledge addition error:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    this.knowledgeCache.clear();
  }
}

module.exports = new RAGService();