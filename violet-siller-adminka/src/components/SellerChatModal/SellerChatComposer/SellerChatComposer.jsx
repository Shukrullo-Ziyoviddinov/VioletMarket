import React, { useRef, useState } from 'react';
import { PictureOutlined, SmileOutlined } from '@ant-design/icons';
import SellerChatEmojiPicker from '../SellerChatEmojiPicker/SellerChatEmojiPicker';
import './SellerChatComposer.css';

export default function SellerChatComposer({ onSendText, onSendImage }) {
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
    <div className="seller-chat-composer">
      <SellerChatEmojiPicker
        open={emojiOpen}
        onSelect={handleEmojiSelect}
        onClose={() => setEmojiOpen(false)}
      />

      <div className="seller-chat-composer__field">
        <textarea
          className="seller-chat-composer__input"
          rows={1}
          placeholder="Xabar yozing..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setEmojiOpen(false)}
          aria-label="Chat xabari"
        />

        <div className="seller-chat-composer__actions">
          <button
            type="button"
            className={`seller-chat-composer__icon-btn${
              emojiOpen ? ' seller-chat-composer__icon-btn--active' : ''
            }`}
            onClick={() => setEmojiOpen((current) => !current)}
            aria-label="Emoji"
            aria-expanded={emojiOpen}
          >
            <SmileOutlined />
          </button>

          <button
            type="button"
            className="seller-chat-composer__icon-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Rasm yuklash"
          >
            <PictureOutlined />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="seller-chat-composer__file-input"
            onChange={handleImageChange}
            tabIndex={-1}
            aria-hidden
          />
        </div>
      </div>

      <button
        type="button"
        className="seller-chat-composer__send"
        onClick={handleSend}
        disabled={!text.trim()}
      >
        Yuborish
      </button>
    </div>
  );
}
