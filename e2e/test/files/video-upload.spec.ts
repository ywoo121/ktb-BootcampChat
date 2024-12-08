import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import path from 'path';

test.describe('비디오 업로드 테스트', () => {
  const helpers = new TestHelpers();

  test('비디오 파일 업로드 및 재생', async ({ browser }) => {
    const roomPrefix = 'Video-Test';
    
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

    // 비디오 업로드
    const videoPath = path.join(__dirname, '../fixtures/media/mp4-test.mp4');
    
    // 채팅 UI가 완전히 로드될 때까지 대기
    await uploader.waitForSelector('.chat-input-wrapper', {
      state: 'visible',
      timeout: 30000
    });
    
    // 파일 입력 필드 찾기 및 파일 설정
    const fileInput = await uploader.waitForSelector('input[type="file"]', {
      state: 'attached',
      timeout: 30000
    });
    await fileInput.setInputFiles(videoPath);
    
    // 비디오 프리뷰 확인
    await uploader.waitForSelector('.file-preview-item video', {
      state: 'visible',
      timeout: 30000
    });
    
    // 프리뷰 안정화를 위한 대기
    await uploader.waitForTimeout(1000);

    // 전송 버튼 찾기
    const submitButton = await uploader.waitForSelector(
      'button[type="submit"], .chat-input-actions button[title*="보내기"], .chat-input-actions button.send-button', 
      {
        state: 'visible',
        timeout: 30000
      }
    );
    
    // 버튼이 클릭 가능한 상태가 될 때까지 대기
    await submitButton.waitForElementState('stable');
    
    // 파일 업로드 시작
    await submitButton.click();

    // 업로드 진행 표시 사라질 때까지 대기 (있는 경우)
    await uploader.waitForSelector('.upload-progress', {
      state: 'detached',
      timeout: 30000
    }).catch(() => {}); // 진행 표시가 없을 수 있으므로 에러 무시

    // 비디오 메시지가 나타날 때까지 대기 (양쪽 모두)
    const messageSelector = '.message-content:has(video)';
    await Promise.all([
      uploader.waitForSelector(messageSelector, { timeout: 30000 }),
      viewer.waitForSelector(messageSelector, { timeout: 30000 })
    ]);

    // 양쪽 모두에서 비디오 플레이어 확인
    for (const page of [uploader, viewer]) {
      // 비디오 메시지 컨테이너 찾기
      const videoMessage = page.locator('.message-content').filter({ hasText: '.mp4' }).last();
      await expect(videoMessage).toBeVisible({ timeout: 30000 });

      // 비디오 플레이어 확인
      const videoPlayer = videoMessage.locator('video');
      await expect(videoPlayer).toBeVisible({ timeout: 30000 });
      await expect(videoPlayer).toHaveAttribute('controls', '', { timeout: 30000 });

      // // 비디오 메타데이터 로드 대기
      // await videoPlayer.evaluate(video => {
      //   return new Promise((resolve) => {
      //     if (video instanceof HTMLVideoElement) {
      //       if (video.readyState >= 1) {
      //         resolve(true);
      //       } else {
      //         video.onloadedmetadata = () => resolve(true);
      //         video.onerror = () => resolve(false);
      //       }
      //     }
      //   });
      // });

      // 비디오 컨트롤러가 초기화될 때까지 대기
      // await page.waitForTimeout(2000);

      // // 비디오 컨트롤러 요소들 확인
      // const controls = videoMessage.locator('.video-controls');
      // await expect(controls).toBeVisible({ timeout: 30000 });

      // const playButton = controls.locator('.play-button');
      // await expect(playButton).toBeVisible({ timeout: 30000 });

      // const timeDisplay = controls.locator('.time-display');
      // await expect(timeDisplay).toBeVisible({ timeout: 30000 });

      // // 비디오 정보 확인
      // const videoDuration = await videoPlayer.evaluate(video => {
      //   if (video instanceof HTMLVideoElement) {
      //     return video.duration;
      //   }
      //   return 0;
      // });
      // expect(videoDuration).toBeGreaterThan(0);
    }

    // 비디오 재생 테스트 (업로더 화면에서)
    // const uploaderVideo = uploader.locator('video').first();
    // const uploaderPlayButton = uploader.locator('.video-controls .play-button').first();

    // // 재생 버튼 클릭
    // await uploaderPlayButton.click();
    // await expect(uploaderVideo).toHaveAttribute('data-playing', 'true', { timeout: 30000 });
    
    // // 잠시 재생
    // await uploader.waitForTimeout(2000);

    // // 일시정지
    // await uploaderPlayButton.click();
    // await expect(uploaderVideo).toHaveAttribute('data-playing', 'false', { timeout: 30000 });

    // // AI에게 비디오 정보 요청
    // await helpers.sendAIMessage(uploader, '방금 공유된 비디오 파일의 정보를 알려주세요.');
    // const aiResponse = await uploader.waitForSelector('.message-ai', { timeout: 30000 });
    // const responseText = await aiResponse.textContent();
    // expect(responseText).toMatch(/mp4|video|media/i);

    // 테스트 종료 전 채팅방 확인
    // for (const page of [uploader, viewer]) {
    //   const finalRoomName = await page.locator('.chat-room-title').textContent();
    //   expect(finalRoomName).toBe(uploaderRoomParam);
    // }

    // 리소스 정리
    await Promise.all([uploader.close(), viewer.close()]);
  });
});