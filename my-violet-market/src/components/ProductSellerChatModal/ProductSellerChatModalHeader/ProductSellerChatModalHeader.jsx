import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedText, normalizeImagePath } from '../../../utils/utils';
import MessageChatPartnerStatus from '../../MessageChatPartnerStatus';
import MiniModal from '../../MiniModal';
import './ProductSellerChatModalHeader.css';

export default function ProductSellerChatModalHeader({
  seller,
  lang,
  onBack,
  onDeleteThread,
  isPartnerTyping = false,
  isPartnerSending = false,
  isPartnerOnline = false,
  partnerLastActiveAt = null,
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sellerName = seller ? getLocalizedText(seller.name, lang) : '';
  const displayName = sellerName || t('productDetail.chat.sellerFallback');
  const avatarSrc = normalizeImagePath(seller?.logo || '/img/no-image.png');

  const handleDeleteRequest = () => {
    setMenuOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const ok = await onDeleteThread?.();
      if (ok) {
        setConfirmOpen(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <header className="product-seller-chat-modal-header">
      <button
        type="button"
        className="product-seller-chat-modal-header__back"
        onClick={onBack}
        aria-label={t('productDetail.chat.back')}
      >
        <i className="bx bx-chevron-left" aria-hidden="true" />
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
        <div className="product-seller-chat-modal-header__profile-text">
          <h2 className="seller-profile__name">{displayName}</h2>
          <MessageChatPartnerStatus
            isPartnerTyping={isPartnerTyping}
            isPartnerSending={isPartnerSending}
            isPartnerOnline={isPartnerOnline}
            partnerLastActiveAt={partnerLastActiveAt}
          />
        </div>
      </div>

      <button
        type="button"
        className="product-seller-chat-modal-header__menu"
        onClick={() => setMenuOpen((value) => !value)}
        aria-label={t('productDetail.chat.threadMenu')}
        aria-expanded={menuOpen}
      >
        <i className="bx bx-dots-vertical-rounded" aria-hidden="true" />
      </button>

      <MiniModal open={menuOpen} onClose={() => setMenuOpen(false)} align="bottom-end">
        <button
          type="button"
          className="mini-modal__item mini-modal__item--danger"
          onClick={handleDeleteRequest}
        >
          <i className="bx bx-trash" aria-hidden="true" />
          <span>{t('productDetail.chat.deleteThread')}</span>
        </button>
      </MiniModal>

      <MiniModal open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)} align="center">
        <h3 className="mini-modal__title" id="chat-delete-thread-title">
          {t('productDetail.chat.deleteThreadTitle')}
        </h3>
        <p className="mini-modal__text">{t('productDetail.chat.deleteThreadConfirm')}</p>
        <div className="mini-modal__actions">
          <button
            type="button"
            className="mini-modal__btn mini-modal__btn--ghost"
            onClick={() => setConfirmOpen(false)}
            disabled={deleting}
          >
            {t('productDetail.chat.deleteThreadNo')}
          </button>
          <button
            type="button"
            className="mini-modal__btn mini-modal__btn--danger"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {t('productDetail.chat.deleteThreadYes')}
          </button>
        </div>
      </MiniModal>
    </header>
  );
}
