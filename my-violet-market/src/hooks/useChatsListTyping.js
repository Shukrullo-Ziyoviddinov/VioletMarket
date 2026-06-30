import { useEffect, useState } from 'react';
import { MESSAGE_CHAT_SOCKET_EVENTS } from '../socket/messageChatSocketConfig';
import { subscribeMessageChatSocket } from '../socket/useMessageChatSocket';

const TYPING_HIDE_MS = 4000;

export function useChatsListTyping(sellerIds = [], enabled = false) {
  const [typingMap, setTypingMap] = useState({});

  useEffect(() => {
    if (!enabled || sellerIds.length === 0) {
      setTypingMap({});
      return undefined;
    }

    const ids = new Set(sellerIds.map(String));
    const hideTimers = new Map();

    const setTyping = (sellerId, isTyping) => {
      const id = String(sellerId);
      if (!ids.has(id)) return;

      if (hideTimers.has(id)) {
        clearTimeout(hideTimers.get(id));
        hideTimers.delete(id);
      }

      setTypingMap((current) => {
        if (!isTyping) {
          if (!current[id]) return current;
          const next = { ...current };
          delete next[id];
          return next;
        }
        return { ...current, [id]: true };
      });

      if (isTyping) {
        hideTimers.set(
          id,
          setTimeout(() => {
            setTypingMap((current) => {
              if (!current[id]) return current;
              const next = { ...current };
              delete next[id];
              return next;
            });
            hideTimers.delete(id);
          }, TYPING_HIDE_MS),
        );
      }
    };

    const unsubscribeTyping = subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.TYPING, (payload) => {
      if (!payload || payload.sender !== 'seller') return;
      setTyping(payload.sellerId, Boolean(payload.isTyping));
    });

    const unsubscribeMessage = subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, (payload) => {
      if (payload?.message?.sender === 'seller') {
        setTyping(payload.sellerId, false);
      }
    });

    return () => {
      unsubscribeTyping();
      unsubscribeMessage();
      hideTimers.forEach((timer) => clearTimeout(timer));
      hideTimers.clear();
    };
  }, [enabled, sellerIds.join('|')]);

  return typingMap;
}
