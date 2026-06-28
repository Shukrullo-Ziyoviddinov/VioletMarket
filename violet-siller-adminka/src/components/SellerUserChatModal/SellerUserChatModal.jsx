import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveAssetUrl } from '../../utils/mediaUrl';
import './SellerUserChatModal.css';
import './SellerUserChatParts.css';

function SellerUserChatHeader({ user, onBack }) {
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Foydalanuvchi';
  const avatarSrc = resolveAssetUrl(user?.profileImage);

  return (
    <header className="seller-user-chat-header">
      <button type="button" className="seller-user-chat-header__back" onClick={onBack} aria-label="Orqaga">
        ←
      </button>
      <div className="seller-user-chat-header__profile">
        <img src={avatarSrc} alt="" className="seller-user-chat-header__avatar" />
        <h2 className="seller-user-chat-header__name">{displayName}</h2>
      </div>
    </header>
  );
}

function SellerUserChatMessageBubble({ message }) {
  const isSeller = message?.sender === 'seller';
  const isImage = message?.type === 'image';
  const imageSrc = isImage ? resolveAssetUrl(message.content) : '';

  return (
    <div
      className={`seller-user-chat-bubble${
        isSeller ? ' seller-user-chat-bubble--seller' : ' seller-user-chat-bubble--customer'
      }${isImage ? ' seller-user-chat-bubble--image' : ''}`}
    >
      {isImage ? (
        <img src={imageSrc} alt="" className="seller-user-chat-bubble__image" />
      ) : (
        <p className="seller-user-chat-bubble__text">{message.content}</p>
      )}
    </div>
  );
}

function SellerUserChatProductMessage({ product, isSeller }) {
  if (!product) return null;
  const title = String(product.title || '').trim() || 'Mahsulot';
  const imageSrc = resolveAssetUrl(product.image);

  return (
    <div
      className={`seller-user-chat-product${
        isSeller ? ' seller-user-chat-product--seller' : ' seller-user-chat-product--customer'
      }`}
    >
      <img src={imageSrc} alt="" className="seller-user-chat-product__image" />
      <div className="seller-user-chat-product__info">
        <p className="seller-user-chat-product__title">{title}</p>
        {product.price ? <span className="seller-user-chat-product__price">{product.price}</span> : null}
      </div>
    </div>
  );
}

function SellerUserChatMessageList({ messages }) {
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
                isSeller={message.sender === 'seller'}
              />
            );
          }
          return <SellerUserChatMessageBubble key={message.id} message={message} />;
        })
      )}
      <div ref={endRef} className="seller-user-chat-message-list__anchor" />
    </div>
  );
}

const EMOJI_OPTIONS = ['😀', '😂', '😊', '😍', '🥰', '😉', '🙏', '👍', '👋', '🔥', '✅', '❤️'];

function SellerUserChatComposer({ onSendText, onSendImage }) {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText?.(trimmed);
    setText('');
    setEmojiOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    onSendImage?.(file);
    setEmojiOpen(false);
  };

  return (
    <div className="seller-user-chat-composer">
      {emojiOpen ? (
        <div className="seller-user-chat-emoji-picker">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="seller-user-chat-emoji-picker__item"
              onClick={() => setText((current) => `${current}${emoji}`)}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      <div className="seller-user-chat-composer__field">
        <textarea
          className="seller-user-chat-composer__input"
          rows={1}
          placeholder="Xabar yozing..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setEmojiOpen(false)}
        />
        <button type="button" className="seller-user-chat-composer__send" onClick={handleSend} disabled={!text.trim()}>
          ➤
        </button>
      </div>

      <div className="seller-user-chat-composer__actions">
        <button type="button" className="seller-user-chat-composer__icon-btn" onClick={() => setEmojiOpen((v) => !v)}>
          ☺
        </button>
        <button type="button" className="seller-user-chat-composer__icon-btn" onClick={() => fileInputRef.current?.click()}>
          🖼
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
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
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !user) return null;

  return createPortal(
    <div className="seller-user-chat-modal" role="presentation">
      <button type="button" className="seller-user-chat-modal__backdrop" aria-label="Yopish" onClick={onClose} />
      <div className="seller-user-chat-modal__panel" role="dialog" aria-modal="true">
        <SellerUserChatHeader user={user} onBack={onClose} />
        <SellerUserChatMessageList messages={messages} />
        <SellerUserChatComposer onSendText={onSendText} onSendImage={onSendImage} />
      </div>
    </div>,
    document.body,
  );
}
