import { useEffect, useState } from 'react';
import { MESSAGE_CHAT_SOCKET_EVENTS } from '../socket/messageChatSocketConfig';
import { subscribeMessageChatSocket } from '../socket/useMessageChatSocket';

const SENDING_HIDE_MS = 15000;

export function useMessageChatSending({ sellerId, userId, enabled = false, watchSender }) {
  const [isPartnerSending, setIsPartnerSending] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsPartnerSending(false);
      return undefined;
    }

    const unsubscribeSending = subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.SENDING, (payload) => {
      if (!payload || payload.sender !== watchSender) return;
      if (sellerId && String(payload.sellerId) !== String(sellerId)) return;
      if (userId && String(payload.userId) !== String(userId)) return;
      setIsPartnerSending(Boolean(payload.isSending));
    });

    const unsubscribeMessage = subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, (payload) => {
      if (sellerId && String(payload.sellerId) !== String(sellerId)) return;
      if (userId && String(payload.userId) !== String(userId)) return;
      if (payload?.message?.sender === watchSender) {
        setIsPartnerSending(false);
      }
    });

    return () => {
      unsubscribeSending();
      unsubscribeMessage();
    };
  }, [enabled, sellerId, userId, watchSender]);

  useEffect(() => {
    if (!isPartnerSending) return undefined;
    const timer = setTimeout(() => setIsPartnerSending(false), SENDING_HIDE_MS);
    return () => clearTimeout(timer);
  }, [isPartnerSending]);

  return { isPartnerSending };
}
