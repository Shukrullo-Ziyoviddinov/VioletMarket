import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedText, normalizeImagePath } from '../../utils/utils';
import './ProfileMessageThreadsList.css';

const ProfileMessageThreadsList = ({ items, onOpenThread }) => {
  const { i18n, t } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';

  if (!items.length) {
    return (
      <p className="profile-message-threads-empty">{t('profile.messagesEmpty')}</p>
    );
  }

  return (
    <ul className="profile-message-threads-list">
      {items.map((item) => {
        const sellerName = getLocalizedText(item.sellerName, lang) || t('productDetail.chat.sellerFallback');
        return (
          <li key={item.sellerId}>
            <button
              type="button"
              className="profile-message-threads-item"
              onClick={() => onOpenThread(item)}
            >
              <img
                src={normalizeImagePath(item.sellerLogo || '/img/no-image.png')}
                alt=""
                className="profile-message-threads-item__avatar"
                onError={(e) => {
                  e.currentTarget.src = normalizeImagePath('/img/no-image.png');
                }}
              />
              <span className="profile-message-threads-item__name">{sellerName}</span>
              {item.unreadCount > 0 ? (
                <span className="profile-message-threads-item__badge" aria-label={t('profile.messagesUnread', { count: item.unreadCount })}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </span>
              ) : null}
              <i className="bx bx-chevron-right profile-message-threads-item__chevron" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ProfileMessageThreadsList;
