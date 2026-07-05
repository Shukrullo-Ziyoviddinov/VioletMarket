import React from 'react';
import { BarChartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatSellerEarningsAmount } from '../../../utils/sellerEarningsDisplay';
import '../sellerEarningsBalanceCardShared.css';

export default function SellerEarningsWithdrawnBalanceCard({ amount = 0 }) {
  const { t } = useTranslation();

  return (
    <article className="seller-earnings-balance-card seller-earnings-balance-card--withdrawn">
      <div className="seller-earnings-balance-card__top">
        <div className="seller-earnings-balance-card__title-wrap">
          <h3 className="seller-earnings-balance-card__title">
            {t('sellerEarnings.withdrawnBalance.title')}
          </h3>
          <span className="seller-earnings-balance-card__info" aria-hidden="true">
            <InfoCircleOutlined />
          </span>
        </div>
        <span className="seller-earnings-balance-card__icon" aria-hidden="true">
          <BarChartOutlined />
        </span>
      </div>

      <div className="seller-earnings-balance-card__content">
        <p className="seller-earnings-balance-card__amount">{formatSellerEarningsAmount(amount)}</p>
        <p className="seller-earnings-balance-card__description">
          {t('sellerEarnings.withdrawnBalance.description')}
        </p>
      </div>

      <button type="button" className="seller-earnings-balance-card__action">
        {t('sellerEarnings.withdrawnBalance.action')}
      </button>
    </article>
  );
}
