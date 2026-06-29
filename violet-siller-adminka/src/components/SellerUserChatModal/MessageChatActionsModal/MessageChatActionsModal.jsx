import React from 'react';
import { isOwnChatMessage } from '../../../utils/messageChatReadStatus';
import './MessageChatActionsModal.css';

export default function MessageChatActionsModal({
  open = false,
  message = null,
  viewerRole = 'seller',
  onClose,
  onDelete,
  onEdit,
  onReply,
}) {
  if (!open || !message) return null;

  const isOwn = isOwnChatMessage(message, viewerRole);
  const canEdit = isOwn && message.type === 'text';

  const handleAction = (action) => {
    action?.();
    onClose?.();
  };

  return (
    <div className="message-chat-actions-modal" role="presentation">
      <button type="button" className="message-chat-actions-modal__backdrop" onClick={onClose} aria-label="Yopish" />
      <div className="message-chat-actions-modal__sheet" role="dialog" aria-modal="true">
        {canEdit ? (
          <button type="button" className="message-chat-actions-modal__item" onClick={() => handleAction(() => onEdit?.(message))}>
            <i className="bx bx-edit" aria-hidden="true" />
            <span>Tahrirlash</span>
          </button>
        ) : null}
        <button type="button" className="message-chat-actions-modal__item" onClick={() => handleAction(() => onReply?.(message))}>
          <i className="bx bx-reply" aria-hidden="true" />
          <span>Javob berish</span>
        </button>
        {isOwn ? (
          <button
            type="button"
            className="message-chat-actions-modal__item message-chat-actions-modal__item--danger"
            onClick={() => handleAction(() => onDelete?.(message))}
          >
            <i className="bx bx-trash" aria-hidden="true" />
            <span>O&apos;chirish</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
