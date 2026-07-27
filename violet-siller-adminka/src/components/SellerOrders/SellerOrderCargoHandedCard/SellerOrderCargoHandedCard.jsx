import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  getSellerOrderBuyerName,
  getSellerOrderBuyerPhone,
} from '../../../utils/sellerOrdersDisplay';
import '../SellerOrderHandedCard/SellerOrderHandedCard.css';

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

export default function SellerOrderCargoHandedCard({ order }) {
  const { t } = useTranslation();
  const shipment = order?.cargoShipment || null;
  const cargoAccepted = Boolean(
    order?.cargoAccepted || String(order?.trackingStatus) === 'handed_to_cargo',
  );
  const requestCode = shipment?.requestCode || '—';

  return (
    <div className="seller-order-handed-card">
      <div className="seller-order-handed-card__row">
        <span>{t('orders.card.barcode')}</span>
        <strong>{order.productCode || '—'}</strong>
      </div>
      <div className="seller-order-handed-card__row">
        <span>{t('orders.card.buyer')}</span>
        <strong>{getSellerOrderBuyerName(order.buyer)}</strong>
      </div>
      <div className="seller-order-handed-card__row">
        <span>{t('orders.card.phone')}</span>
        <strong>{getSellerOrderBuyerPhone(order.buyer)}</strong>
      </div>
      <div className="seller-order-handed-card__row">
        <span>{t('orders.cargoHanded.requestCode')}</span>
        <strong>{requestCode}</strong>
      </div>
      <div className="seller-order-handed-card__row">
        <span>{t('orders.cargoHanded.submittedAt')}</span>
        <strong>
          {formatDateTime(order.readyForCargoAt || shipment?.submittedAt)}
        </strong>
      </div>

      <div
        className={`seller-order-handed-card__courier${
          cargoAccepted ? '' : ' seller-order-handed-card__courier--waiting'
        }`}
      >
        {cargoAccepted ? (
          <>
            <div className="seller-order-handed-card__row">
              <span>{t('orders.cargoHanded.status')}</span>
              <strong>{t('orders.cargoHanded.accepted')}</strong>
            </div>
            <div className="seller-order-handed-card__row">
              <span>{t('orders.cargoHanded.acceptedAt')}</span>
              <strong>
                {formatDateTime(order.handedToCargoAt || shipment?.acceptedAt)}
              </strong>
            </div>
          </>
        ) : (
          <p className="seller-order-handed-card__waiting">
            {t('orders.cargoHanded.waitingCargo')}
          </p>
        )}
      </div>
    </div>
  );
}
