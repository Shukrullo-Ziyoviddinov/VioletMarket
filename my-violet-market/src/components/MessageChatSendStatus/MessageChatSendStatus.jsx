import React from 'react';
import { useTranslation } from 'react-i18next';
import './MessageChatSendStatus.css';

export default function MessageChatSendStatus({ active = false }) {
  const { t } = useTranslation();

  if (!active) return null;

  return (
    <p className="message-chat-send-status" role="status" aria-live="polite">
      {t('productDetail.chat.sending')}
    </p>
  );
}
