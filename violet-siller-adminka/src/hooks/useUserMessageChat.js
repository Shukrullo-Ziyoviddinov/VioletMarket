import { useCallback, useEffect, useState } from 'react';
import {
  fetchSellerMessageThreadMessages,
  markSellerMessageThreadRead,
  sendSellerMessageChatMessage,
  uploadSellerMessageChatImage,
} from '../api/messageChatApi';
import { mapMessageChatSocketMessage } from '../socket/mapMessageChatSocketMessage';
import {
  MESSAGE_CHAT_SOCKET_EVENTS,
  subscribeMessageChatSocket,
} from '../socket/useMessageChatSocket';

function appendUniqueMessage(current, message) {
  if (!message || current.some((item) => item.id === message.id)) {
    return current;
  }
  return [...current, message];
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
      const items = Array.isArray(data.items)
        ? data.items.map((row) => mapMessageChatSocketMessage({ ...row, sender: row.sender }))
        : [];
      setMessages(items.filter(Boolean));
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

  useEffect(() => {
    if (!enabled || !userId) return undefined;

    return subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, (payload) => {
      if (!payload || payload.userId !== userId) return;

      const uiMessage = mapMessageChatSocketMessage(payload.message);
      if (!uiMessage) return;

      setMessages((current) => appendUniqueMessage(current, uiMessage));

      if (uiMessage.sender === 'customer' && token) {
        markSellerMessageThreadRead(token, userId).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
    });
  }, [enabled, userId, token]);

  const sendMessage = useCallback(
    async (payload) => {
      if (!token || !userId || sending) return null;

      setSending(true);
      try {
        const data = await sendSellerMessageChatMessage(token, userId, payload);
        const message = data.message ? mapMessageChatSocketMessage(data.message) : null;
        if (message) {
          setMessages((current) => appendUniqueMessage(current, message));
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
