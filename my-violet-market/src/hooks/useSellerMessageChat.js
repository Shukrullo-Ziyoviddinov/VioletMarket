import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteMessageChatMessage,
  editMessageChatMessage,
  fetchMessageChatThreadMessages,
  markMessageChatThreadRead,
  sendMessageChatMessage,
  uploadMessageChatImage,
} from '../api/messageChatApi';
import { emitMessageChatSending } from '../socket/messageChatSocketClient';
import { mapMessageChatSocketMessage } from '../socket/mapMessageChatSocketMessage';
import {
  MESSAGE_CHAT_SOCKET_EVENTS,
  subscribeMessageChatSocket,
} from '../socket/useMessageChatSocket';
import { useMessageSendState } from './useMessageSendState';
import { applyMessageChatReadUpdate } from '../utils/messageChatReadStatus';

function appendUniqueMessage(current, message) {
  if (!message || current.some((item) => item.id === message.id)) {
    return current;
  }
  return [...current, message];
}

function replaceMessage(current, message) {
  if (!message) return current;
  return current.map((item) => (item.id === message.id ? message : item));
}

export function useSellerMessageChat({ authToken, sellerId, enabled = true }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isSending, beginSending, endSending } = useMessageSendState(messages, 'customer');
  const prevIsSendingRef = useRef(false);

  const notifyPartnerSending = useCallback(
    (sending) => {
      if (!sellerId) return;
      emitMessageChatSending({ sellerId, isSending: sending });
    },
    [sellerId],
  );

  useEffect(() => {
    if (isSending && !prevIsSendingRef.current) {
      notifyPartnerSending(true);
    } else if (!isSending && prevIsSendingRef.current) {
      notifyPartnerSending(false);
    }
    prevIsSendingRef.current = isSending;
  }, [isSending, notifyPartnerSending]);

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

      if (uiMessage.sender === 'seller' && authToken) {
        markMessageChatThreadRead(authToken, sellerId).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('messageChatUpdated'));
    });
  }, [enabled, sellerId, authToken]);

  useEffect(() => {
    if (!enabled || !sellerId) return undefined;

    return subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.READ, (payload) => {
      if (!payload || String(payload.sellerId) !== String(sellerId)) return;
      setMessages((current) => applyMessageChatReadUpdate(current, payload));
    });
  }, [enabled, sellerId]);

  useEffect(() => {
    if (!enabled || !sellerId) return undefined;

    const unsubscribeDeleted = subscribeMessageChatSocket(
      MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_DELETED,
      (payload) => {
        if (!payload || String(payload.sellerId) !== String(sellerId)) return;
        setMessages((current) => current.filter((item) => item.id !== String(payload.messageId)));
        window.dispatchEvent(new CustomEvent('messageChatUpdated'));
      },
    );

    const unsubscribeUpdated = subscribeMessageChatSocket(
      MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_UPDATED,
      (payload) => {
        if (!payload || String(payload.sellerId) !== String(sellerId)) return;
        const uiMessage = mapMessageChatSocketMessage(payload.message);
        if (!uiMessage) return;
        setMessages((current) => replaceMessage(current, uiMessage));
        window.dispatchEvent(new CustomEvent('messageChatUpdated'));
      },
    );

    return () => {
      unsubscribeDeleted();
      unsubscribeUpdated();
    };
  }, [enabled, sellerId]);

  const sendMessage = useCallback(
    async (payload) => {
      if (!authToken || !sellerId || !beginSending(messages.length)) return null;

      try {
        const data = await sendMessageChatMessage(authToken, sellerId, payload);
        const message = data.message ? mapMessageChatSocketMessage(data.message) : null;
        if (message) {
          setMessages((current) => appendUniqueMessage(current, message));
          window.dispatchEvent(new CustomEvent('messageChatUpdated'));
        }
        return message;
      } catch {
        endSending();
        return null;
      }
    },
    [authToken, sellerId, messages.length, beginSending, endSending],
  );

  const sendText = useCallback(
    (text, replyTo = null) => {
      const payload = { type: 'text', content: text };
      if (replyTo) payload.replyTo = replyTo;
      return sendMessage(payload);
    },
    [sendMessage],
  );

  const sendImage = useCallback(
    async (file) => {
      if (!file || !authToken || !sellerId || !beginSending(messages.length)) return null;

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
        const message = data.message ? mapMessageChatSocketMessage(data.message) : null;
        if (message) {
          setMessages((current) => appendUniqueMessage(current, message));
          window.dispatchEvent(new CustomEvent('messageChatUpdated'));
        }
        return message;
      } catch {
        endSending();
        return null;
      }
    },
    [authToken, sellerId, messages.length, beginSending, endSending],
  );

  const sendProduct = useCallback(
    (product) => sendMessage({ type: 'product', content: product }),
    [sendMessage],
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      if (!authToken || !sellerId || !messageId) return false;
      try {
        await deleteMessageChatMessage(authToken, sellerId, messageId);
        setMessages((current) => current.filter((item) => item.id !== String(messageId)));
        window.dispatchEvent(new CustomEvent('messageChatUpdated'));
        return true;
      } catch {
        return false;
      }
    },
    [authToken, sellerId],
  );

  const editMessage = useCallback(
    async (messageId, text) => {
      if (!authToken || !sellerId || !messageId) return null;
      try {
        const data = await editMessageChatMessage(authToken, sellerId, messageId, text);
        const message = data.message ? mapMessageChatSocketMessage(data.message) : null;
        if (message) {
          setMessages((current) => replaceMessage(current, message));
          window.dispatchEvent(new CustomEvent('messageChatUpdated'));
        }
        return message;
      } catch {
        return null;
      }
    },
    [authToken, sellerId],
  );

  return {
    messages,
    loading,
    isSending,
    loadMessages,
    sendText,
    sendImage,
    sendProduct,
    deleteMessage,
    editMessage,
  };
}
