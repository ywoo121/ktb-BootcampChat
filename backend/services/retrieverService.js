// services/retrievalService.js
const { OpenAI }   = require('openai');      // embeddings 호출용
const { Pinecone } = require('@pinecone-database/pinecone'); 
const { openaiApiKey, pineconeKey, pineconeEnv, pineconeIndex } = require('../config/keys');

const openai   = new OpenAI({ apiKey: openaiApiKey });
const pinecone = new Pinecone({ apiKey: pineconeKey});
const index    = pinecone.Index(pineconeIndex);

module.exports = {
  /**
   * @param {string} query 사용자가 입력한 질문
   * @param {number} topK  ① 컨텍스트로 가져올 문단 개수
   * @returns {Promise<string>} ② LLM 프롬프트에 넣을 컨텍스트 문자열
   */
  async fetchContext(query, topK = 4, indexName = pineconeIndex) {
    // 1. 쿼리 임베딩
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: query
    });
    const [{ embedding }] = embeddingRes.data;

    // 2. 벡터 DB 탐색
    const { matches } = await pinecone.Index(indexName).query({
      vector: embedding,
      topK,
      includeMetadata: true   // text, url, title 등 메타 반환
    });

    // 3. 컨텍스트 문자열 합치기
    return matches
      .map((m, i) => `#${i+1}\n${m.metadata.text}\n`)
      .join('\n');
  }
};