import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatSellerOrderAmount,
  formatSellerOrderDateTime,
  getSellerOrderBuyerName,
  getSellerOrderBuyerPhone,
  getSellerOrderProductTitle,
} from '../../../utils/sellerOrdersDisplay';
import './SellerOrderNoAnswerCard.css';

function personName(person) {
  const name = [person?.firstName, person?.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  return name || '—';
}

export default function SellerOrderNoAnswerCard({ order }) {
  const { t, i18n } = useTranslation();
  const title = getSellerOrderProductTitle(order, i18n.language);
  const buyer = order?.buyer || order?.customer || {};

  return (
    <article className="seller-order-no-answer-card">
      <div className="seller-order-no-answer-card__header">
        <h3 className="seller-order-no-answer-card__title">{title || '—'}</h3>
        <span className="seller-order-no-answer-card__badge">
          {t('orders.noAnswer.badge')}
        </span>
      </div>

      <div className="seller-order-no-answer-card__rows">
        <div className="seller-order-no-answer-card__row">
          <span>{t('orders.card.barcode')}</span>
          <strong>{order.productCode || '—'}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>{t('orders.card.buyer')}</span>
          <strong>{getSellerOrderBuyerName(buyer)}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>{t('orders.card.phone')}</span>
          <strong>{getSellerOrderBuyerPhone(buyer)}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>{t('orders.card.amount')}</span>
          <strong>{formatSellerOrderAmount(order.amount)}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>{t('orders.card.orderedAt')}</span>
          <strong>{formatSellerOrderDateTime(order.orderedAt, t)}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>{t('orders.noAnswer.at')}</span>
          <strong>
            {formatSellerOrderDateTime(order.noAnswerAt || order.returnedAt, t)}
          </strong>
        </div>
      </div>

      <div className="seller-order-no-answer-card__courier">
        <div className="seller-order-no-answer-card__row">
          <span>{t('orders.noAnswer.courier')}</span>
          <strong>{personName(order.courier)}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>{t('orders.noAnswer.courierPhone')}</span>
          <strong>{order.courier?.phone || '—'}</strong>
        </div>
        {order.comment ? (
          <div className="seller-order-no-answer-card__comment">
            <span>{t('orders.noAnswer.comment')}</span>
            <p>{order.comment}</p>
          </div>
        ) : null}
      </div>

      <div className="seller-order-no-answer-card__actions">
        <button
          type="button"
          className="seller-order-no-answer-card__button seller-order-no-answer-card__button--secondary"
          onClick={() => {
            // Keyingi bosqich
          }}
        >
          {t('orders.noAnswer.reHandoff')}
        </button>
        <button
          type="button"
          className="seller-order-no-answer-card__button seller-order-no-answer-card__button--primary"
          onClick={() => {
            // Keyingi bosqich
          }}
        >
          {t('orders.noAnswer.reactivate')}
        </button>
        <button
          type="button"
          className="seller-order-no-answer-card__button seller-order-no-answer-card__button--success"
          onClick={() => {
            // Keyingi bosqich
          }}
        >
          {t('orders.noAnswer.deliveredToCustomer')}
        </button>
      </div>
    </article>
  );
}
