import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_USER_AVATAR, resolveUserProfileImage } from '../../utils/mediaUrl';
import { buildReplyToPayload } from '../../utils/messageChatReplyUtils';
import MessageChatPartnerStatus from '../MessageChatPartnerStatus';
import MessageChatActionsModal from './MessageChatActionsModal';
import MessageChatReplyBar from './MessageChatReplyBar/MessageChatReplyBar';
import SellerUserChatMessageBubble from './SellerUserChatMessageBubble/SellerUserChatMessageBubble';
import SellerUserChatProductMessage from './SellerUserChatProductMessage/SellerUserChatProductMessage';
import './SellerUserChatModal.css';
import './SellerUserChatParts.css';

function SellerUserChatHeader({
  user,
  onBack,
  isPartnerTyping = false,
  isPartnerSending = false,
  isPartnerOnline = false,
  partnerLastActiveAt = null,
}) {
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Foydalanuvchi';
  const avatarSrc = resolveUserProfileImage(user?.profileImage);

  return (
    <header className="seller-user-chat-header">
      <button type="button" className="seller-user-chat-header__back" onClick={onBack} aria-label="Orqaga">
        <i className="bx bx-chevron-left" aria-hidden="true" />
      </button>
      <div className="seller-user-chat-header__profile">
        <img
          src={avatarSrc}
          alt=""
          className="seller-user-chat-header__avatar"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = DEFAULT_USER_AVATAR;
          }}
        />
        <div className="seller-user-chat-header__profile-text">
          <h2 className="seller-user-chat-header__name">{displayName}</h2>
          <MessageChatPartnerStatus
            isPartnerTyping={isPartnerTyping}
            isPartnerSending={isPartnerSending}
            isPartnerOnline={isPartnerOnline}
            partnerLastActiveAt={partnerLastActiveAt}
          />
        </div>
      </div>
    </header>
  );
}

function SellerUserChatMessageList({ messages, onMessagePress }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="seller-user-chat-message-list">
      {messages.length === 0 ? (
        <p className="seller-user-chat-message-list__empty">Hozircha xabar yo&apos;q.</p>
      ) : (
        messages.map((message) => {
          if (message?.type === 'product') {
            return (
              <SellerUserChatProductMessage
                key={message.id}
                product={message.content}
                message={message}
                isSeller={message.sender === 'seller'}
                onPress={onMessagePress}
              />
            );
          }
          return <SellerUserChatMessageBubble key={message.id} message={message} onPress={onMessagePress} />;
        })
      )}
      <div ref={endRef} className="seller-user-chat-message-list__anchor" />
    </div>
  );
}

const EMOJI_OPTIONS = ['😀', '😂', '😊', '😍', '🥰', '😉', '🙏', '👍', '👋', '🔥', '✅', '❤️'];

