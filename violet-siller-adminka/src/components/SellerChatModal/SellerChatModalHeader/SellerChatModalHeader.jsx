import React from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import './SellerChatModalHeader.css';

export default function SellerChatModalHeader({ participantName = '', participantAvatar = '', onBack }) {
  const displayName = String(participantName || '').trim() || 'Mijoz';
  const avatarSrc = resolveAssetUrl(participantAvatar);

  return (
    <header className="seller-chat-modal-header">
      <button
        type="button"
        className="seller-chat-modal-header__back"
        onClick={onBack}
        aria-label="Orqaga"
      >
        <ArrowLeftOutlined />
      </button>

      <div className="seller-chat-modal-header__profile">
        <div className="seller-profile__avatar-wrap">
          <img
            src={avatarSrc}
            alt={displayName}
            className="seller-profile__avatar"
            onError={(event) => {
              event.currentTarget.src = resolveAssetUrl('');
            }}
          />
        </div>
        <h2 className="seller-profile__name">{displayName}</h2>
      </div>
    </header>
  );
}
