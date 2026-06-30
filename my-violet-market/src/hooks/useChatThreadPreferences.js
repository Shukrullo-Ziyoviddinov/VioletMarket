import { useCallback } from 'react';
import { updateMessageChatThreadPreferences } from '../api/messageChatApi';

export function useChatThreadPreferences(authToken, { onUpdated } = {}) {
  const runUpdate = useCallback(
    async (sellerId, patch) => {
      if (!authToken) return false;
      try {
        await updateMessageChatThreadPreferences(authToken, sellerId, patch);
        onUpdated?.();
        window.dispatchEvent(new CustomEvent('messageChatUpdated'));
        return true;
      } catch {
        return false;
      }
    },
    [authToken, onUpdated],
  );

  const togglePin = useCallback(
    (thread) => {
      const pinned = Boolean(thread?.pinned);
      return runUpdate(thread.sellerId, { pinned: !pinned });
    },
    [runUpdate],
  );

  const toggleMute = useCallback(
    (thread) => {
      const muted = Boolean(thread?.muted);
      return runUpdate(thread.sellerId, { muted: !muted });
    },
    [runUpdate],
  );

  const archiveThread = useCallback(
    (thread) => runUpdate(thread.sellerId, { archived: true }),
    [runUpdate],
  );

  const unarchiveThread = useCallback(
    (thread) => runUpdate(thread.sellerId, { archived: false }),
    [runUpdate],
  );

  return {
    togglePin,
    toggleMute,
    archiveThread,
    unarchiveThread,
  };
}
