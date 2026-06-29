import { useEffect, useState } from 'react';
import { MESSAGE_CHAT_SOCKET_EVENTS } from '../socket/messageChatSocketConfig';
import {
  emitMessageChatPresenceSubscribe,
  getMessageChatSocket,
} from '../socket/messageChatSocketClient';
import { subscribeMessageChatSocket } from '../socket/useMessageChatSocket';

export function useMessageChatPresence({ userId, sellerId, enabled = false, watchKind }) {
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [partnerLastActiveAt, setPartnerLastActiveAt] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setIsPartnerOnline(false);
      setPartnerLastActiveAt(null);
      return undefined;
    }

    const targetUserId = watchKind === 'user' ? userId : null;
    const targetSellerId = watchKind === 'seller' ? sellerId : null;

    if (watchKind === 'user' && !targetUserId) return undefined;
    if (watchKind === 'seller' && !targetSellerId) return undefined;

    const subscribePresence = () => {
      if (watchKind === 'user') {
        emitMessageChatPresenceSubscribe({ watchKind: 'user', userId: targetUserId });
        return;
      }
      emitMessageChatPresenceSubscribe({ watchKind: 'seller', sellerId: targetSellerId });
    };

    subscribePresence();

    const activeSocket = getMessageChatSocket();
    activeSocket?.on('connect', subscribePresence);

    const unsubscribe = subscribeMessageChatSocket(
      MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE,
      (payload) => {
        if (!payload || payload.kind !== watchKind) return;
        if (watchKind === 'user' && String(payload.userId) !== String(targetUserId)) return;
        if (watchKind === 'seller' && String(payload.sellerId) !== String(targetSellerId)) return;

        setIsPartnerOnline(Boolean(payload.isOnline));
        setPartnerLastActiveAt(payload.lastActiveAt || null);
      },
    );

    return () => {
      activeSocket?.off('connect', subscribePresence);
      unsubscribe();
    };
  }, [enabled, userId, sellerId, watchKind]);

  return {
    isPartnerOnline,
    partnerLastActiveAt,
  };
}
