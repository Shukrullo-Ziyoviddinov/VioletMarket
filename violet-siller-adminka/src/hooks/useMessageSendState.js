import { useRef, useState, useCallback, useEffect } from 'react';

export function useMessageSendState(messages, ownSender) {
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const baselineRef = useRef(0);

  const beginSending = useCallback((messageCount = 0) => {
    if (sendingRef.current) return false;
    sendingRef.current = true;
    baselineRef.current = messageCount;
    setIsSending(true);
    return true;
  }, []);

  const endSending = useCallback(() => {
    sendingRef.current = false;
    setIsSending(false);
  }, []);

  useEffect(() => {
    if (!isSending) return;

    const baseline = baselineRef.current;
    if (messages.length <= baseline) return;

    const added = messages.slice(baseline);
    if (added.some((message) => message?.sender === ownSender)) {
      endSending();
    }
  }, [messages, isSending, ownSender, endSending]);

  return {
    isSending,
    beginSending,
    endSending,
    isSendingRef: sendingRef,
  };
}
