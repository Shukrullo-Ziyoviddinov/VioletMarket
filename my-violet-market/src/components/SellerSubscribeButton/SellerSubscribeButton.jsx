import React from 'react';
import { useTranslation } from 'react-i18next';
import './SellerSubscribeButton.css';

const SellerSubscribeButton = ({ subscribed, onToggle, className = '' }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`seller-subscribe-btn${subscribed ? ' seller-subscribe-btn--active' : ''} ${className}`.trim()}
      onClick={onToggle}
      aria-pressed={subscribed}
    >
      {subscribed ? t('seller.unsubscribe') : t('seller.subscribe')}
    </button>
  );
};

export default SellerSubscribeButton;
