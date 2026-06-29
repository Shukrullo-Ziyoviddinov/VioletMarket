import { useCallback, useEffect, useState } from 'react';
import {
  fetchSellerMessageThreadMessages,
  markSellerMessageThreadRead,
  sendSellerMessageChatMessage,
  uploadSellerMessageChatImage,
} from '../api/messageChatApi';
import { mapMessageChatSocketMessage } from '../socket/mapMessageChatSocketMessage';
import { SELLER_MESSAGE_CHAT_INCOMING_EVENT } from '../socket/useSellerMessageChatSocketHub';
import { useMessageSendState } from './useMessageSendState';

function appendUniqueMessage(current, message) {
  if (!message || current.some((item) => item.id === message.id)) {
    return current;
  }
  return [...current, message];
}

export function useUserMessageChat({ token, userId, enabled = true }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isSending, beginSending, endSending } = useMessageSendState();

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
    if (!userId) return undefined;

    const handleIncoming = (event) => {
      const payload = event.detail;
      if (!payload || String(payload.userId) !== String(userId)) return;

      const uiMessage = mapMessageChatSocketMessage(payload.message);
      if (!uiMessage) return;

      setMessages((current) => appendUniqueMessage(current, uiMessage));

      if (uiMessage.sender === 'seller') {
        endSending();
      }

      if (uiMessage.sender === 'customer' && token) {
        markSellerMessageThreadRead(token, userId).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
    };

    window.addEventListener(SELLER_MESSAGE_CHAT_INCOMING_EVENT, handleIncoming);
    return () => window.removeEventListener(SELLER_MESSAGE_CHAT_INCOMING_EVENT, handleIncoming);
  }, [userId, token, endSending]);

  const sendMessage = useCallback(
    async (payload) => {
      if (!token || !userId || !beginSending()) return null;

      try {
        const data = await sendSellerMessageChatMessage(token, userId, payload);
        const message = data.message ? mapMessageChatSocketMessage(data.message) : null;
        if (message) {
          setMessages((current) => appendUniqueMessage(current, message));
          window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
          endSending();
        }
        return message;
      } catch {
        endSending();
        return null;
      }
    },
    [token, userId, beginSending, endSending],
  );

  const sendText = useCallback(
    (text) => sendMessage({ type: 'text', content: text }),
    [sendMessage],
  );

  const sendImage = useCallback(
    async (file) => {
      if (!file || !token || !userId || !beginSending()) return null;

      try {
        const upload = await uploadSellerMessageChatImage(token, file);
        const imagePath = upload?.path;
        if (!imagePath) {
          endSending();
          return null;
        }

        const data = await sendSellerMessageChatMessage(token, userId, {
          type: 'image',
          content: imagePath,
        });
        const message = data.message ? mapMessageChatSocketMessage(data.message) : null;
        if (message) {
          setMessages((current) => appendUniqueMessage(current, message));
          window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
          endSending();
        }
        return message;
      } catch {
        endSending();
        return null;
      }
    },
    [token, userId, beginSending, endSending],
  );

  return {
    messages,
    loading,
    isSending,
    loadMessages,
    sendText,
    sendImage,
  };
}
