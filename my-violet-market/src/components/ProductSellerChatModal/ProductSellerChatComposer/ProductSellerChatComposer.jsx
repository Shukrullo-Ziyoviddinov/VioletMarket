import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProductSellerChatEmojiPicker from '../ProductSellerChatEmojiPicker/ProductSellerChatEmojiPicker';
import MessageChatReplyBar from '../MessageChatReplyBar';
import './ProductSellerChatComposer.css';

export default function ProductSellerChatComposer({
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
  const { t } = useTranslation();
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

  const handleEmojiSelect = (emoji) => {
    const nextText = `${text}${emoji}`;
    onTextChange?.(nextText);
    onComposerActivity?.(nextText.trim().length > 0);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/') || isSending) return;

    onSendImage?.(file);
    setEmojiOpen(false);
  };

  return (
    <div className="product-seller-chat-composer-wrap">
      {replyTarget ? <MessageChatReplyBar message={replyTarget} onCancel={onCancelComposerMode} /> : null}
      <div className="product-seller-chat-composer">
      <ProductSellerChatEmojiPicker
        open={emojiOpen}
        onSelect={handleEmojiSelect}
        onClose={() => setEmojiOpen(false)}
      />

      <div className="product-seller-chat-composer__field">
        <textarea
          ref={textareaRef}
          className="product-seller-chat-composer__input"
          rows={1}
          placeholder={t('productDetail.chat.inputPlaceholder')}
          value={text}
          onChange={(event) => {
            const nextText = event.target.value;
            onTextChange?.(nextText);
            onComposerActivity?.(nextText.trim().length > 0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => onStopTyping?.()}
          onFocus={() => setEmojiOpen(false)}
          aria-label={t('productDetail.chat.inputPlaceholder')}
        />

        <button
          type="button"
          className={`product-seller-chat-composer__send${isEditMode ? ' product-seller-chat-composer__send--edit' : ''}`}
          onClick={handleSubmit}
          disabled={!text.trim() || isSending}
          aria-label={isEditMode ? t('productDetail.chat.saveEdit') : t('productDetail.chat.send')}
        >
          <i className={`bx ${isEditMode ? 'bx-check' : 'bx-send'}`} aria-hidden="true" />
        </button>
      </div>

      <div className="product-seller-chat-composer__actions">
        <button
          type="button"
          className={`product-seller-chat-composer__icon-btn${
            emojiOpen ? ' product-seller-chat-composer__icon-btn--active' : ''
          }`}
          onClick={() => setEmojiOpen((current) => !current)}
          aria-label={t('productDetail.chat.emoji')}
          aria-expanded={emojiOpen}
        >
          <i className="bx bx-smile" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="product-seller-chat-composer__icon-btn"
          onClick={() => fileInputRef.current?.click()}
          aria-label={t('productDetail.chat.image')}
        >
          <i className="bx bx-image" aria-hidden="true" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="product-seller-chat-composer__file-input"
          onChange={handleImageChange}
          tabIndex={-1}
          aria-hidden
        />
      </div>
      </div>
    </div>
  );
}
