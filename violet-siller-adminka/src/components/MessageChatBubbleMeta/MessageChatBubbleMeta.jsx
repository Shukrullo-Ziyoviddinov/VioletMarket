import React from 'react';
import { formatMessageChatTime } from '../../utils/formatMessageChatTime';
import {
  isChatMessageReadByRecipient,
  isOwnChatMessage,
} from '../../utils/messageChatReadStatus';
import './MessageChatBubbleMeta.css';

export default function MessageChatBubbleMeta({ message, viewerRole = 'seller' }) {
  const timeLabel = formatMessageChatTime(message?.createdAt);
  const isOwn = isOwnChatMessage(message, viewerRole);
  const isRead = isChatMessageReadByRecipient(message, viewerRole);
  const showEdited = Boolean(message?.editedAt);

  if (!timeLabel && !isOwn && !showEdited) return null;

  return (
    <div className="message-chat-bubble-meta">
      {showEdited ? <span className="message-chat-bubble-meta__edited">tahrirlangan</span> : null}
      <div className="message-chat-bubble-meta__end">
        {timeLabel ? <span className="message-chat-bubble-meta__time">{timeLabel}</span> : null}
        {isOwn ? (
          <span
            className={`message-chat-bubble-meta__read${isRead ? ' message-chat-bubble-meta__read--read' : ''}`}
            aria-label={isRead ? "O'qildi" : 'Yuborildi'}
          >
            <i className={`bx ${isRead ? 'bx-check-double' : 'bx-check'}`} aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
