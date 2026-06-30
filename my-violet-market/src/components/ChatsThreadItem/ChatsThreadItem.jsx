import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedText, normalizeImagePath } from '../../utils/utils';
import { getMessagePreviewText } from '../../utils/messageChatReplyUtils';
import { formatChatThreadListTime, formatChatThreadStatusTime } from '../../utils/formatChatThreadListTime';
import { getThreadPreference } from '../../utils/chatsThreadUtils';
import ChatsThreadActionsMenu from '../ChatsThreadActionsMenu';
import './ChatsThreadItem.css';

const LONG_PRESS_MS = 500;

export default function ChatsThreadItem({
  thread,
  preferences,
  presence,
  isTyping = false,
  onOpen,
  onTogglePin,
  onDelete,
}) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const pressTimerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [actionsOpen, setActionsOpen] = React.useState(false);

  const pref = getThreadPreference(thread.sellerId, preferences);
  const sellerName = getLocalizedText(thread.sellerName, lang) || t('productDetail.chat.sellerFallback');
  const lastMessage = thread.lastMessage;
  const preview = isTyping
    ? t('productDetail.chat.typing')
    : getMessagePreviewText(lastMessage);
  const listTime = formatChatThreadListTime(lastMessage?.createdAt, lang);
  const isOnline = Boolean(presence?.isOnline);
  const statusTime = presence?.lastActiveAt || lastMessage?.createdAt;
  const statusText = isOnline
    ? t('productDetail.chat.online')
    : formatChatThreadStatusTime(statusTime, lang);
  const isOwnLast = lastMessage?.sender === 'customer';
  const isRead = Boolean(lastMessage?.readBySeller);

  const openActions = useCallback(() => {
    suppressClickRef.current = true;
    setActionsOpen(true);
  }, []);

  const clearPressTimer = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handlePointerDown = () => {
    clearPressTimer();
    pressTimerRef.current = setTimeout(openActions, LONG_PRESS_MS);
  };

  const handlePointerUp = () => {
    clearPressTimer();
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onOpen?.(thread);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    openActions();
  };

  return (
    <div className="chats-thread-item-wrap">
      <button
        type="button"
        className="chats-thread-item"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={normalizeImagePath(thread.sellerLogo || '/img/no-image.png')}
          alt=""
          className="chats-thread-item__avatar"
          onError={(event) => {
            event.currentTarget.src = normalizeImagePath('/img/no-image.png');
          }}
        />

        <div className="chats-thread-item__body">
          <div className="chats-thread-item__top">
            <div className="chats-thread-item__title-row">
              <span className="chats-thread-item__name">{sellerName}</span>
              <span className={`chats-thread-item__status${isOnline ? ' chats-thread-item__status--online' : ''}`}>
                {isOnline ? <span className="chats-thread-item__status-dot" aria-hidden="true" /> : null}
                {statusText}
              </span>
            </div>
            <span className="chats-thread-item__time">{listTime}</span>
          </div>

          <div className="chats-thread-item__bottom">
            <p className={`chats-thread-item__preview${isTyping ? ' chats-thread-item__preview--typing' : ''}`}>
              {preview}
            </p>

            <div className="chats-thread-item__meta">
              {pref.pinned ? <i className="bx bx-pin chats-thread-item__icon" aria-hidden="true" /> : null}
              {pref.muted ? <i className="bx bx-bell-off chats-thread-item__icon" aria-hidden="true" /> : null}
              {thread.unreadCount > 0 ? (
                <span className="chats-thread-item__badge">
                  {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                </span>
              ) : null}
              {isOwnLast ? (
                <i
                  className={`bx ${isRead ? 'bx-check-double chats-thread-item__read--read' : 'bx-check'} chats-thread-item__read`}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          </div>
        </div>
      </button>

      <ChatsThreadActionsMenu
        open={actionsOpen}
        isPinned={Boolean(pref.pinned)}
        onClose={() => setActionsOpen(false)}
        onTogglePin={() => {
          onTogglePin?.(thread);
          setActionsOpen(false);
        }}
        onDelete={() => {
          onDelete?.(thread);
          setActionsOpen(false);
        }}
      />
    </div>
  );
}
