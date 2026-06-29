import React from 'react';
import './MessageChatQuotedBlock.css';

export default function MessageChatQuotedBlock({ replyTo }) {
  if (!replyTo?.preview) return null;

  return (
    <div className={`message-chat-quoted-block message-chat-quoted-block--${replyTo.sender || 'customer'}`}>
      <p className="message-chat-quoted-block__text">{replyTo.preview}</p>
    </div>
  );
}
