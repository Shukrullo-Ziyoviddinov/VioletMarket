import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, Spin } from 'antd';
import {
  PictureOutlined,
  SendOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import {
  fetchLogisticaChatMessages,
  markLogisticaChatRead,
  sendLogisticaChatImageMessage,
  sendLogisticaChatTextMessage,
} from '../../api/logisticaChatAdminApi';
import { useAdminToast } from '../../context/AdminToastContext';
import {
  connectLogisticaChatSocket,
  onLogisticaChatMessage,
  onLogisticaChatRead,
} from '../../socket/logisticaChatSocketClient';
import { fileToJpegBase64, resolveCourierImage } from '../../utils/courierImage';
import './LogisticaChatModal.css';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LogisticaChatModal({
  open = false,
  logistica = null,
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

  const logisticaId = logistica?.logisticaId || logistica?.id || '';
  const title =
    logistica?.companyName || logistica?.name || logistica?.email || 'Logistica';
  const subtitle =
    logistica?.countryLabel ||
    logistica?.logisticaCountry ||
    logistica?.email ||
    'Logistica bilan chat';

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
    if (!open || !logisticaId) return undefined;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const nextMessages = await fetchLogisticaChatMessages(logisticaId);
        if (cancelled) return;
        setMessages(nextMessages);
        await markLogisticaChatRead(logisticaId).catch(() => null);
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
    connectLogisticaChatSocket();
    const unsubscribe = onLogisticaChatMessage((payload) => {
      if (!payload?.message || payload.logisticaId !== logisticaId) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
      if (payload.message.sender === 'logistica') {
        markLogisticaChatRead(logisticaId).catch(() => null);
        onThreadsChanged?.();
      }
    });
    const unsubscribeRead = onLogisticaChatRead((payload) => {
      if (
        payload?.logisticaId !== logisticaId ||
        payload.readBy !== 'logistica'
      ) {
        return;
      }
      setMessages((prev) =>
        prev.map((message) =>
          message.sender === 'admin'
            ? { ...message, readByLogistica: true }
            : message,
        ),
      );
    });

    return () => {
      cancelled = true;
      unsubscribe();
      unsubscribeRead();
    };
  }, [open, logisticaId, onThreadsChanged, showToast]);

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
    if (!content || !logisticaId || sending) return;

    setSending(true);
    try {
      const message = await sendLogisticaChatTextMessage(logisticaId, content);
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
    if (!file || !logisticaId || sending) return;

    setSending(true);
    try {
      const imageBase64 = await fileToJpegBase64(file);
      const message = await sendLogisticaChatImageMessage(
        logisticaId,
        imageBase64,
      );
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

  if (!open || !logistica) return null;

  return createPortal(
    <div className="logistica-chat-modal" role="presentation">
      <button
        type="button"
        className="logistica-chat-modal__backdrop"
        aria-label="Yopish"
        onClick={onClose}
      />

      <div className="logistica-chat-modal__center">
        <div
          className="logistica-chat-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-label={`Chat: ${title}`}
        >
          <header className="logistica-chat-modal__header">
            <div className="logistica-chat-modal__header-main">
              <Avatar size={42} icon={<TruckOutlined />} />
              <div className="logistica-chat-modal__title-wrap">
                <h2 className="logistica-chat-modal__title">{title}</h2>
                <p className="logistica-chat-modal__subtitle">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              className="logistica-chat-modal__close"
              onClick={onClose}
              aria-label="Yopish"
            >
              ×
            </button>
          </header>

          <div className="logistica-chat-modal__messages">
            {loading ? (
              <div className="logistica-chat-modal__empty">
                <Spin />
              </div>
            ) : !messages.length ? (
              <p className="logistica-chat-modal__empty">
                Hali yozishma yo‘q. Birinchi xabarni yozing.
              </p>
            ) : (
              messages.map((message) => {
                const mine = message.sender === 'admin';
                return (
                  <div
                    key={message.id}
                    className={`logistica-chat-modal__bubble-row ${
                      mine
                        ? 'logistica-chat-modal__bubble-row--mine'
                        : 'logistica-chat-modal__bubble-row--theirs'
                    }`}
                  >
                    <div
                      className={`logistica-chat-modal__bubble ${
                        mine
                          ? 'logistica-chat-modal__bubble--mine'
                          : 'logistica-chat-modal__bubble--theirs'
                      }`}
                    >
                      {message.type === 'image' ? (
                        <img
                          className="logistica-chat-modal__bubble-image"
                          src={
                            resolveCourierImage(message.content) ||
                            message.content
                          }
                          alt="Chat rasmi"
                        />
                      ) : (
                        <p className="logistica-chat-modal__bubble-text">
                          {message.content}
                        </p>
                      )}
                      <span className="logistica-chat-modal__bubble-meta">
                        <span className="logistica-chat-modal__bubble-time">
                          {formatTime(message.createdAt)}
                        </span>
                        {mine ? (
                          <span
                            className={`logistica-chat-modal__read-mark${
                              message.readByLogistica
                                ? ' logistica-chat-modal__read-mark--done'
                                : ''
                            }`}
                            aria-label={
                              message.readByLogistica ? 'O‘qildi' : 'O‘qilmadi'
                            }
                          >
                            {message.readByLogistica ? '✓✓' : '✓'}
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

          <div className="logistica-chat-modal__composer">
            <button
              type="button"
              className="logistica-chat-modal__image-btn"
              disabled={sending}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Rasm yuborish"
            >
              <PictureOutlined />
            </button>
            <input
              ref={fileInputRef}
              className="logistica-chat-modal__file-input"
              type="file"
              accept="image/*"
              onChange={handlePickImage}
            />
            <textarea
              className="logistica-chat-modal__input"
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
              className="logistica-chat-modal__send-btn"
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
