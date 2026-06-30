import { getApiBaseUrl } from '../config/api';

export const MESSAGE_CHAT_SOCKET_EVENTS = {
  MESSAGE: 'messageChat:message',
  THREADS_UPDATED: 'messageChat:threadsUpdated',
  THREAD_DELETED: 'messageChat:threadDeleted',
  TYPING: 'messageChat:typing',
  SENDING: 'messageChat:sending',
  PRESENCE_SUBSCRIBE: 'messageChat:presence:subscribe',
  PRESENCE_UPDATE: 'messageChat:presence:update',
  READ: 'messageChat:read',
  MESSAGE_DELETED: 'messageChat:messageDeleted',
  MESSAGE_UPDATED: 'messageChat:messageUpdated',
};

export function getMessageChatSocketUrl() {
  return getApiBaseUrl();
}