function SellerUserChatComposer({
  onSendText,
  onSendImage,
  onComposerActivity,
  onStopTyping,
  isSending = false,
  text = '',
  onTextChange,
  editingMessage = null,
  replyTarget = null,
  onCancelComposerMode,
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const isEditMode = Boolean(editingMessage);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [text, adjustTextareaHeight]);

  useEffect(() => {
    if (!editingMessage) return;
    textareaRef.current?.focus();
    adjustTextareaHeight();
  }, [editingMessage, adjustTextareaHeight]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onStopTyping?.();
    onSendText?.(trimmed);
    setEmojiOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/') || isSending) return;
    onSendImage?.(file);
    setEmojiOpen(false);
  };

  return (
    <div className="seller-user-chat-composer-wrap">
      {replyTarget ? <MessageChatReplyBar message={replyTarget} onCancel={onCancelComposerMode} /> : null}
      <div className="seller-user-chat-composer">
      {emojiOpen ? (
        <div className="seller-user-chat-emoji-picker">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="seller-user-chat-emoji-picker__item"
              onClick={() => {
                const nextText = `${text}${emoji}`;
                onTextChange?.(nextText);
                onComposerActivity?.(nextText.trim().length > 0);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      <div className="seller-user-chat-composer__field">
        <textarea
          ref={textareaRef}
          className="seller-user-chat-composer__input"
          rows={1}
          placeholder="Xabar yozing..."
          value={text}
          onChange={(event) => {
            const nextText = event.target.value;
            onTextChange?.(nextText);
            onComposerActivity?.(nextText.trim().length > 0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => onStopTyping?.()}
          onFocus={() => setEmojiOpen(false)}
        />
        <button
          type="button"
          className={`seller-user-chat-composer__send${isEditMode ? ' seller-user-chat-composer__send--edit' : ''}`}
          onClick={handleSubmit}
          disabled={!text.trim() || isSending}
          aria-label={isEditMode ? 'Saqlash' : 'Yuborish'}
        >
          <i className={`bx ${isEditMode ? 'bx-check' : 'bx-send'}`} aria-hidden="true" />
        </button>
      </div>

      <div className="seller-user-chat-composer__actions">
        <button
          type="button"
          className={`seller-user-chat-composer__icon-btn${emojiOpen ? ' seller-user-chat-composer__icon-btn--active' : ''}`}
          onClick={() => setEmojiOpen((v) => !v)}
          aria-label="Emoji"
          aria-expanded={emojiOpen}
        >
          <i className="bx bx-smile" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="seller-user-chat-composer__icon-btn"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Rasm yuklash"
        >
          <i className="bx bx-image" aria-hidden="true" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
      </div>
      </div>
    </div>
  );
}

export default function SellerUserChatModal({
  open = false,
  user = null,
  messages = [],
  onClose,
  onSendText,
  onSendImage,
  onDeleteMessage,
  onEditMessage,
  isPartnerTyping = false,
  isPartnerSending = false,
  isPartnerOnline = false,
  partnerLastActiveAt = null,
  isSending = false,
  onComposerActivity,
  onStopTyping,
}) {
  const [actionMessage, setActionMessage] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [composerText, setComposerText] = useState('');

  useEffect(() => {
    if (!open) {
      setActionMessage(null);
      setReplyTarget(null);
      setEditingMessage(null);
      setComposerText('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (actionMessage) {
          setActionMessage(null);
          return;
        }
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, actionMessage]);

  if (!open || !user) return null;

  const resetComposerModes = () => {
    setReplyTarget(null);
    setEditingMessage(null);
    setComposerText('');
  };

  const handleSendText = async (text) => {
    if (editingMessage) {
      await onEditMessage?.(editingMessage.id, text);
      setEditingMessage(null);
      setComposerText('');
      return;
    }

    const replyTo = replyTarget ? buildReplyToPayload(replyTarget) : null;
    onSendText?.(text, replyTo);
    setReplyTarget(null);
    setComposerText('');
  };

  const handleDeleteMessage = async (message) => {
    const ok = await onDeleteMessage?.(message.id);
    if (!ok) return;
    if (editingMessage?.id === message.id) {
      setEditingMessage(null);
      setComposerText('');
    }
    if (replyTarget?.id === message.id) {
      setReplyTarget(null);
    }
  };

  const handleEditMessage = (message) => {
    setReplyTarget(null);
    setEditingMessage(message);
    setComposerText(String(message.content || ''));
  };

  const handleReplyMessage = (message) => {
    setEditingMessage(null);
    setComposerText('');
    setReplyTarget(message);
  };

  return createPortal(
    <div className="seller-user-chat-modal" role="presentation">
      <button type="button" className="seller-user-chat-modal__backdrop" aria-label="Yopish" onClick={onClose} />
      <div className="seller-user-chat-modal__panel" role="dialog" aria-modal="true">
        <SellerUserChatHeader
          user={user}
          onBack={onClose}
          isPartnerTyping={isPartnerTyping}
          isPartnerSending={isPartnerSending}
          isPartnerOnline={isPartnerOnline}
          partnerLastActiveAt={partnerLastActiveAt}
        />
        <SellerUserChatMessageList messages={messages} onMessagePress={setActionMessage} />
        <SellerUserChatComposer
          text={composerText}
          onTextChange={setComposerText}
          editingMessage={editingMessage}
          replyTarget={replyTarget}
          onCancelComposerMode={resetComposerModes}
          onSendText={handleSendText}
          onSendImage={onSendImage}
          onComposerActivity={onComposerActivity}
          onStopTyping={onStopTyping}
          isSending={isSending}
        />
        <MessageChatActionsModal
          open={Boolean(actionMessage)}
          message={actionMessage}
          viewerRole="seller"
          onClose={() => setActionMessage(null)}
          onDelete={handleDeleteMessage}
          onEdit={handleEditMessage}
          onReply={handleReplyMessage}
        />
      </div>
    </div>,
    document.body,
  );
}
