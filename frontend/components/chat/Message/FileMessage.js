import React, { useState, useEffect } from 'react';
import { 
  PdfIcon as FileText, 
  ImageIcon as Image, 
  MovieIcon as Film, 
  MusicIcon as Music, 
  LinkOutlineIcon as ExternalLink,
  DownloadIcon as Download,
  ErrorCircleIcon as AlertCircle 
} from '@vapor-ui/icons';

import { Button, Text, Callout } from '@vapor-ui/core';
import PersistentAvatar from '../../common/PersistentAvatar';
import MessageContent from './MessageContent';
import MessageActions from './MessageActions';
import ReadStatus from '../ReadStatus';
import fileService from '../../../services/fileService';
import authService from '../../../services/authService';

const FileMessage = ({ 
  msg = {}, 
  isMine = false, 
  currentUser = null,
  onReactionAdd,
  onReactionRemove,
  room = null,
  messageRef,
  socketRef
}) => {
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    const loadPreviewUrl = async () => {
      if (msg?.file) {
        setIsLoadingPreview(true);
        try {
          const url = await fileService.getPreviewUrl(msg.file);
          setPreviewUrl(url);
          console.debug('Preview URL loaded:', {
            filename: msg.file.filename,
            url
          });
        } catch (error) {
          console.error('Failed to load preview URL:', error);
          setError('미리보기 URL을 가져올 수 없습니다.');
        } finally {
          setIsLoadingPreview(false);
        }
      }
    };

    loadPreviewUrl();
  }, [msg?.file]);

  if (!msg?.file) {
    console.error('File data is missing:', msg);
    return null;
  }

  const formattedTime = new Date(msg.timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\./g, '년').replace(/\s/g, ' ').replace('일 ', '일 ');

  const getFileIcon = () => {
    const mimetype = msg.file?.mimetype || '';
    const iconProps = { className: "w-5 h-5 flex-shrink-0" };

    if (mimetype.startsWith('image/')) {
      return Image ? <Image {...iconProps} color="#00C853" /> : <span>📷</span>;
    }
    if (mimetype.startsWith('video/')) {
      return Film ? <Film {...iconProps} color="#2196F3" /> : <span>🎥</span>;
    }
    if (mimetype.startsWith('audio/')) {
      return Music ? <Music {...iconProps} color="#9C27B0" /> : <span>🎵</span>;
    }
    return FileText ? <FileText {...iconProps} color="#ffffff" /> : <span>📄</span>;
  };

  const getDecodedFilename = (encodedFilename) => {
    try {
      if (!encodedFilename) return 'Unknown File';
      
      const base64 = encodedFilename
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      const pad = base64.length % 4;
      const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
      
      if (paddedBase64.match(/^[A-Za-z0-9+/=]+$/)) {
        return Buffer.from(paddedBase64, 'base64').toString('utf8');
      }

      return decodeURIComponent(encodedFilename);
    } catch (error) {
      console.error('Filename decoding error:', error);
      return encodedFilename;
    }
  };

  const renderAvatar = () => (
    <PersistentAvatar 
      user={isMine ? currentUser : msg.sender}
      size="md"
      className="flex-shrink-0"
      showInitials={true}
    />
  );

  const handleFileDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    
    try {
      if (!msg.file?.filename) {
        throw new Error('파일 정보가 없습니다.');
      }

      console.log('Starting download for:', msg.file.filename);
      const result = await fileService.downloadFile(msg.file.filename, msg.file.originalname);
      
      if (!result.success) {
        throw new Error(result.message || '다운로드에 실패했습니다.');
      }

      console.log('Download completed successfully');

    } catch (error) {
      console.error('File download error:', error);
      setError(error.message || '파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleViewInNewTab = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    try {
      if (!msg.file?.filename) {
        throw new Error('파일 정보가 없습니다.');
      }

      if (!previewUrl) {
        throw new Error('미리보기 URL이 없습니다.');
      }

      const newWindow = window.open(previewUrl, '_blank');
      if (!newWindow) {
        throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      }
      newWindow.opener = null;

    } catch (error) {
      console.error('File view error:', error);
      setError(error.message || '파일 보기 중 오류가 발생했습니다.');
    }
  };

  const renderImagePreview = (originalname) => {
    if (!msg?.file?.filename) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          {Image ? <Image className="w-8 h-8 text-gray-400" /> : <span className="text-2xl">📷</span>}
        </div>
      );
    }

    if (isLoadingPreview) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <span>로딩중...</span>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          {Image ? <Image className="w-8 h-8 text-gray-400" /> : <span className="text-2xl">📷</span>}
          <span className="ml-2">미리보기 불가</span>
        </div>
      );
    }

    return (
      <div className="bg-transparent-pattern">
        <img 
          src={previewUrl}
          alt={originalname}
          className="object-cover rounded-sm max-w-full h-auto"
          onLoad={() => {
            console.debug('Image loaded successfully:', originalname);
          }}
          onError={(e) => {
            console.error('Image load error:', {
              src: e.target.src,
              originalname
            });
            e.target.onerror = null; 
            e.target.src = '/images/placeholder-image.png';
            setError('이미지를 불러올 수 없습니다.');
          }}
          loading="lazy"
        />
      </div>
    );
  };

  const renderFileActions = () => (
    <div className="file-actions mt-2 pt-2 border-t border-gray-200">
      <Button
        size="sm"
        variant="outline"
        onClick={handleViewInNewTab}
        title="새 탭에서 보기"
      >
        {ExternalLink ? <ExternalLink size={16} /> : <span>🔗</span>}
        <span>새 탭에서 보기</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleFileDownload}
        title="다운로드"
      >
        {Download ? <Download size={16} /> : <span>⬇️</span>}
        <span>다운로드</span>
      </Button>
    </div>
  );
  const renderFilePreview = () => {
    const mimetype = msg.file?.mimetype || '';
    const originalname = getDecodedFilename(msg.file?.originalname || 'Unknown File');
    const size = fileService.formatFileSize(msg.file?.size || 0);

    const previewWrapperClass = 
      "overflow-hidden";
    const fileInfoClass = 
      "flex items-center gap-3 p-1 mt-2";

    if (mimetype.startsWith('image/')) {
      return (
        <div className={previewWrapperClass}>
          {renderImagePreview(originalname)}
          <div className={fileInfoClass}>
            <div className="flex-1 min-w-0">
              <Text typography="body2" className="font-medium truncate">{getFileIcon()} {originalname}</Text>
              <span className="text-sm text-muted">{size}</span>
            </div>
          </div>
          {renderFileActions()}
        </div>
      );
    }

    if (mimetype.startsWith('video/')) {
      return (
        <div className={previewWrapperClass}>
          <div>
            {previewUrl ? (
              <video 
                className="object-cover rounded-sm"
                controls
                preload="metadata"
                aria-label={`${originalname} 비디오`}
                crossOrigin="use-credentials"
              >
                <source src={previewUrl} type={mimetype} />
                <track kind="captions" />
                비디오를 재생할 수 없습니다.
              </video>
            ) : (
              <div className="flex items-center justify-center h-full">
                {Film ? <Film className="w-8 h-8 text-gray-400" /> : <span className="text-2xl">🎥</span>}
              </div>
            )}
          </div>
          <div className={fileInfoClass}>
            <div className="flex-1 min-w-0">
              <Text typography="body2" className="font-medium truncate">{getFileIcon()} {originalname}</Text>
              <span className="text-sm text-muted">{size}</span>
            </div>
          </div>
          {renderFileActions()}
        </div>
      );
    }

    if (mimetype.startsWith('audio/')) {
      return (
        <div className={previewWrapperClass}>
          <div className={fileInfoClass}>
            <div className="flex-1 min-w-0">
              <Text typography="body2" className="font-medium truncate">{getFileIcon()} {originalname}</Text>
              <span className="text-sm text-muted">{size}</span>
            </div>
          </div>
          <div className="px-3 pb-3">
            {previewUrl && (
              <audio 
                className="w-full"
                controls
                preload="metadata"
                aria-label={`${originalname} 오디오`}
                crossOrigin="use-credentials"
              >
                <source src={previewUrl} type={mimetype} />
                오디오를 재생할 수 없습니다.
              </audio>
            )}
          </div>
          {renderFileActions()}
        </div>
      );
    }

    return (
      <div className={previewWrapperClass}>
        <div className={fileInfoClass}>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{getFileIcon()} {originalname}</div>
            <Text typography="body2" as="span">{size}</Text>
          </div>
        </div>
        {renderFileActions()}
      </div>
    );
  };

  return (
    <div className="messages">
      <div className={`message-group ${isMine ? 'mine' : 'yours'}`}>
        <div className="message-sender-info">
          {renderAvatar()}
          <span className="sender-name">
            {isMine ? '나' : msg.sender?.name}
          </span>
        </div>
        <div className={`message-bubble ${isMine ? 'message-mine' : 'message-other'} last file-message`}>
          <div className="message-content">
            {error && (
              <Callout color="danger" className="mb-3 d-flex align-items-center">
                {AlertCircle ? <AlertCircle className="w-4 h-4 me-2" /> : <span>⚠️</span>}
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ms-auto"
                  aria-label="Close"
                  onClick={() => setError(null)}
                >
                  ×
                </Button>
              </Callout>
            )}
            {renderFilePreview()}
            {msg.content && (
              <div className="mt-3">
                <MessageContent content={msg.content} />
              </div>
            )}
          </div>
          <div className="message-footer">
            <div 
              className="message-time mr-3" 
              title={new Date(msg.timestamp).toLocaleString('ko-KR')}
            >
              {formattedTime}
            </div>
            <ReadStatus 
              messageType={msg.type}
              participants={room.participants}
              readers={msg.readers}
              messageId={msg._id}
              messageRef={messageRef}
              currentUserId={currentUser.id}
              socketRef={socketRef}
            />
          </div>
        </div>
        <MessageActions 
          messageId={msg._id}
          messageContent={msg.content}
          reactions={msg.reactions}
          currentUserId={currentUser?.id}
          onReactionAdd={onReactionAdd}
          onReactionRemove={onReactionRemove}
          isMine={isMine}
          room={room}
          message={msg}
          socketRef={socketRef}
        />        
      </div>
    </div>
  );
};

FileMessage.defaultProps = {
  msg: {
    file: {
      mimetype: '',
      filename: '',
      originalname: '',
      size: 0
    }
  },
  isMine: false,
  currentUser: null
};

export default React.memo(FileMessage);
