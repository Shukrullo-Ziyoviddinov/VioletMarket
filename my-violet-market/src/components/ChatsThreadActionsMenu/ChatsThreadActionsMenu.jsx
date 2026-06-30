import React from 'react';
import { useTranslation } from 'react-i18next';
import MiniModal from '../MiniModal';
import './ChatsThreadActionsMenu.css';

export default function ChatsThreadActionsMenu({
  open = false,
  isPinned = false,
  isArchived = false,
  anchorRef = null,
  onClose,
  onTogglePin,
  onArchive,
  onUnarchive,
  onDelete,
}) {
  const { t } = useTranslation();

  return (
    <MiniModal
      open={open}
      onClose={onClose}
      align="bottom-end"
      viewportBackdrop
      anchorRef={anchorRef}
    >
      <button type="button" className="chats-thread-actions-menu__item" onClick={onTogglePin}>
        <i className="bx bx-pin" aria-hidden="true" />
        <span>{isPinned ? t('chats.actions.unpin') : t('chats.actions.pin')}</span>
      </button>
      {isArchived ? (
        <button type="button" className="chats-thread-actions-menu__item" onClick={onUnarchive}>
          <i className="bx bx-archive-out" aria-hidden="true" />
          <span>{t('chats.actions.unarchive')}</span>
        </button>
      ) : (
        <button type="button" className="chats-thread-actions-menu__item" onClick={onArchive}>
          <i className="bx bx-archive-in" aria-hidden="true" />
          <span>{t('chats.actions.archive')}</span>
        </button>
      )}
      <button
        type="button"
        className="chats-thread-actions-menu__item chats-thread-actions-menu__item--danger"
        onClick={onDelete}
      >
        <i className="bx bx-trash" aria-hidden="true" />
        <span>{t('chats.actions.delete')}</span>
      </button>
    </MiniModal>
  );
}
