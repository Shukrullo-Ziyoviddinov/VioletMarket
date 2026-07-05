import React from 'react';
import { InfoCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import '../sellerEarningsBalanceCardShared.css';

const STATIC_AMOUNT = "14 250 000 so'm";

export default function SellerEarningsAvailableBalanceCard() {
  const { t } = useTranslation();

  return (
    <article className="seller-earnings-balance-card seller-earnings-balance-card--available">
      <div className="seller-earnings-balance-card__top">
        <div className="seller-earnings-balance-card__title-wrap">
          <h3 className="seller-earnings-balance-card__title">
            {t('sellerEarnings.availableBalance.title')}
          </h3>
          <span className="seller-earnings-balance-card__info" aria-hidden="true">
            <InfoCircleOutlined />
          </span>
        </div>
        <span className="seller-earnings-balance-card__icon" aria-hidden="true">
          <WalletOutlined />
        </span>
      </div>

      <div className="seller-earnings-balance-card__content">
        <p className="seller-earnings-balance-card__amount">{STATIC_AMOUNT}</p>
        <p className="seller-earnings-balance-card__description">
          {t('sellerEarnings.availableBalance.description')}
        </p>
      </div>

      <button type="button" className="seller-earnings-balance-card__action">
        {t('sellerEarnings.availableBalance.action')}
      </button>
    </article>
  );
}
