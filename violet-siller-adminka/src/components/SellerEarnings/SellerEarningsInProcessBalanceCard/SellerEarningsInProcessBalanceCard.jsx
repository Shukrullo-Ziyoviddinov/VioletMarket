import React from 'react';
import { ClockCircleOutlined, InfoCircleOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import '../sellerEarningsBalanceCardShared.css';

const STATIC_AMOUNT = "5 750 000 so'm";

export default function SellerEarningsInProcessBalanceCard() {
  const { t } = useTranslation();

  return (
    <article className="seller-earnings-balance-card seller-earnings-balance-card--in-process">
      <div className="seller-earnings-balance-card__top">
        <div className="seller-earnings-balance-card__title-wrap">
          <h3 className="seller-earnings-balance-card__title">
            {t('sellerEarnings.inProcessBalance.title')}
          </h3>
          <span className="seller-earnings-balance-card__info" aria-hidden="true">
            <InfoCircleOutlined />
          </span>
        </div>
        <span className="seller-earnings-balance-card__icon" aria-hidden="true">
          <ClockCircleOutlined />
        </span>
      </div>

      <div className="seller-earnings-balance-card__content">
        <p className="seller-earnings-balance-card__amount">{STATIC_AMOUNT}</p>
        <p className="seller-earnings-balance-card__description">
          {t('sellerEarnings.inProcessBalance.description')}
        </p>
      </div>

      <button type="button" className="seller-earnings-balance-card__action">
        <UnorderedListOutlined />
        <span>{t('sellerEarnings.inProcessBalance.action')}</span>
      </button>
    </article>
  );
}
