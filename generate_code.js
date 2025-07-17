const fs = require('fs');
const path = require('path');

// 제외할 디렉토리 목록
// const excludedDirs = ['.git', 'dist', 'node_modules', 'target_projects', 'logs', 'tests', 'project-summary', 'project-diagrams', 'project-readme', 'project-sbom', 'src_backup', 'analyzers', 'parsers', 'client', 'cli', 'bin', 'middleware', 'aiProviders', '.arkain-checkpoints'];

// README GENERATOR
// const excludedDirs = ['.git', 'dist', 'node_modules', 'target_projects', 'logs', 'tests', 'project-summary', 'project-diagrams', 'project-readme', 'project-sbom', 'src_backup', 'analyzers', 'parsers', 'client', 'cli', 'bin', 'middleware', '.arkain-checkpoints'];

const excludedDirs = ['.git', 'dist', 'node_modules', 'target_projects', 'logs', 'tests', 'project-prd', 'project-diagrams', 'project-readme', 'project-sbom', 'src_backup', '.arkaincerebro-recovery', 'resources'];


// 제외할 파일 목록
// const excludedFiles = ['sbomGenerator.js', 'readmeGenerator.js', 'diagramGenerator.js', 'codeTransformer.js', 'projectSummarizer.js', 'logger.js', 'astWorker.js', 'astAnalysis.js', 'advancedAstAnalysis.js', 'README.md', '.npmrc', 'formatting.sh', '20250430_code.txt', 'generate_code.js', '.env.backup', '.env.example', '.eslintrc.js', '.gitignore', 'arkain.manifest', 'package-lock.json', '.arkainignore', '.arkain-hash-cache.json', '.arkain-namespaces.json', '.arkain-auth.json', 'clean.js', 'process.md', 'arkain-index.js', 'arkainFeatures.js', 'contextBuilder.js', 'create-auth-file.js', 'generateRoutes.js', 'analysisRoutes.js', 'costTrackingRoutes.js', 'namespaceRoutes.js', 'projectRoutes.js', 'refactorRoutes.js', 'statRoutes.js', 'statusRoutes.js', 'codevisorRoutes.js', 'fileRoutes.js', 'costTrackingService.js', 'pineconeService.js', 'autocompleteHandler.js', 'codeAnalyzer.js', 'promptAutocomplete.js', 'cacheService.js', 'promptSearch.js', 'projectAnalyzer.js', '.env', 'index.js', 'package.json'];

// README GENERATOR
// const excludedFiles = ['codeTransformer.js', 'chunkedFileProcessor.js', 'gitUtils.js', 'astWorker.js', 'astAnalysis.js', 'advancedAstAnalysis.js', 'README.md', '.npmrc', 'formatting.sh', '20250430_code.txt', 'generate_code.js', '.env.backup', '.env.example', '.eslintrc.js', '.gitignore', 'arkain.manifest', 'package-lock.json', '.arkainignore', '.arkain-hash-cache.json', '.arkain-namespaces.json', '.arkain-auth.json', 'clean.js', 'process.md', 'arkain-index.js', 'arkainFeatures.js', 'contextBuilder.js', 'create-auth-file.js', 'progressUtils.js', 'indexRoutes.js', 'analysisRoutes.js', 'costTrackingRoutes.js', 'namespaceRoutes.js', 'projectRoutes.js', 'refactorRoutes.js', 'statRoutes.js', 'statusRoutes.js', 'codevisorRoutes.js', 'fileRoutes.js', 'costTrackingService.js', 'autocompleteHandler.js', 'codeAnalyzer.js', 'promptAutocomplete.js', 'cacheService.js', 'tokenUtils.js', 'codeAnalysisUtils.js', '.env', 'config.js', 'index.js', 'codebaseIndexer.js', 'parallelIndexer.js', 'indexerJobService.js', 'checkpointServices.js', 'jobRecoveryService.js'];

const excludedFiles = ['.npmrc', 'formatting.sh', '20250430_code.txt', 'generate_code.js', '.env.backup', '.eslintrc.js', '.gitignore', 'arkain.manifest', 'package-lock.json', '.arkaincerebroignore', '.arkaincerebro-hash-cache.json', '.arkaincerebro-namespaces.json', '.arkain-auth.json', 'clean.js', 'process.md', 'create-auth-file.js', '.env', 'commit-message.txt', 'commit.diff.txt', 'diff.txt', 'processController.js.backup'];

// 제외할 확장자 목록
const excludedExtensions = ['.png', '.temp', '.pdf', '.mp4'];


// 출력 파일 경로
const outputPath = path.join(process.cwd(), '20250430_code.txt');

// 출력 스트림 생성
let outputStream;

/**
 * 디렉토리를 재귀적으로 탐색하며 파일 정보를 수집하는 함수
 * @param {string} dir - 탐색할 디렉토리 경로
 * @param {string} baseDir - 기준 디렉토리 경로 (상대 경로 계산용)
 */
function traverseDirectory(dir, baseDir) {
  // 디렉토리 내용 읽기
  const items = fs.readdirSync(dir);
  
  // 각 항목 처리
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    // 상대 경로 계산
    const relativePath = path.relative(baseDir, itemPath);
    
    if (stats.isDirectory()) {
      // 디렉토리인 경우, 제외 목록에 없으면 재귀적으로 탐색
      if (!excludedDirs.includes(item)) {
        traverseDirectory(itemPath, baseDir);
      }
    } else {
      // 파일인 경우, 제외 목록에 없으면 처리
      const fileName = path.basename(itemPath);
      const fileExt = path.extname(fileName).toLowerCase();
      if (!excludedFiles.includes(fileName) && !excludedExtensions.includes(fileExt)) {
        // 파일 내용 읽기
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          
          // 파일 경로 헤더와 내용을 출력 파일에 추가
          outputStream.write(`<${relativePath}>
`);
          outputStream.write(content);
          outputStream.write('\n\n');
          
          console.log(`Processed: ${relativePath}`);
        } catch (error) {
          console.error(`Error reading file ${itemPath}: ${error.message}`);
          
          // 오류 정보 기록
          outputStream.write(`<${relativePath}>
`);
          outputStream.write(`[Error: Could not read file content - ${error.message}]

`);
        }
      }
    }
  }
}

// 현재 디렉토리를 기준으로 시작
const currentDir = process.cwd();
console.log(`Starting directory scan from: ${currentDir}`);
console.log(`Excluding directories: ${excludedDirs.join(', ')}`);
console.log(`Excluding files: ${excludedFiles.join(', ')}`);
console.log(`Excluding extensions: ${excludedExtensions.join(', ')}`);

try {
  // 기존 파일이 있으면 삭제
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
    console.log(`Removed existing file: ${outputPath}`);
  }
  
  // 출력 스트림 생성
  outputStream = fs.createWriteStream(outputPath);
  
  // 디렉토리 탐색 시작
  traverseDirectory(currentDir, currentDir);
  
  // 스트림 종료
  outputStream.end(() => {
    console.log(`Successfully generated text file at: ${outputPath}`);
  });
} catch (error) {
  console.error(`Error during execution: ${error.message}`);
  
  // 스트림이 열려있다면 닫기
  if (outputStream) {
    outputStream.end();
  }
  
  process.exit(1);
}