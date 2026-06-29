import React from 'react';
import { getMessagePreviewText } from '../../../utils/messageChatReplyUtils';
import './MessageChatReplyBar.css';

export default function MessageChatReplyBar({ message, onCancel }) {
  if (!message) return null;

  return (
    <div className="message-chat-reply-bar">
      <div className="message-chat-reply-bar__content">
        <p className="message-chat-reply-bar__label">Javob</p>
        <p className="message-chat-reply-bar__preview">{getMessagePreviewText(message)}</p>
      </div>
      <button type="button" className="message-chat-reply-bar__close" onClick={onCancel} aria-label="Bekor qilish">
        <i className="bx bx-x" aria-hidden="true" />
      </button>
    </div>
  );
}
