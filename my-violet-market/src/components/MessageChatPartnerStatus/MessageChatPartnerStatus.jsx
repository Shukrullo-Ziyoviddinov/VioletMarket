import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatLastActiveUz } from '../../utils/formatLastActiveUz';
import './MessageChatPartnerStatus.css';

export default function MessageChatPartnerStatus({
  isPartnerTyping = false,
  isPartnerSending = false,
  isPartnerOnline = false,
  partnerLastActiveAt = null,
}) {
  const { t } = useTranslation();

  if (isPartnerSending) {
    return (
      <p className="message-chat-partner-status message-chat-partner-status--action">
        {t('productDetail.chat.sending')}
      </p>
    );
  }

  if (isPartnerTyping) {
    return (
      <p className="message-chat-partner-status message-chat-partner-status--action">
        {t('productDetail.chat.typing')}
      </p>
    );
  }

  if (isPartnerOnline) {
    return (
      <p className="message-chat-partner-status message-chat-partner-status--online">
        <span className="message-chat-partner-status__dot" aria-hidden="true" />
        {t('productDetail.chat.online')}
      </p>
    );
  }

  if (partnerLastActiveAt) {
    return (
      <p className="message-chat-partner-status message-chat-partner-status--last-active">
        {t('productDetail.chat.lastActive')}: {formatLastActiveUz(partnerLastActiveAt)}
      </p>
    );
  }

  return null;
}
