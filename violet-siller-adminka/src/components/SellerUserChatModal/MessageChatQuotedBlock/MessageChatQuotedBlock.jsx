import React from 'react';
import './MessageChatQuotedBlock.css';

export default function MessageChatQuotedBlock({ replyTo, onJumpToMessage }) {
  if (!replyTo?.preview) return null;

  const handleClick = (event) => {
    event.stopPropagation();
    if (replyTo?.messageId) {
      onJumpToMessage?.(replyTo.messageId);
    }
  };

  return (
    <button
      type="button"
      className="message-chat-quoted-block"
      onClick={handleClick}
      aria-label="Javob berilgan xabarga o'tish"
    >
      <p className="message-chat-quoted-block__text">{replyTo.preview}</p>
    </button>
  );
}
