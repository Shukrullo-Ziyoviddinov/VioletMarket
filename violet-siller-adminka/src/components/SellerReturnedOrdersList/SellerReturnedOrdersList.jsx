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
              <h3 className="seller-returned-orders-card__title">{productTitle(order)}</h3>
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

            <div className="seller-returned-orders-card__grid">
              <div>
                <span>{t('returnedOrders.card.quantity')}</span>
                <strong>{order.quantity}</strong>
              </div>
              <div>
                <span>{t('returnedOrders.card.price')}</span>
                <strong>{formatSellerRevenue(order.amount)}</strong>
              </div>
              <div>
                <span>{t('returnedOrders.card.orderedAt')}</span>
                <strong>{formatDateTime(order.orderedAt)}</strong>
              </div>
              <div>
                <span>{t('returnedOrders.card.returnedAt')}</span>
                <strong>{formatDateTime(order.returnedAt)}</strong>
              </div>
            </div>

            <div className="seller-returned-orders-card__people">
              <div>
                <span>{t('returnedOrders.card.customer')}</span>
                <strong>{personName(order.customer)}</strong>
                <p>{order.customer?.phone || '—'}</p>
              </div>
              <div>
                <span>{t('returnedOrders.card.courier')}</span>
                <strong>{personName(order.courier)}</strong>
                <p>{order.courier?.phone || '—'}</p>
              </div>
            </div>

            {order.comment ? (
              <p className="seller-returned-orders-card__comment">
                <span>{t('returnedOrders.card.comment')}:</span> {order.comment}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
