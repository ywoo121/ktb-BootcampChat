import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './test',
  timeout: 600000, // 전체 테스트 타임아웃 증가
  expect: { 
    timeout: 20000  // expect 작업 타임아웃 증가
  },
  fullyParallel: false,  // 순차 실행으로 변경
  retries: 0, // 재시도 횟수 설정
  workers: 2,  // 동시 실행 워커 수 제한
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 60000,  // 액션 타임아웃 설정
    navigationTimeout: 60000, // 네비게이션 타임아웃 설정
    video: 'retain-on-failure' // 실패 시 비디오 저장
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
};

export default config;