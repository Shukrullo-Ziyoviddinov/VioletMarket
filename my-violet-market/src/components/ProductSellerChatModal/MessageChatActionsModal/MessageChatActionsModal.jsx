import React from 'react';
import { useTranslation } from 'react-i18next';
import { isOwnChatMessage } from '../../utils/messageChatReadStatus';
import './MessageChatActionsModal.css';

export default function MessageChatActionsModal({
  open = false,
  message = null,
  viewerRole = 'user',
  onClose,
  onDelete,
  onEdit,
  onReply,
}) {
  const { t } = useTranslation();

  if (!open || !message) return null;

  const isOwn = isOwnChatMessage(message, viewerRole);
  const canEdit = isOwn && message.type === 'text';

  const handleAction = (action) => {
    action?.();
    onClose?.();
  };

  return (
    <div className="message-chat-actions-modal" role="presentation">
      <button type="button" className="message-chat-actions-modal__backdrop" onClick={onClose} aria-label={t('productDetail.chat.close')} />
      <div className="message-chat-actions-modal__sheet" role="dialog" aria-modal="true">
        {canEdit ? (
          <button type="button" className="message-chat-actions-modal__item" onClick={() => handleAction(() => onEdit?.(message))}>
            <i className="bx bx-edit" aria-hidden="true" />
            <span>{t('productDetail.chat.actionEdit')}</span>
          </button>
        ) : null}
        <button type="button" className="message-chat-actions-modal__item" onClick={() => handleAction(() => onReply?.(message))}>
          <i className="bx bx-reply" aria-hidden="true" />
          <span>{t('productDetail.chat.actionReply')}</span>
        </button>
        {isOwn ? (
          <button
            type="button"
            className="message-chat-actions-modal__item message-chat-actions-modal__item--danger"
            onClick={() => handleAction(() => onDelete?.(message))}
          >
            <i className="bx bx-trash" aria-hidden="true" />
            <span>{t('productDetail.chat.actionDelete')}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
