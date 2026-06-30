import { useEffect, useState } from 'react';
import { MESSAGE_CHAT_SOCKET_EVENTS } from '../socket/messageChatSocketConfig';
import {
  emitMessageChatPresenceSubscribe,
  getMessageChatSocket,
} from '../socket/messageChatSocketClient';
import { subscribeMessageChatSocket } from '../socket/useMessageChatSocket';

export function useChatsListPresence(sellerIds = [], enabled = false) {
  const [presenceMap, setPresenceMap] = useState({});

  useEffect(() => {
    if (!enabled || sellerIds.length === 0) {
      setPresenceMap({});
      return undefined;
    }

    const ids = sellerIds.map(String);

    const subscribeAll = () => {
      ids.forEach((sellerId) => {
        emitMessageChatPresenceSubscribe({ watchKind: 'seller', sellerId });
      });
    };

    subscribeAll();

    const socket = getMessageChatSocket();
    socket?.on('connect', subscribeAll);

    const unsubscribe = subscribeMessageChatSocket(
      MESSAGE_CHAT_SOCKET_EVENTS.PRESENCE_UPDATE,
      (payload) => {
        if (!payload || payload.kind !== 'seller') return;
        const sellerId = String(payload.sellerId || '');
        if (!ids.includes(sellerId)) return;

        setPresenceMap((current) => ({
          ...current,
          [sellerId]: {
            isOnline: Boolean(payload.isOnline),
            lastActiveAt: payload.lastActiveAt || null,
          },
        }));
      },
    );

    return () => {
      socket?.off('connect', subscribeAll);
      unsubscribe();
    };
  }, [enabled, sellerIds.join('|')]);

  return presenceMap;
}
