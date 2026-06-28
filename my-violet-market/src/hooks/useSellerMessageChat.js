import { useCallback, useEffect, useState } from 'react';
import {
  fetchMessageChatThreadMessages,
  markMessageChatThreadRead,
  sendMessageChatMessage,
  uploadMessageChatImage,
} from '../api/messageChatApi';

export function useSellerMessageChat({ authToken, sellerId, enabled = true }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!authToken || !sellerId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchMessageChatThreadMessages(authToken, sellerId);
      setMessages(Array.isArray(data.items) ? data.items : []);
      await markMessageChatThreadRead(authToken, sellerId);
      window.dispatchEvent(new CustomEvent('messageChatUpdated'));
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, sellerId]);

  useEffect(() => {
    if (!enabled || !authToken || !sellerId) return;
    loadMessages();
  }, [enabled, authToken, sellerId, loadMessages]);

  const sendMessage = useCallback(
    async (payload) => {
      if (!authToken || !sellerId || sending) return null;

      setSending(true);
      try {
        const data = await sendMessageChatMessage(authToken, sellerId, payload);
        const message = data.message;
        if (message) {
          setMessages((current) => [...current, message]);
          window.dispatchEvent(new CustomEvent('messageChatUpdated'));
        }
        return message;
      } finally {
        setSending(false);
      }
    },
    [authToken, sellerId, sending],
  );

  const sendText = useCallback(
    (text) => sendMessage({ type: 'text', content: text }),
    [sendMessage],
  );

  const sendImage = useCallback(
    async (file) => {
      if (!file) return null;
      const upload = await uploadMessageChatImage(authToken, file);
      const imagePath = upload?.data?.path;
      if (!imagePath) return null;
      return sendMessage({ type: 'image', content: imagePath });
    },
    [authToken, sendMessage],
  );

  const sendProduct = useCallback(
    (product) => sendMessage({ type: 'product', content: product }),
    [sendMessage],
  );

  return {
    messages,
    loading,
    sending,
    loadMessages,
    sendText,
    sendImage,
    sendProduct,
  };
}
