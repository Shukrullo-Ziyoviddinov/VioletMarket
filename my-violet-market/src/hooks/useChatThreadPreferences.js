import { useCallback, useEffect, useState } from 'react';
import {
  getChatThreadPreferences,
  saveChatThreadPreferences,
} from '../utils/chatsThreadUtils';

export function useChatThreadPreferences() {
  const [preferences, setPreferences] = useState(() => getChatThreadPreferences());

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key && event.key !== 'messageChatThreadPreferences') return;
      setPreferences(getChatThreadPreferences());
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updatePreference = useCallback((sellerId, patch) => {
    const id = String(sellerId);
    setPreferences((current) => {
      const next = {
        ...current,
        [id]: {
          ...(current[id] || {}),
          ...patch,
        },
      };
      saveChatThreadPreferences(next);
      return next;
    });
  }, []);

  const togglePin = useCallback(
    (sellerId) => {
      const id = String(sellerId);
      setPreferences((current) => {
        const pinned = !current[id]?.pinned;
        const next = {
          ...current,
          [id]: {
            ...(current[id] || {}),
            pinned,
            pinnedAt: pinned ? Date.now() : null,
          },
        };
        saveChatThreadPreferences(next);
        return next;
      });
    },
    [],
  );

  const toggleMute = useCallback((sellerId) => {
    const id = String(sellerId);
    setPreferences((current) => {
      const next = {
        ...current,
        [id]: {
          ...(current[id] || {}),
          muted: !current[id]?.muted,
        },
      };
      saveChatThreadPreferences(next);
      return next;
    });
  }, []);

  const archiveThread = useCallback((sellerId) => {
    updatePreference(sellerId, { archived: true });
  }, [updatePreference]);

  const unarchiveThread = useCallback((sellerId) => {
    updatePreference(sellerId, { archived: false });
  }, [updatePreference]);

  return {
    preferences,
    togglePin,
    toggleMute,
    archiveThread,
    unarchiveThread,
    updatePreference,
  };
}
