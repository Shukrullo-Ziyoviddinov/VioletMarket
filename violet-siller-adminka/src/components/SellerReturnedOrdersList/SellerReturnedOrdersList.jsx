import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatSellerRevenue } from '../../utils/sellerSalesDisplay';
import './SellerReturnedOrdersList.css';

function productTitle(order) {
  return (
    String(order?.title?.uz || '').trim() ||
    String(order?.title?.ru || '').trim() ||
    order?.productCode ||
    '—'
  );
}

function personName(person) {
  const name = [person?.firstName, person?.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  return name || '—';
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SellerReturnedOrdersList({ orders = [], loading = false }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="seller-returned-orders-list seller-returned-orders-list--empty">
        {t('returnedOrders.loading')}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="seller-returned-orders-list seller-returned-orders-list--empty">
        {t('returnedOrders.empty')}
      </div>
    );
  }

  return (
    <div className="seller-returned-orders-list">
      {orders.map((order) => (
        <article key={order.id} className="seller-returned-orders-card">
          <div className="seller-returned-orders-card__media">
            {order.imageUrl ? (
              <img src={order.imageUrl} alt={productTitle(order)} />
            ) : (
              <div className="seller-returned-orders-card__placeholder">—</div>
            )}
          </div>

          <div className="seller-returned-orders-card__body">
            <div className="seller-returned-orders-card__header">
              <div className="seller-returned-orders-card__heading">
                <h3 className="seller-returned-orders-card__title">{productTitle(order)}</h3>
                {order.productCode ? (
                  <p className="seller-returned-orders-card__code">{order.productCode}</p>
                ) : null}
              </div>
              <span
                className={`seller-returned-orders-card__badge seller-returned-orders-card__badge--${
                  order.reasonType === 'no_answer' ? 'no-answer' : 'return'
                }`}
              >
                {order.reasonType === 'no_answer'
                  ? t('returnedOrders.reason.noAnswer')
                  : t('returnedOrders.reason.return')}
              </span>
            </div>

            <div className="seller-returned-orders-card__meta">
              <div className="seller-returned-orders-card__meta-item">
                <span className="seller-returned-orders-card__label">
                  {t('returnedOrders.card.quantity')}
                </span>
                <strong className="seller-returned-orders-card__value">
                  {order.quantity}
                </strong>
              </div>
              <div className="seller-returned-orders-card__meta-item seller-returned-orders-card__meta-item--accent">
                <span className="seller-returned-orders-card__label">
                  {t('returnedOrders.card.price')}
                </span>
                <strong className="seller-returned-orders-card__value seller-returned-orders-card__value--price">
                  {formatSellerRevenue(order.amount)}
                </strong>
              </div>
              <div className="seller-returned-orders-card__meta-item">
                <span className="seller-returned-orders-card__label">
                  {t('returnedOrders.card.orderedAt')}
                </span>
                <strong className="seller-returned-orders-card__value">
                  {formatDateTime(order.orderedAt)}
                </strong>
              </div>
              <div className="seller-returned-orders-card__meta-item">
                <span className="seller-returned-orders-card__label">
                  {t('returnedOrders.card.returnedAt')}
                </span>
                <strong className="seller-returned-orders-card__value">
                  {formatDateTime(order.returnedAt)}
                </strong>
              </div>
            </div>

            <div className="seller-returned-orders-card__people">
              <div className="seller-returned-orders-card__person">
                <span className="seller-returned-orders-card__label">
                  {t('returnedOrders.card.customer')}
                </span>
                <strong className="seller-returned-orders-card__person-name">
                  {personName(order.customer)}
                </strong>
                <p className="seller-returned-orders-card__person-phone">
                  {order.customer?.phone || '—'}
                </p>
              </div>
              <div className="seller-returned-orders-card__person">
                <span className="seller-returned-orders-card__label">
                  {t('returnedOrders.card.courier')}
                </span>
                <strong className="seller-returned-orders-card__person-name">
                  {personName(order.courier)}
                </strong>
                <p className="seller-returned-orders-card__person-phone">
                  {order.courier?.phone || '—'}
                </p>
              </div>
            </div>

            {order.comment ? (
              <div className="seller-returned-orders-card__comment">
                <span className="seller-returned-orders-card__label">
                  {t('returnedOrders.card.comment')}
                </span>
                <p className="seller-returned-orders-card__comment-text">{order.comment}</p>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
