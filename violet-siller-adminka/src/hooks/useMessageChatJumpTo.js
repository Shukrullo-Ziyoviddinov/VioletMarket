import { useCallback, useEffect, useRef, useState } from 'react';

const HIGHLIGHT_MS = 2000;

export function useMessageChatJumpTo() {
  const messageRefs = useRef(new Map());
  const highlightTimerRef = useRef(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  useEffect(() => {
    return () => clearTimeout(highlightTimerRef.current);
  }, []);

  const registerMessageRef = useCallback(
    (messageId) => (element) => {
      const id = String(messageId || '');
      if (!id) return;
      if (element) {
        messageRefs.current.set(id, element);
      } else {
        messageRefs.current.delete(id);
      }
    },
    [],
  );

  const jumpToMessage = useCallback((messageId) => {
    const id = String(messageId || '').trim();
    if (!id) return;

    const element = messageRefs.current.get(id);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(id);
    clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedMessageId(null), HIGHLIGHT_MS);
  }, []);

  return {
    highlightedMessageId,
    registerMessageRef,
    jumpToMessage,
  };
}
