// test/data/message-prompts.ts

export interface MessagePrompt {
  category: string;
  context: string;
  prompt: string;
  parameters: string[];
}

export const MESSAGE_PROMPTS: Record<string, MessagePrompt> = {
  GREETING: {
    category: 'General',
    context: '채팅방에 처음 입장했을 때의 인사',
    prompt: '[USER_NAME]님이 [ROOM_NAME] 채팅방에 처음 입장했을 때 적절한 인사말을 20자 이내로 생성해주세요.',
    parameters: ['USER_NAME', 'ROOM_NAME']
  },
  CHAT_RESPONSE: {
    category: 'Conversation',
    context: '이전 메시지에 대한 응답',
    prompt: '[PREV_MESSAGE]라는 메시지에 대해 [USER_NAME]님이 할 수 있는 자연스러운 응답을 20자 이내로 생성해주세요.',
    parameters: ['PREV_MESSAGE', 'USER_NAME']
  },
  GROUP_CHAT: {
    category: 'Group',
    context: '그룹 채팅에서의 대화 참여',
    prompt: '[CURRENT_TOPIC]에 대한 그룹 대화에서 [USER_NAME]님이 할 수 있는 적절한 답변을 20자 이내로 생성해주세요.',
    parameters: ['CURRENT_TOPIC', 'USER_NAME']
  },
  FILE_COMMENT: {
    category: 'File',
    context: '파일 공유 시 코멘트',
    prompt: '[FILE_TYPE] 파일인 [FILE_NAME]을 공유할 때 덧붙일 수 있는 적절한 코멘트를 20자 이내로 생성해주세요.',
    parameters: ['FILE_TYPE', 'FILE_NAME']
  },
  REACTION_COMMENT: {
    category: 'Reaction',
    context: '이모지 리액션에 대한 답변',
    prompt: '[REACTION_EMOJI]로 리액션한 메시지에 대한 답변을 20자 이내로 생성해주세요.',
    parameters: ['REACTION_EMOJI']
  }
};