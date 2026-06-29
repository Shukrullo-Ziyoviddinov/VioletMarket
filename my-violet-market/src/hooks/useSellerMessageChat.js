import { useCallback, useEffect, useState } from 'react';
import {
  fetchMessageChatThreadMessages,
  markMessageChatThreadRead,
  sendMessageChatMessage,
  uploadMessageChatImage,
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

  useEffect(() => {
    if (!enabled || !sellerId) return undefined;

    return subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE, (payload) => {
      if (!payload || payload.sellerId !== sellerId) return;

      const uiMessage = mapMessageChatSocketMessage(payload.message);
      if (!uiMessage) return;

      setMessages((current) => appendUniqueMessage(current, uiMessage));

      if (uiMessage.sender === 'seller' && authToken) {
        markMessageChatThreadRead(authToken, sellerId).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('messageChatUpdated'));
    });
  }, [enabled, sellerId, authToken]);

  const sendMessage = useCallback(
    async (payload) => {
      if (!authToken || !sellerId || sending) return null;

      setSending(true);
      try {
        const data = await sendMessageChatMessage(authToken, sellerId, payload);
        const message = data.message;
        if (message) {
          setMessages((current) => appendUniqueMessage(current, message));
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
