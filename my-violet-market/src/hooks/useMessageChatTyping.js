import { useCallback, useEffect, useRef, useState } from 'react';
import { emitMessageChatTyping } from '../socket/messageChatSocketClient';
import { MESSAGE_CHAT_SOCKET_EVENTS } from '../socket/messageChatSocketConfig';
import { subscribeMessageChatSocket } from '../socket/useMessageChatSocket';

const TYPING_STOP_MS = 2000;
const TYPING_HIDE_MS = 4000;

export function useMessageChatTyping({ sellerId, userId, enabled = false, watchSender }) {
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const stopTimerRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setIsPartnerTyping(false);
      return undefined;
    }

    const unsubscribeTyping = subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.TYPING, (payload) => {
      if (!payload || payload.sender !== watchSender) return;
      if (sellerId && String(payload.sellerId) !== String(sellerId)) return;
      if (userId && String(payload.userId) !== String(userId)) return;
      setIsPartnerTyping(Boolean(payload.isTyping));
    });

    const unsubscribeMessage = subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, (payload) => {
      if (sellerId && String(payload.sellerId) !== String(sellerId)) return;
      if (userId && String(payload.userId) !== String(userId)) return;
      if (payload?.message?.sender === watchSender) {
        setIsPartnerTyping(false);
      }
    });

    return () => {
      unsubscribeTyping();
      unsubscribeMessage();
    };
  }, [enabled, sellerId, userId, watchSender]);

  useEffect(() => {
    if (!isPartnerTyping) return undefined;
    const timer = setTimeout(() => setIsPartnerTyping(false), TYPING_HIDE_MS);
    return () => clearTimeout(timer);
  }, [isPartnerTyping]);

  useEffect(() => {
    if (!enabled) {
      clearTimeout(stopTimerRef.current);
    }
  }, [enabled]);

  const notifyPartnerTyping = useCallback(
    (isTyping) => {
      if (!enabled) return;

      if (sellerId) {
        emitMessageChatTyping({ sellerId, isTyping });
      } else if (userId) {
        emitMessageChatTyping({ userId, isTyping });
      }
    },
    [enabled, sellerId, userId],
  );

  const stopTyping = useCallback(() => {
    clearTimeout(stopTimerRef.current);
    notifyPartnerTyping(false);
  }, [notifyPartnerTyping]);

  const handleComposerActivity = useCallback(
    (isActive) => {
      notifyPartnerTyping(isActive);

      clearTimeout(stopTimerRef.current);
      if (isActive) {
        stopTimerRef.current = setTimeout(() => notifyPartnerTyping(false), TYPING_STOP_MS);
      }
    },
    [notifyPartnerTyping],
  );

  return {
    isPartnerTyping,
    handleComposerActivity,
    stopTyping,
  };
}
