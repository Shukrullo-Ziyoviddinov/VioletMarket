import { useEffect } from 'react';
import {
  MESSAGE_CHAT_SOCKET_EVENTS,
  subscribeMessageChatSocket,
} from './useMessageChatSocket';

export const SELLER_MESSAGE_CHAT_INCOMING_EVENT = 'sellerMessageChatIncoming';

export function useSellerMessageChatSocketHub(active) {
  useEffect(() => {
    if (!active) return undefined;

    return subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, (payload) => {
      window.dispatchEvent(
        new CustomEvent(SELLER_MESSAGE_CHAT_INCOMING_EVENT, { detail: payload }),
      );
    });
  }, [active]);
}
