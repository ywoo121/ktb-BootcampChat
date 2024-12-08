import React from 'react';
import { Card } from '@goorm-dev/vapor-core';
import { 
  Text,
  Status,
  Avatar,
  UserAvatarGroup,
  CountAvatar,
  Spinner,
  Button,
  Alert
} from '@goorm-dev/vapor-components';
import { 
  AlertCircle, 
  WifiOff 
} from 'lucide-react';
import { withAuth } from '../middleware/withAuth';
import { useChatRoom } from '../hooks/useChatRoom';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import { generateColorFromEmail, getContrastTextColor } from '../utils/colorUtils';

const ChatPage = () => {
  const {
    room,
    messages,
    streamingMessages,
    connected,
    connectionStatus,
    messageLoadError,
    retryMessageLoad,
    currentUser,
    message,
    showEmojiPicker,
    showMentionList,
    mentionFilter,
    mentionIndex,
    filePreview,
    fileInputRef,
    messageInputRef,
    messagesEndRef,
    socketRef,
    handleMessageChange,
    handleMessageSubmit,
    handleEmojiToggle,
    setMessage,
    setShowEmojiPicker,
    setShowMentionList,
    setMentionFilter,
    setMentionIndex,
    handleKeyDown,
    removeFilePreview,
    getFilteredParticipants,
    insertMention,
    loading,
    error,
    handleReactionAdd,
    handleReactionRemove,
    loadingMessages,
    hasMoreMessages,
    handleLoadMore
  } = useChatRoom();

  const renderParticipants = () => {
    if (!room?.participants) return null;

    const maxVisibleAvatars = 3;
    const participants = room.participants;
    const remainingCount = Math.max(0, participants.length - maxVisibleAvatars);

    return (
      <div className="flex items-center gap-4 mt-2 px-6 border-b">
        <UserAvatarGroup size="md">
          {participants.slice(0, maxVisibleAvatars).map(participant => {
            const backgroundColor = generateColorFromEmail(participant.email);
            const color = getContrastTextColor(backgroundColor);
            
            return (
              <Avatar 
                key={participant._id} 
                style={{ backgroundColor, color }}
                className="participant-avatar"
                name={participant.name}
              />
            );
          })}
          {remainingCount > 0 && (
            <CountAvatar value={remainingCount} />
          )}
          <div className="ml-3">총 {participants.length}명</div>
        </UserAvatarGroup>
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="chat-container">
      <Card className="chat-room-card">
        <Card.Body className="flex items-center justify-center">
          <div className="text-center mt-5">
            <Spinner size="lg" className="mb-4" />
            <br/>
            <Text size="lg">채팅방 연결 중...</Text>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  const renderErrorState = () => (
    <div className="chat-container">
      <Card className="chat-room-card">
        <Card.Body className="flex items-center justify-center">
          <Alert color="danger" className="mb-4">
            <AlertCircle className="w-5 h-5" />
            <span className="ml-2">
              {error || '채팅방을 불러오는데 실패했습니다.'}
            </span>
          </Alert>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </Button>
        </Card.Body>
      </Card>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-4">
          <Spinner size="sm" />
          <Text className="ml-2">채팅방 연결 중...</Text>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <Alert color="danger" className="mb-4">
            <AlertCircle className="w-5 h-5" />
            <span className="ml-2">{error}</span>
          </Alert>
          <Button variant="primary" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      );
    }

    if (connectionStatus === 'disconnected') {
      return (
        <Alert color="warning" className="m-4">
          <WifiOff className="w-5 h-5" />
          <span className="ml-2">연결이 끊어졌습니다. 재연결을 시도합니다...</span>
        </Alert>
      );
    }

    if (messageLoadError) {
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <Alert color="danger" className="mb-4">
            <AlertCircle className="w-5 h-5" />
            <span className="ml-2">메시지 로딩 중 오류가 발생했습니다.</span>
          </Alert>
          <Button variant="primary" onClick={retryMessageLoad}>
            메시지 다시 로드
          </Button>
        </div>
      );
    }

    return (
      <ChatMessages
        messages={messages}
        streamingMessages={streamingMessages}
        currentUser={currentUser}
        room={room}
        messagesEndRef={messagesEndRef}
        onReactionAdd={handleReactionAdd}
        onReactionRemove={handleReactionRemove}
        loadingMessages={loadingMessages}
        hasMoreMessages={hasMoreMessages}
        onLoadMore={handleLoadMore}
        socketRef={socketRef}
      />
    );
  };

  if (loading || !room) {
    return renderLoadingState();
  }

  if (error) {
    return renderErrorState();
  }

  const getConnectionStatus = () => {
    if (connectionStatus === 'connecting') {
      return {
        label: "연결 중...",
        color: "warning"
      };
    } else if (connectionStatus === 'connected') {
      return {
        label: "연결됨",
        color: "success"
      };
    } else {
      return {
        label: "연결 끊김",
        color: "danger"
      };
    }
  };

  const status = getConnectionStatus();

  return (
    <div className="chat-container">
      <Card className="chat-room-card">
        <Card.Header className="chat-room-header">
          <div className="flex items-center gap-3">
            <Text size="xl" weight="bold" className="chat-room-title">
              {room.name}
            </Text>
            {renderParticipants()}
          </div>
          <Status
            label={status.label}
            color={status.color}
            title={connectionStatus === 'connecting' ? "재연결 시도 중..." : status.label}
          />
        </Card.Header>

        <Card.Body className="chat-room-body">
          <div className="chat-messages">
            {renderContent()}
          </div>
        </Card.Body>

        <Card.Footer className="chat-room-footer">
          <ChatInput 
            message={message}
            onMessageChange={handleMessageChange}
            onSubmit={handleMessageSubmit}
            onEmojiToggle={handleEmojiToggle}
            fileInputRef={fileInputRef}
            messageInputRef={messageInputRef}
            filePreview={filePreview}
            disabled={connectionStatus !== 'connected'}
            uploading={false}
            showEmojiPicker={showEmojiPicker}
            showMentionList={showMentionList}
            mentionFilter={mentionFilter}
            mentionIndex={mentionIndex}
            getFilteredParticipants={getFilteredParticipants}
            setMessage={setMessage}
            setShowEmojiPicker={setShowEmojiPicker}
            setShowMentionList={setShowMentionList}
            setMentionFilter={setMentionFilter}
            setMentionIndex={setMentionIndex}
            room={room} // room 객체 전달
            onMentionSelect={(user) => {
              insertMention(user);
              setShowMentionList(false);
            }}
            onFileRemove={removeFilePreview}
          />
        </Card.Footer>
      </Card>
    </div>
  );
};

export default withAuth(ChatPage);