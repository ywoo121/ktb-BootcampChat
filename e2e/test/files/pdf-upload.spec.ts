import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import path from 'path';

test.describe('PDF 업로드 테스트', () => {
  const helpers = new TestHelpers();

  test('PDF 문서 업로드 및 공유', async ({ browser }) => {
    const roomPrefix = 'PDF-Test';
    
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

    // PDF 업로드
    const pdfPath = path.join(__dirname, '../fixtures/documents/pdf-test.pdf');
    
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
    await fileInput.setInputFiles(pdfPath);
    
    // 파일 프리뷰 확인
    await uploader.waitForSelector('.file-preview-item .file-icon', {
      state: 'visible',
      timeout: 30000
    });
    
    // 프리뷰가 안정화될 때까지 잠시 대기
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

    // // 업로드 진행 표시 사라질 때까지 대기 (있는 경우)
    // await uploader.waitForSelector('.upload-progress', {
    //   state: 'detached',
    //   timeout: 30000
    // }).catch(() => {}); // 진행 표시가 없을 수 있으므로 에러 무시

    // // 파일 메시지가 나타날 때까지 대기 (양쪽 모두)
    // const messageSelector = '.message-content:has(.file-message)';
    // await Promise.all([
    //   uploader.waitForSelector(messageSelector, { timeout: 30000 }),
    //   viewer.waitForSelector(messageSelector, { timeout: 30000 })
    // ]);

    // // 양쪽 모두에서 PDF 메시지 요소 확인
    // for (const page of [uploader, viewer]) {
    //   // PDF 메시지 컨테이너 찾기
    //   const fileMessage = page.locator('.message-content .file-message').last();
    //   await expect(fileMessage).toBeVisible({ timeout: 30000 });

    //   // PDF 아이콘 확인
    //   const fileIcon = fileMessage.locator('.file-icon');
    //   await expect(fileIcon).toBeVisible({ timeout: 30000 });

    //   // 파일명 확인
    //   const fileName = fileMessage.locator('.file-name');
    //   await expect(fileName).toBeVisible({ timeout: 30000 });
    //   await expect(fileName).toContainText('pdf-test.pdf', { timeout: 30000 });

    //   // 다운로드 버튼 확인
    //   const downloadButton = fileMessage.locator('button:has-text("다운로드")');
    //   await expect(downloadButton).toBeVisible({ timeout: 30000 });

    //   // 새 탭에서 보기 버튼 확인
    //   const viewButton = fileMessage.locator('button:has-text("새 탭에서 보기")');
    //   await expect(viewButton).toBeVisible({ timeout: 30000 });
    // }

    // // 다운로드 기능 테스트
    // const downloadPromise = viewer.waitForEvent('download');
    // await viewer.locator('.file-message button:has-text("다운로드")').last().click();
    // const download = await downloadPromise;
    // expect(download.suggestedFilename()).toBe('pdf-test.pdf');

    // // AI에게 PDF 파일 정보 요청
    // await helpers.sendAIMessage(uploader, '방금 공유된 PDF 파일의 정보를 알려주세요.');
    
    // // AI 응답 대기 및 검증
    // const aiResponse = await uploader.waitForSelector('.message-ai', {
    //   timeout: 30000
    // });
    // const responseText = await aiResponse.textContent();
    // expect(responseText?.toLowerCase()).toMatch(/pdf|document|file/i);

    // 테스트 종료 전 채팅방 확인
    // for (const page of [uploader, viewer]) {
    //   const finalRoomName = await page.locator('.chat-room-title').textContent();
    //   expect(finalRoomName).toBe(uploaderRoomParam);
    // }

    // 리소스 정리
    await Promise.all([uploader.close(), viewer.close()]);
  });
});