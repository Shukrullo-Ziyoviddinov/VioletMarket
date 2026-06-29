import { getApiBaseUrl } from '../config/api';

export const MESSAGE_CHAT_SOCKET_EVENTS = {
  MESSAGE: 'messageChat:message',
  THREADS_UPDATED: 'messageChat:threadsUpdated',
  TYPING: 'messageChat:typing',
  SENDING: 'messageChat:sending',
  PRESENCE_SUBSCRIBE: 'messageChat:presence:subscribe',
  PRESENCE_UPDATE: 'messageChat:presence:update',
  READ: 'messageChat:read',
};

export function getMessageChatSocketUrl() {
  return getApiBaseUrl();
}
