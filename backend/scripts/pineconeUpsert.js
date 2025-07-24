// scripts/pineconeUpsert.js
const path  = require('node:path');
  require('dotenv').config({        
    path: path.resolve(__dirname, '../.env')
});

const fs        = require('node:fs/promises');
const { OpenAI }   = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

const {
  openaiApiKey,
  pineconeKey,
  pineconeIndex2,
} = require('../config/keys');

/* --- 1) SDK 초기화 ------------------------------------------------------- */
const openai   = new OpenAI({ apiKey: openaiApiKey });
const pinecone = new Pinecone({ apiKey: pineconeKey });
const index    = pinecone.Index(pineconeIndex2);

/* --- 2) 간단한 문서 로더 -------------------------------------------------- */
/** 문서 폴더 안의 .md / .txt 파일을 모두 읽어 온다. */
async function loadDocs(dir = './docs') {
  const files = await fs.readdir(dir);
  const docs  = [];

  for (const f of files) {
    if (!/\.(md|txt)$/i.test(f)) continue;      // markdown, txt 만
    const text = await fs.readFile(path.join(dir, f), 'utf8');
    docs.push({ id: path.parse(f).name, text, path: f });
  }
  return docs;
}

/* --- 3) 문서 분할 util ---------------------------------------------------- */
function splitIntoChunks(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk.trim());
    start += chunkSize - overlap;               // 슬라이딩 창
  }
  return chunks;
}

/* --- 4) OpenAI 임베딩 + Pinecone upsert ---------------------------------- */
async function embedAndUpsert(doc) {
  const chunks = splitIntoChunks(doc.text);
  const toUpsert = [];
  // unsafe UTF-16 문자 제거용 유틸
  function sanitizeText(text) {
    // surrogate pair가 깨진 경우 제거
    return text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')  // 단독 high
              .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, ''); // 단독 low
  }

  for (let i = 0; i < chunks.length; i++) {
    let chunkText = chunks[i];
    chunkText = sanitizeText(chunkText);

    // 4-1. 임베딩 호출
    const embRes = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: chunkText,
    });

    const embedding = embRes.data[0].embedding;

    // 4-2. upsert payload
    toUpsert.push({
      id: `${doc.id}-chunk${i}`,
      values: embedding,
      metadata: {
        text: chunkText,
        source: doc.path,
        chunk: i,
      },
    });
  }

  // 4-3. Pinecone 업로드 (batch 1000 개까지 가능)
  await index.upsert(toUpsert);
  console.log(`✅ ${doc.path} → ${toUpsert.length}개 chunk 업로드 완료`);
}

/* --- 5) 메인 실행 -------------------------------------------------------- */
(async () => {
  try {
    const docs = await loadDocs(path.resolve(__dirname, '../docs'));      // ① 문서 읽기
    for (const doc of docs) await embedAndUpsert(doc); // ② 임베딩+업로드
    console.log('✨ 모든 문서 업로드 완료');
  } catch (err) {
    console.error(err);
  }
})();