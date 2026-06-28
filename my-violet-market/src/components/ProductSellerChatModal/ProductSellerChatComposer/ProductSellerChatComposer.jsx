import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProductSellerChatEmojiPicker from '../ProductSellerChatEmojiPicker/ProductSellerChatEmojiPicker';
import './ProductSellerChatComposer.css';

export default function ProductSellerChatComposer({ onSendText, onSendImage }) {
  const { t } = useTranslation();
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

  const handleEmojiSelect = (emoji) => {
    setText((current) => `${current}${emoji}`);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    const previewUrl = URL.createObjectURL(file);
    onSendImage?.(previewUrl, file);
    setEmojiOpen(false);
  };

  return (
    <div className="product-seller-chat-composer">
      <ProductSellerChatEmojiPicker
        open={emojiOpen}
        onSelect={handleEmojiSelect}
        onClose={() => setEmojiOpen(false)}
      />

      <div className="product-seller-chat-composer__field">
        <textarea
          className="product-seller-chat-composer__input"
          rows={1}
          placeholder={t('productDetail.chat.inputPlaceholder')}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setEmojiOpen(false)}
          aria-label={t('productDetail.chat.inputPlaceholder')}
        />

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

      <button
        type="button"
        className="product-seller-chat-composer__send"
        onClick={handleSend}
        disabled={!text.trim()}
      >
        {t('productDetail.chat.send')}
      </button>
    </div>
  );
}
