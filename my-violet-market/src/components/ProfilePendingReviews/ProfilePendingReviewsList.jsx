import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedText, normalizeImagePath } from '../../utils/utils';
import { formatOrderDate } from '../../utils/formatOrderDate';
import './ProfilePendingReviewsList.css';

const ProfilePendingReviewsList = ({ items, onLeaveFeedback }) => {
  const { i18n, t } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';

  if (!items.length) {
    return (
      <p className="profile-pending-reviews-empty">{t('profile.pendingReviewsEmpty')}</p>
    );
  }

  return (
    <ul className="profile-pending-reviews-list">
      {items.map((item) => (
        <li key={item.id} className="profile-pending-reviews-item">
          <div className="profile-pending-reviews-item__row">
            <img
              src={normalizeImagePath(item.productImage || '/img/no-image.png')}
              alt=""
              className="profile-pending-reviews-item__img"
              onError={(e) => {
                e.target.src = normalizeImagePath('/img/no-image.png');
              }}
            />
            <div className="profile-pending-reviews-item__info">
              <h3 className="profile-pending-reviews-item__title">
                {getLocalizedText(item.productTitle, lang)}
              </h3>
              <p className="profile-pending-reviews-item__date">
                {t('profile.orderDateLabel')}: {formatOrderDate(item.orderDate, lang)}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="profile-pending-reviews-item__btn"
            onClick={() => onLeaveFeedback(item)}
          >
            {t('profile.leaveFeedback')}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ProfilePendingReviewsList;
