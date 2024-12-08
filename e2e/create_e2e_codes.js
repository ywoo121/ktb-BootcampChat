const fs = require('fs');
const path = require('path');

// 결과를 저장할 파일 경로
const outputFilePath = path.join(__dirname, 'e2e20241129');

// 파일을 탐색하는 함수
function scanDirectory(dir, excludeDirs) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.lstatSync(fullPath);

    // 제외할 디렉토리 검사
    if (stat.isDirectory() && !excludeDirs.includes(file)) {
      scanDirectory(fullPath, excludeDirs);
    } else if (stat.isFile()) {
      // 제외할 파일 검사
      if (
        file !== 'package-lock.json' && 
        !file.endsWith('.backup') &&
        !file.endsWith('.temp') &&
        file !== 'patch.js' &&
        file !== 'create_e2e_codes.js' &&
        !file.endsWith('.png') // .png 파일 제외 조건 추가
      ) {
        appendFileContent(fullPath);
      }
    }
  });
}

// 파일 경로와 내용을 'source_codes' 파일에 추가
function appendFileContent(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const formattedContent = `\n<${filePath}>\n\n${fileContent}\n\n`;
  fs.appendFileSync(outputFilePath, formattedContent);
}

// 기존 'source_codes' 파일이 있다면 삭제
if (fs.existsSync(outputFilePath)) {
  fs.unlinkSync(outputFilePath);
}

// 현재 디렉토리에서 시작, node_modules, logs, .next 디렉토리 제외
scanDirectory(__dirname, ['node_modules', 'logs', '.next', 'uploads', 'chat-app', 'images', 'build', 'public', 'e2e', 'test-results', 'playwright-report', 'playwright-reports', 'fixtures', 'combined-report', 'data']);

console.log(`Source codes have been saved to ${outputFilePath}`);
