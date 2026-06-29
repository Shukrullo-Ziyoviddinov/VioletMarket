import { useEffect } from 'react';
import {
  connectMessageChatSocket,
  disconnectMessageChatSocket,
  subscribeMessageChatSocket,
} from './messageChatSocketClient';
import { MESSAGE_CHAT_SOCKET_EVENTS } from './messageChatSocketConfig';

export function useMessageChatSocketConnection(authToken) {
  useEffect(() => {
    if (!authToken) {
      disconnectMessageChatSocket();
      return undefined;
    }

    connectMessageChatSocket(authToken);
    return () => disconnectMessageChatSocket();
  }, [authToken]);
}

export function useMessageChatSocketThreadsUpdated(onThreadsUpdated) {
  useEffect(() => {
    if (!onThreadsUpdated) return undefined;

    return subscribeMessageChatSocket(
      MESSAGE_CHAT_SOCKET_EVENTS.THREADS_UPDATED,
      onThreadsUpdated,
    );
  }, [onThreadsUpdated]);
}

export { MESSAGE_CHAT_SOCKET_EVENTS, subscribeMessageChatSocket };
