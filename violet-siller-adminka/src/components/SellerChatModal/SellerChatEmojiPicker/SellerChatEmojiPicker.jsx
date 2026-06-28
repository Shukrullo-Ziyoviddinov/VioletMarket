import React from 'react';
import './SellerChatEmojiPicker.css';

const EMOJI_OPTIONS = [
  '😀', '😂', '😊', '😍', '🥰', '😉', '🙏', '👍', '👋', '🔥',
  '✅', '❤️', '💜', '🎉', '🤔', '😢', '😮', '💯', '⭐', '🛍️',
];

export default function SellerChatEmojiPicker({ open = false, onSelect, onClose }) {
  if (!open) return null;

  return (
    <div className="seller-chat-emoji-picker" role="dialog" aria-label="Emojilar">
      <div className="seller-chat-emoji-picker__grid">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="seller-chat-emoji-picker__item"
            onClick={() => {
              onSelect?.(emoji);
              onClose?.();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
