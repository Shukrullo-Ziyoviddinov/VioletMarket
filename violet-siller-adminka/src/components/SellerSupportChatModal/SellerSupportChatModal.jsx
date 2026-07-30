import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, Spin, message as antdMessage } from 'antd';
import {
  CustomerServiceOutlined,
  PictureOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  fetchSellerSupportChatMessages,
  markSellerSupportChatRead,
  sendSellerSupportChatImageMessage,
  sendSellerSupportChatTextMessage,
} from '../../api/sellerSupportChatApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import {
  emitSellerSupportChatUpdated,
  onSellerSupportChatMessage,
  onSellerSupportChatRead,
} from '../../socket/sellerSupportChatSocketClient';
import {
  fileToJpegBase64,
  resolveSupportChatImage,
} from '../../utils/supportChatImage';
import './SellerSupportChatModal.css';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SellerSupportChatModal({
  open = false,
  onClose,
}) {
  const { token } = useSellerAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

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
    if (!open || !token) return undefined;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const nextMessages = await fetchSellerSupportChatMessages(token);
        if (cancelled) return;
        setMessages(nextMessages);
        await markSellerSupportChatRead(token).catch(() => null);
        emitSellerSupportChatUpdated();
      } catch (err) {
        if (!cancelled) {
          antdMessage.error(err.message || 'Chat yuklanmadi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const unsubscribe = onSellerSupportChatMessage(token, (payload) => {
      if (!payload?.message) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
      if (payload.message.sender === 'admin') {
        markSellerSupportChatRead(token).catch(() => null);
        emitSellerSupportChatUpdated();
      }
    });
    const unsubscribeRead = onSellerSupportChatRead(token, (payload) => {
      if (payload?.readBy !== 'admin') return;
      setMessages((prev) =>
        prev.map((message) =>
          message.sender === 'seller'
            ? { ...message, readByAdmin: true }
            : message,
        ),
      );
    });

    return () => {
      cancelled = true;
      unsubscribe();
      unsubscribeRead();
    };
  }, [open, token]);

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
    emitSellerSupportChatUpdated();
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !token || sending) return;

    setSending(true);
    try {
      const message = await sendSellerSupportChatTextMessage(token, content);
      setDraft('');
      appendMessage(message);
    } catch (err) {
      antdMessage.error(err.message || 'Xabar yuborilmadi');
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !token || sending) return;

    setSending(true);
    try {
      const imageBase64 = await fileToJpegBase64(file);
      const message = await sendSellerSupportChatImageMessage(token, imageBase64);
      appendMessage(message);
    } catch (err) {
      antdMessage.error(err.message || 'Rasm yuborilmadi');
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="seller-support-chat-modal" role="presentation">
      <button
        type="button"
        className="seller-support-chat-modal__backdrop"
        aria-label="Yopish"
        onClick={onClose}
      />

      <div className="seller-support-chat-modal__center">
        <div
          className="seller-support-chat-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Yordam"
        >
          <header className="seller-support-chat-modal__header">
            <div className="seller-support-chat-modal__header-main">
              <Avatar size={42} icon={<CustomerServiceOutlined />} />
              <div className="seller-support-chat-modal__title-wrap">
                <h2 className="seller-support-chat-modal__title">Yordam</h2>
                <p className="seller-support-chat-modal__subtitle">
                  Asosiy admin bilan bog‘lanish
                </p>
              </div>
            </div>
            <button
              type="button"
              className="seller-support-chat-modal__close"
              onClick={onClose}
              aria-label="Yopish"
            >
              ×
            </button>
          </header>

          <div className="seller-support-chat-modal__messages">
            {loading ? (
              <div className="seller-support-chat-modal__empty">
                <Spin />
              </div>
            ) : !messages.length ? (
              <p className="seller-support-chat-modal__empty">
                Hali yozishma yo‘q. Yordam xizmatiga birinchi xabarni yozing.
              </p>
            ) : (
              messages.map((message) => {
                const mine = message.sender === 'seller';
                return (
                  <div
                    key={message.id}
                    className={`seller-support-chat-modal__bubble-row ${
                      mine
                        ? 'seller-support-chat-modal__bubble-row--mine'
                        : 'seller-support-chat-modal__bubble-row--theirs'
                    }`}
                  >
                    <div
                      className={`seller-support-chat-modal__bubble ${
                        mine
                          ? 'seller-support-chat-modal__bubble--mine'
                          : 'seller-support-chat-modal__bubble--theirs'
                      }`}
                    >
                      {message.type === 'image' ? (
                        <img
                          className="seller-support-chat-modal__bubble-image"
                          src={
                            resolveSupportChatImage(message.content) ||
                            message.content
                          }
                          alt="Chat rasmi"
                        />
                      ) : (
                        <p className="seller-support-chat-modal__bubble-text">
                          {message.content}
                        </p>
                      )}
                      <span className="seller-support-chat-modal__bubble-meta">
                        <span className="seller-support-chat-modal__bubble-time">
                          {formatTime(message.createdAt)}
                        </span>
                        {mine ? (
                          <span
                            className={`seller-support-chat-modal__read-mark${
                              message.readByAdmin
                                ? ' seller-support-chat-modal__read-mark--done'
                                : ''
                            }`}
                            aria-label={
                              message.readByAdmin ? 'O‘qildi' : 'O‘qilmadi'
                            }
                          >
                            {message.readByAdmin ? '✓✓' : '✓'}
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

          <div className="seller-support-chat-modal__composer">
            <button
              type="button"
              className="seller-support-chat-modal__image-btn"
              disabled={sending}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Rasm yuborish"
            >
              <PictureOutlined />
            </button>
            <input
              ref={fileInputRef}
              className="seller-support-chat-modal__file-input"
              type="file"
              accept="image/*"
              onChange={handlePickImage}
            />
            <textarea
              className="seller-support-chat-modal__input"
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
              className="seller-support-chat-modal__send-btn"
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
