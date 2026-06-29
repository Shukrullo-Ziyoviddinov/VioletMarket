import React from 'react';
import './MessageChatSendStatus.css';

export default function MessageChatSendStatus({ active = false }) {
  if (!active) return null;

  return (
    <p className="message-chat-send-status" role="status" aria-live="polite">
      Yuborilmoqda...
    </p>
  );
}
