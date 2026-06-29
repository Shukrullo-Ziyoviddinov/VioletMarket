import { useRef, useState, useCallback } from 'react';

export function useMessageSendState() {
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  const beginSending = useCallback(() => {
    if (sendingRef.current) return false;
    sendingRef.current = true;
    setIsSending(true);
    return true;
  }, []);

  const endSending = useCallback(() => {
    sendingRef.current = false;
    setIsSending(false);
  }, []);

  return {
    isSending,
    beginSending,
    endSending,
    isSendingRef: sendingRef,
  };
}
