import React, { useState } from 'react';
import {
  formatAdminOrderAmount,
  formatAdminOrderDateTime,
  getAdminOrderBuyerName,
  getAdminOrderBuyerPhone,
  getAdminOrderProductTitle,
} from '../../../utils/adminOrdersDisplay';
import AdminOrderSellerBadge from '../AdminOrderSellerBadge/AdminOrderSellerBadge';
import './AdminOrderNoAnswerCard.css';

function personName(person) {
  const name = [person?.firstName, person?.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  return name || '—';
}

export default function AdminOrderNoAnswerCard({
  order,
  actionLoading = false,
  showSellerCountry = false,
  onReHandoff,
  onReactivate,
  onDeliver,
}) {
  const [busyAction, setBusyAction] = useState('');
  const title = getAdminOrderProductTitle(order);
  const buyer = order?.buyer || order?.customer || {};
  const busy = Boolean(actionLoading || busyAction);

  const runAction = async (key, handler) => {
    if (!handler || busy) return;
    setBusyAction(key);
    try {
      await handler(order);
    } finally {
      setBusyAction('');
    }
  };

  return (
    <article className="seller-order-no-answer-card">
      <div className="seller-order-no-answer-card__header">
        <h3 className="seller-order-no-answer-card__title">{title || '—'}</h3>
        <span className="seller-order-no-answer-card__badge">Javob bermadi</span>
      </div>

      <AdminOrderSellerBadge
        order={order}
        className="admin-order-seller-badge--block"
        showCountry={showSellerCountry}
      />

      <div className="seller-order-no-answer-card__rows">
        <div className="seller-order-no-answer-card__row">
          <span>Shtrix kod</span>
          <strong>{order.productCode || '—'}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>Xaridor</span>
          <strong>{getAdminOrderBuyerName(buyer)}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>Telefon</span>
          <strong>{getAdminOrderBuyerPhone(buyer)}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>Mahsulot narxi</span>
          <strong>{formatAdminOrderAmount(order.amount)}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>Sana va vaqt</span>
          <strong>{formatAdminOrderDateTime(order.orderedAt)}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>Javob bermagan vaqt</span>
          <strong>{formatAdminOrderDateTime(order.noAnswerAt || order.returnedAt)}</strong>
        </div>
      </div>

      <div className="seller-order-no-answer-card__courier">
        <div className="seller-order-no-answer-card__row">
          <span>Kuryer</span>
          <strong>{personName(order.courier)}</strong>
        </div>
        <div className="seller-order-no-answer-card__row">
          <span>Kuryer telefoni</span>
          <strong>{order.courier?.phone || '—'}</strong>
        </div>
        {order.comment ? (
          <div className="seller-order-no-answer-card__comment">
            <span>Izoh</span>
            <p>{order.comment}</p>
          </div>
        ) : null}
      </div>

      <div className="seller-order-no-answer-card__actions">
        <button
          type="button"
          disabled={busy}
          className="seller-order-no-answer-card__button seller-order-no-answer-card__button--secondary"
          onClick={() => runAction('reHandoff', onReHandoff)}
        >
          {busyAction === 'reHandoff' ? '...' : 'Qayta kuryerga topshirish'}
        </button>
        <button
          type="button"
          disabled={busy}
          className="seller-order-no-answer-card__button seller-order-no-answer-card__button--primary"
          onClick={() => runAction('reactivate', onReactivate)}
        >
          {busyAction === 'reactivate' ? '...' : 'Qayta aktiv qilish'}
        </button>
        <button
          type="button"
          disabled={busy}
          className="seller-order-no-answer-card__button seller-order-no-answer-card__button--success"
          onClick={() => runAction('deliver', onDeliver)}
        >
          {busyAction === 'deliver' ? '...' : 'Mijozga topshirildi'}
        </button>
      </div>
    </article>
  );
}
