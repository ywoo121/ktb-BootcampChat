import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import path from 'path';

test.describe('이미지 업로드 테스트', () => {
  const helpers = new TestHelpers();

  test('이미지 업로드 및 공유', async ({ browser }) => {
    const roomPrefix = 'Image-Test';
    
    // 업로더와 뷰어 설정
    const uploader = await browser.newPage();
    const viewer = await browser.newPage();
    
    // 업로더 등록 및 방 생성
    const uploaderCreds = helpers.generateUserCredentials(1);
    await helpers.registerUser(uploader, uploaderCreds);
    
    // 방 생성 및 생성된 정확한 방 이름 저장
    const createdRoomName = await helpers.joinOrCreateRoom(uploader, roomPrefix);
    console.log(`Created room name: ${createdRoomName}`);

    // 생성된 방의 URL 파라미터 확인
    const uploaderUrl = uploader.url();
    const uploaderRoomParam = new URLSearchParams(new URL(uploaderUrl).search).get('room');
    
    if (!uploaderRoomParam) {
      throw new Error('Failed to get room name from uploader URL');
    }

    // 뷰어 등록 및 같은 방으로 입장
    const viewerCreds = helpers.generateUserCredentials(2);
    await helpers.registerUser(viewer, viewerCreds);
    await helpers.joinRoomByURLParam(viewer, uploaderRoomParam);

    // 양쪽 모두 동일한 채팅방에 있는지 확인
    for (const page of [uploader, viewer]) {
      const userHostUrl = page.url();
    	const userRoomParam = new URLSearchParams(new URL(userHostUrl).search).get('room');
      expect(userRoomParam).toBe(uploaderRoomParam);
    }

    // 이미지 업로드
    const imagePath = path.join(__dirname, '../fixtures/images/mufc_logo.png');

    // 채팅 UI가 완전히 로드될 때까지 대기
    await uploader.waitForSelector('.chat-input-wrapper', {
      state: 'visible',
      timeout: 30000
    });
    
    // 파일 입력 필드 대기 및 파일 설정
    const fileInput = await uploader.waitForSelector('input[type="file"]', {
      state: 'attached',
      timeout: 30000
    });
    await fileInput.setInputFiles(imagePath);

    // 파일 프리뷰 표시 및 안정화 대기
    await uploader.waitForSelector('.file-preview-item img', {
      state: 'visible',
      timeout: 30000
    });
    await uploader.waitForTimeout(1000); // 프리뷰 안정화를 위한 잠시 대기

    // 전송 버튼 찾기 및 클릭
    const submitButton = await uploader.waitForSelector(
      'button[type="submit"], .chat-input-actions button[title*="보내기"], .chat-input-actions button.send-button', 
      {
        state: 'visible',
        timeout: 30000
      }
    );
    
    // 버튼이 클릭 가능한 상태가 될 때까지 대기
    await submitButton.waitForElementState('stable');
    await submitButton.click();

    // 업로드 진행 상태 표시 사라질 때까지 대기 (있는 경우)
    await uploader.waitForSelector('.upload-progress', {
      state: 'detached',
      timeout: 30000
    }).catch(() => {}); // 진행 상태 표시가 없을 수 있으므로 에러 무시

    // 이미지 메시지가 나타날 때까지 대기
    const messageSelector = '.message-content:has(img)';
    await Promise.all([
      uploader.waitForSelector(messageSelector, { timeout: 30000 }),
      viewer.waitForSelector(messageSelector, { timeout: 30000 })
    ]);

    // 이미지 로드 완료 확인 및 검증
    for (const page of [uploader, viewer]) {
      // 이미지 요소 찾기
      const imgElement = await page.locator('.message-content img').first();
      
      // 이미지가 실제로 로드될 때까지 대기
      await expect(imgElement).toBeVisible({ timeout: 30000 });
      
      // 이미지 속성 확인
      const imgSrc = await imgElement.getAttribute('src');
      expect(imgSrc).toBeTruthy();
      
      // 이미지 크기 확인
      const dimensions = await imgElement.evaluate((img) => {
        return {
          naturalWidth: (img as HTMLImageElement).naturalWidth,
          naturalHeight: (img as HTMLImageElement).naturalHeight
        };
      });
      expect(dimensions.naturalWidth).toBeGreaterThan(0);
      expect(dimensions.naturalHeight).toBeGreaterThan(0);
      
      // 이미지 로드 상태 확인
      await imgElement.evaluate(img => {
        return new Promise((resolve, reject) => {
          if (img instanceof HTMLImageElement) {
            if (img.complete) {
              if (img.naturalWidth === 0) {
                reject(new Error('Image failed to load'));
              }
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => reject(new Error('Image failed to load'));
            }
          }
        });
      });
    }

    // // AI에게 이미지 분석 요청
    // await helpers.sendAIMessage(uploader, '방금 공유된 이미지는 어떤 이미지인가요?');
    
    // // AI 응답 대기 및 검증
    // const aiResponse = await uploader.waitForSelector('.message-ai', {
    //   timeout: 30000
    // });
    // const responseText = await aiResponse.textContent();
    // expect(responseText?.toLowerCase()).toMatch(/manchester|united|logo|football/i);

    // 테스트 종료 전 채팅방 확인
    // for (const page of [uploader, viewer]) {
    //   const finalRoomName = await page.locator('.chat-room-title').textContent();
    //   expect(finalRoomName).toBe(uploaderRoomParam);
    // }
    
    // 리소스 정리
    await Promise.all([uploader.close(), viewer.close()]);
  });
});