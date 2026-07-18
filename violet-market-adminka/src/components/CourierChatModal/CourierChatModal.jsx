import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, Spin } from 'antd';
import {
  PictureOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  fetchCourierChatMessages,
  markCourierChatRead,
  sendCourierChatImageMessage,
  sendCourierChatTextMessage,
} from '../../api/courierChatAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import {
  connectCourierChatSocket,
  onCourierChatMessage,
  onCourierChatRead,
} from '../../socket/courierChatSocketClient';
import { fileToJpegBase64, resolveCourierImage } from '../../utils/courierImage';
import './CourierChatModal.css';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CourierChatModal({
  open = false,
  courier = null,
  onClose,
  onThreadsChanged,
}) {
  const { showToast } = useAdminToast();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const deliveryId = courier?.deliveryId || courier?.id || '';
  const fullName =
    `${courier?.firstName || ''} ${courier?.lastName || ''}`.trim() ||
    courier?.email ||
    'Kuryer';

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !deliveryId) return undefined;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const nextMessages = await fetchCourierChatMessages(deliveryId);
        if (cancelled) return;
        setMessages(nextMessages);
        await markCourierChatRead(deliveryId).catch(() => null);
        onThreadsChanged?.();
      } catch (err) {
        if (!cancelled) {
          showToast({
            type: 'error',
            message: err.message || 'Chat yuklanmadi',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    connectCourierChatSocket();
    const unsubscribe = onCourierChatMessage((payload) => {
      if (!payload?.message || payload.deliveryId !== deliveryId) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
      if (payload.message.sender === 'courier') {
        markCourierChatRead(deliveryId).catch(() => null);
        onThreadsChanged?.();
      }
    });
    const unsubscribeRead = onCourierChatRead((payload) => {
      if (payload?.deliveryId !== deliveryId || payload.readBy !== 'courier') {
        return;
      }
      setMessages((prev) =>
        prev.map((message) =>
          message.sender === 'admin'
            ? { ...message, readByCourier: true }
            : message,
        ),
      );
    });

    return () => {
      cancelled = true;
      unsubscribe();
      unsubscribeRead();
    };
  }, [open, deliveryId, onThreadsChanged, showToast]);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  const appendMessage = (message) => {
    if (!message) return;
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev;
      return [...prev, message];
    });
    onThreadsChanged?.();
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !deliveryId || sending) return;

    setSending(true);
    try {
      const message = await sendCourierChatTextMessage(deliveryId, content);
      setDraft('');
      appendMessage(message);
    } catch (err) {
      showToast({
        type: 'error',
        message: err.message || 'Xabar yuborilmadi',
      });
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !deliveryId || sending) return;

    setSending(true);
    try {
      const imageBase64 = await fileToJpegBase64(file);
      const message = await sendCourierChatImageMessage(deliveryId, imageBase64);
      appendMessage(message);
    } catch (err) {
      showToast({
        type: 'error',
        message: err.message || 'Rasm yuborilmadi',
      });
    } finally {
      setSending(false);
    }
  };

  if (!open || !courier) return null;

  return createPortal(
    <div className="courier-chat-modal" role="presentation">
      <button
        type="button"
        className="courier-chat-modal__backdrop"
        aria-label="Yopish"
        onClick={onClose}
      />

      <div className="courier-chat-modal__center">
        <div
          className="courier-chat-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-label={`Chat: ${fullName}`}
        >
          <header className="courier-chat-modal__header">
            <div className="courier-chat-modal__header-main">
              <Avatar
                size={42}
                src={resolveCourierImage(courier.profileImage) || undefined}
                icon={<UserOutlined />}
              />
              <div className="courier-chat-modal__title-wrap">
                <h2 className="courier-chat-modal__title">{fullName}</h2>
                <p className="courier-chat-modal__subtitle">
                  {courier.phone || courier.email || 'Kuryer bilan chat'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="courier-chat-modal__close"
              onClick={onClose}
              aria-label="Yopish"
            >
              ×
            </button>
          </header>

          <div className="courier-chat-modal__messages">
            {loading ? (
              <div className="courier-chat-modal__empty">
                <Spin />
              </div>
            ) : !messages.length ? (
              <p className="courier-chat-modal__empty">
                Hali yozishma yo‘q. Birinchi xabarni yozing.
              </p>
            ) : (
              messages.map((message) => {
                const mine = message.sender === 'admin';
                return (
                  <div
                    key={message.id}
                    className={`courier-chat-modal__bubble-row ${
                      mine
                        ? 'courier-chat-modal__bubble-row--mine'
                        : 'courier-chat-modal__bubble-row--theirs'
                    }`}
                  >
                    <div
                      className={`courier-chat-modal__bubble ${
                        mine
                          ? 'courier-chat-modal__bubble--mine'
                          : 'courier-chat-modal__bubble--theirs'
                      }`}
                    >
                      {message.type === 'image' ? (
                        <img
                          className="courier-chat-modal__bubble-image"
                          src={resolveCourierImage(message.content) || message.content}
                          alt="Chat rasmi"
                        />
                      ) : (
                        <p className="courier-chat-modal__bubble-text">
                          {message.content}
                        </p>
                      )}
                      <span className="courier-chat-modal__bubble-meta">
                        <span className="courier-chat-modal__bubble-time">
                          {formatTime(message.createdAt)}
                        </span>
                        {mine ? (
                          <span
                            className={`courier-chat-modal__read-mark${
                              message.readByCourier
                                ? ' courier-chat-modal__read-mark--done'
                                : ''
                            }`}
                            aria-label={
                              message.readByCourier ? 'O‘qildi' : 'O‘qilmadi'
                            }
                          >
                            {message.readByCourier ? '✓✓' : '✓'}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="courier-chat-modal__composer">
            <button
              type="button"
              className="courier-chat-modal__image-btn"
              disabled={sending}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Rasm yuborish"
            >
              <PictureOutlined />
            </button>
            <input
              ref={fileInputRef}
              className="courier-chat-modal__file-input"
              type="file"
              accept="image/*"
              onChange={handlePickImage}
            />
            <textarea
              className="courier-chat-modal__input"
              rows={1}
              value={draft}
              disabled={sending}
              placeholder="Xabar yozing..."
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              className="courier-chat-modal__send-btn"
              disabled={sending || !draft.trim()}
              onClick={handleSend}
              aria-label="Yuborish"
            >
              <SendOutlined />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
