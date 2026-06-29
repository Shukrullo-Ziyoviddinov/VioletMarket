import React from 'react';
import { formatLastActiveUz } from '../../utils/formatLastActiveUz';
import './MessageChatPartnerStatus.css';

export default function MessageChatPartnerStatus({
  isPartnerTyping = false,
  isPartnerSending = false,
  isPartnerOnline = false,
  partnerLastActiveAt = null,
}) {
  if (isPartnerSending) {
    return <p className="message-chat-partner-status message-chat-partner-status--action">Yuborilmoqda...</p>;
  }

  if (isPartnerTyping) {
    return <p className="message-chat-partner-status message-chat-partner-status--action">Yozmoqda...</p>;
  }

  if (isPartnerOnline) {
    return (
      <p className="message-chat-partner-status message-chat-partner-status--online">
        <span className="message-chat-partner-status__dot" aria-hidden="true" />
        Online
      </p>
    );
  }

  if (partnerLastActiveAt) {
    return (
      <p className="message-chat-partner-status message-chat-partner-status--last-active">
        Oxirgi faollik: {formatLastActiveUz(partnerLastActiveAt)}
      </p>
    );
  }

  return null;
}
