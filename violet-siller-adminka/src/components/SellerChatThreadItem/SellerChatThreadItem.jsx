import React from 'react';
import { resolveAssetUrl } from '../../utils/mediaUrl';
import './SellerChatThreadItem.css';

export default function SellerChatThreadItem({ thread, onOpen }) {
  const avatarSrc = resolveAssetUrl(thread?.customerAvatar);
  const name = String(thread?.customerName || '').trim() || 'Mijoz';
  const preview = String(thread?.lastMessage || '').trim() || 'Xabar yo\'q';

  return (
    <button type="button" className="seller-chat-thread-item" onClick={() => onOpen?.(thread)}>
      <div className="seller-profile__avatar-wrap seller-chat-thread-item__avatar-wrap">
        <img
          src={avatarSrc}
          alt={name}
          className="seller-profile__avatar"
          onError={(event) => {
            event.currentTarget.src = resolveAssetUrl('');
          }}
        />
      </div>

      <div className="seller-chat-thread-item__body">
        <div className="seller-chat-thread-item__top">
          <h3 className="seller-profile__name seller-chat-thread-item__name">{name}</h3>
          {thread?.updatedAtLabel ? (
            <span className="seller-chat-thread-item__time">{thread.updatedAtLabel}</span>
          ) : null}
        </div>
        <p className="seller-chat-thread-item__preview">{preview}</p>
      </div>
    </button>
  );
}
