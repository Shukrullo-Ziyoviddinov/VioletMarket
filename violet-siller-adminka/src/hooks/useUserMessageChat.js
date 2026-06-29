import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteSellerMessageChatMessage,
  editSellerMessageChatMessage,
  fetchSellerMessageThreadMessages,
  markSellerMessageThreadRead,
  sendSellerMessageChatMessage,
  uploadSellerMessageChatImage,
} from '../api/messageChatApi';
import { emitMessageChatSending } from '../socket/messageChatSocketClient';
import { mapMessageChatClientMessage, mapMessageChatSocketMessage } from '../socket/mapMessageChatSocketMessage';
import { SELLER_MESSAGE_CHAT_INCOMING_EVENT } from '../socket/useSellerMessageChatSocketHub';
import { useMessageSendState } from './useMessageSendState';
import { applyMessageChatReadUpdate } from '../utils/messageChatReadStatus';
import { MESSAGE_CHAT_SOCKET_EVENTS, subscribeMessageChatSocket } from '../socket/useMessageChatSocket';

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

export function useUserMessageChat({ token, userId, enabled = true }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isSending, beginSending, endSending } = useMessageSendState(messages, 'seller');
  const prevIsSendingRef = useRef(false);

  const notifyPartnerSending = useCallback(
    (sending) => {
      if (!userId) return;
      emitMessageChatSending({ userId, isSending: sending });
    },
    [userId],
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
    if (!token || !userId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSellerMessageThreadMessages(token, userId);
      const items = Array.isArray(data.items)
        ? data.items.map((row) => mapMessageChatClientMessage(row)).filter(Boolean)
        : [];
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

  useEffect(() => {
    if (!userId) return undefined;

    const handleIncoming = (event) => {
      const payload = event.detail;
      if (!payload || String(payload.userId) !== String(userId)) return;

      const uiMessage = mapMessageChatSocketMessage(payload.message);
      if (!uiMessage) return;

      setMessages((current) => appendUniqueMessage(current, uiMessage));

      if (uiMessage.sender === 'customer' && token) {
        markSellerMessageThreadRead(token, userId).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
    };

    window.addEventListener(SELLER_MESSAGE_CHAT_INCOMING_EVENT, handleIncoming);
    return () => window.removeEventListener(SELLER_MESSAGE_CHAT_INCOMING_EVENT, handleIncoming);
  }, [userId, token]);

  useEffect(() => {
    if (!enabled || !userId) return undefined;

    return subscribeMessageChatSocket(MESSAGE_CHAT_SOCKET_EVENTS.READ, (payload) => {
      if (!payload || String(payload.userId) !== String(userId)) return;
      setMessages((current) => applyMessageChatReadUpdate(current, payload));
    });
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !userId) return undefined;

    const unsubscribeDeleted = subscribeMessageChatSocket(
      MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_DELETED,
      (payload) => {
        if (!payload || String(payload.userId) !== String(userId)) return;
        setMessages((current) => current.filter((item) => item.id !== String(payload.messageId)));
        window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
      },
    );

    const unsubscribeUpdated = subscribeMessageChatSocket(
      MESSAGE_CHAT_SOCKET_EVENTS.MESSAGE_UPDATED,
      (payload) => {
        if (!payload || String(payload.userId) !== String(userId)) return;
        const uiMessage = mapMessageChatSocketMessage(payload.message);
        if (!uiMessage) return;
        setMessages((current) => replaceMessage(current, uiMessage));
        window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
      },
    );

    return () => {
      unsubscribeDeleted();
      unsubscribeUpdated();
    };
  }, [enabled, userId]);

  const sendMessage = useCallback(
    async (payload) => {
      if (!token || !userId || !beginSending(messages.length)) return null;

      try {
        const data = await sendSellerMessageChatMessage(token, userId, payload);
        const message = data.message ? mapMessageChatClientMessage(data.message) : null;
        if (message) {
          setMessages((current) => appendUniqueMessage(current, message));
          window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
        }
        return message;
      } catch {
        endSending();
        return null;
      }
    },
    [token, userId, messages.length, beginSending, endSending],
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
      if (!file || !token || !userId || !beginSending(messages.length)) return null;

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
        const message = data.message ? mapMessageChatClientMessage(data.message) : null;
        if (message) {
          setMessages((current) => appendUniqueMessage(current, message));
          window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
        }
        return message;
      } catch {
        endSending();
        return null;
      }
    },
    [token, userId, messages.length, beginSending, endSending],
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      if (!token || !userId || !messageId) return false;
      try {
        await deleteSellerMessageChatMessage(token, userId, messageId);
        setMessages((current) => current.filter((item) => item.id !== String(messageId)));
        window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
        return true;
      } catch {
        return false;
      }
    },
    [token, userId],
  );

  const editMessage = useCallback(
    async (messageId, text) => {
      if (!token || !userId || !messageId) return null;
      try {
        const data = await editSellerMessageChatMessage(token, userId, messageId, text);
        const message = data.message ? mapMessageChatClientMessage(data.message) : null;
        if (message) {
          setMessages((current) => replaceMessage(current, message));
          window.dispatchEvent(new CustomEvent('sellerMessageChatUpdated'));
        }
        return message;
      } catch {
        return null;
      }
    },
    [token, userId],
  );

  return {
    messages,
    loading,
    isSending,
    loadMessages,
    sendText,
    sendImage,
    deleteMessage,
    editMessage,
  };
}
