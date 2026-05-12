import React from 'react';
import { useTranslation } from 'react-i18next';
import './SellerSubscriberCount.css';

const SellerSubscriberCount = ({ count = 0, className = '' }) => {
  const { t } = useTranslation();
  const n = Math.max(0, Number(count) || 0);

  return (
    <p className={`seller-subscriber-count ${className}`.trim()} aria-live="polite">
      {t('seller.subscriberCount', { count: n })}
    </p>
  );
};

export default SellerSubscriberCount;
