import { useCallback, useEffect, useState } from 'react';
import {
  fetchSellerMessageThreadMessages,
  markSellerMessageThreadRead,
  sendSellerMessageChatMessage,
  uploadSellerMessageChatImage,
} from '../api/messageChatApi';

function mapMessageForUi(row) {
  return {
    id: row.id,
    sender: row.sender === 'seller' ? 'seller' : 'customer',
    type: row.type,
    content: row.content,
    createdAt: row.createdAt,
  };
}

export function useUserMessageChat({ token, userId, enabled = true }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!token || !userId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSellerMessageThreadMessages(token, userId);
      const items = Array.isArray(data.items) ? data.items.map(mapMessageForUi) : [];
      setMessages(items);
      await markSellerMessageThreadRead(token, userId);
      window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    if (!enabled || !token || !userId) return;
    loadMessages();
  }, [enabled, token, userId, loadMessages]);

  const sendMessage = useCallback(
    async (payload) => {
      if (!token || !userId || sending) return null;

      setSending(true);
      try {
        const data = await sendSellerMessageChatMessage(token, userId, payload);
        const message = data.message ? mapMessageForUi(data.message) : null;
        if (message) {
          setMessages((current) => [...current, message]);
          window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
        }
        return message;
      } finally {
        setSending(false);
      }
    },
    [token, userId, sending],
  );

  const sendText = useCallback(
    (text) => sendMessage({ type: 'text', content: text }),
    [sendMessage],
  );

  const sendImage = useCallback(
    async (file) => {
      if (!file) return null;
      const upload = await uploadSellerMessageChatImage(token, file);
      const imagePath = upload?.path;
      if (!imagePath) return null;
      return sendMessage({ type: 'image', content: imagePath });
    },
    [token, sendMessage],
  );

  return {
    messages,
    loading,
    sending,
    loadMessages,
    sendText,
    sendImage,
  };
}
