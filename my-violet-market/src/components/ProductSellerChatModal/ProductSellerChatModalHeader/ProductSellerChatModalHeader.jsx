import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedText, normalizeImagePath } from '../../../utils/utils';
import './ProductSellerChatModalHeader.css';

export default function ProductSellerChatModalHeader({ seller, lang, onBack }) {
  const { t } = useTranslation();
  const sellerName = seller ? getLocalizedText(seller.name, lang) : '';
  const displayName = sellerName || t('productDetail.chat.sellerFallback');
  const avatarSrc = normalizeImagePath(seller?.logo || '/img/no-image.png');

  return (
    <header className="product-seller-chat-modal-header">
      <button
        type="button"
        className="product-seller-chat-modal-header__back"
        onClick={onBack}
        aria-label={t('productDetail.chat.back')}
      >
        <i className="bx bx-arrow-back" aria-hidden="true" />
      </button>

      <div className="product-seller-chat-modal-header__profile">
        <div className="seller-profile__avatar-wrap">
          <img
            src={avatarSrc}
            alt={displayName}
            className="seller-profile__avatar"
            onError={(event) => {
              event.currentTarget.src = normalizeImagePath('/img/no-image.png');
            }}
          />
        </div>
        <h2 className="seller-profile__name">{displayName}</h2>
      </div>
    </header>
  );
}
