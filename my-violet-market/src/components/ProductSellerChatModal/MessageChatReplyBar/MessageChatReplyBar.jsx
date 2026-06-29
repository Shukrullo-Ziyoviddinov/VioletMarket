import React from 'react';
import { useTranslation } from 'react-i18next';
import { getMessagePreviewText } from '../../../utils/messageChatReplyUtils';
import './MessageChatReplyBar.css';

export default function MessageChatReplyBar({ message, onCancel }) {
  const { t } = useTranslation();

  if (!message) return null;

  return (
    <div className="message-chat-reply-bar">
      <div className="message-chat-reply-bar__content">
        <p className="message-chat-reply-bar__label">{t('productDetail.chat.replyingTo')}</p>
        <p className="message-chat-reply-bar__preview">{getMessagePreviewText(message)}</p>
      </div>
      <button type="button" className="message-chat-reply-bar__close" onClick={onCancel} aria-label={t('productDetail.chat.cancelReply')}>
        <i className="bx bx-x" aria-hidden="true" />
      </button>
    </div>
  );
}
