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
import { useMessageSendState } from './useMessageSendState';

function appendUniqueMessage(current, message) {
  if (!message || current.some((item) => item.id === message.id)) {
    return current;
  }
  return [...current, message];
}

export function useSellerMessageChat({ authToken, sellerId, enabled = true }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isSending, beginSending, endSending } = useMessageSendState();

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
      if (!payload || String(payload.sellerId) !== String(sellerId)) return;

      const uiMessage = mapMessageChatSocketMessage(payload.message);
      if (!uiMessage) return;

      setMessages((current) => appendUniqueMessage(current, uiMessage));

      if (uiMessage.sender === 'customer') {
        endSending();
      }

      if (uiMessage.sender === 'seller' && authToken) {
        markMessageChatThreadRead(authToken, sellerId).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('messageChatUpdated'));
    });
  }, [enabled, sellerId, authToken, endSending]);

  const sendMessage = useCallback(
    async (payload) => {
      if (!authToken || !sellerId || !beginSending()) return null;

      try {
        const data = await sendMessageChatMessage(authToken, sellerId, payload);
        const message = data.message;
        if (message) {
          setMessages((current) => appendUniqueMessage(current, message));
          window.dispatchEvent(new CustomEvent('messageChatUpdated'));
          endSending();
        }
        return message;
      } catch {
        endSending();
        return null;
      }
    },
    [authToken, sellerId, beginSending, endSending],
  );

  const sendText = useCallback(
    (text) => sendMessage({ type: 'text', content: text }),
    [sendMessage],
  );

  const sendImage = useCallback(
    async (file) => {
      if (!file || !authToken || !sellerId || !beginSending()) return null;

      try {
        const upload = await uploadMessageChatImage(authToken, file);
        const imagePath = upload?.data?.path;
        if (!imagePath) {
          endSending();
          return null;
        }

        const data = await sendMessageChatMessage(authToken, sellerId, {
          type: 'image',
          content: imagePath,
        });
        const message = data.message;
        if (message) {
          setMessages((current) => appendUniqueMessage(current, message));
          window.dispatchEvent(new CustomEvent('messageChatUpdated'));
          endSending();
        }
        return message;
      } catch {
        endSending();
        return null;
      }
    },
    [authToken, sellerId, beginSending, endSending],
  );

  const sendProduct = useCallback(
    (product) => sendMessage({ type: 'product', content: product }),
    [sendMessage],
  );

  return {
    messages,
    loading,
    isSending,
    loadMessages,
    sendText,
    sendImage,
    sendProduct,
  };
}
