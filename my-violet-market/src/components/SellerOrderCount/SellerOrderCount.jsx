import React from 'react';
import { useTranslation } from 'react-i18next';
import './SellerOrderCount.css';

const SellerOrderCount = ({ count = 0, className = '' }) => {
  const { t } = useTranslation();
  const n = Math.max(0, Number(count) || 0);

  return (
    <p className={`seller-order-count ${className}`.trim()} aria-live="polite">
      {t('seller.orderCount', { count: n })}
    </p>
  );
};

export default SellerOrderCount;
