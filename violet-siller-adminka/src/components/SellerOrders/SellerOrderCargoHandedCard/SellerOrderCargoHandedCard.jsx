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
  const items = Array.isArray(order?.items) ? order.items : [];
  const isGroup = items.length > 1 || Boolean(order?.isGroup);
  const productCodes = Array.isArray(order?.productCodes)
    ? order.productCodes.filter(Boolean)
    : String(order?.productCode || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

  const sourceItems = items.length ? items : [order];
  const requestCodes = [
    ...new Set(
      sourceItems
        .map((item) => String(item?.cargoShipment?.requestCode || '').trim())
        .filter(Boolean),
    ),
  ];
  const cargoGroupIds = [
    ...new Set(
      sourceItems
        .map((item) => String(item?.cargoShipment?.groupId || '').trim())
        .filter(Boolean),
    ),
  ];
  const shipment = order?.cargoShipment || sourceItems[0]?.cargoShipment || null;
  const cargoAccepted = sourceItems.some(
    (item) =>
      Boolean(item?.cargoAccepted) ||
      String(item?.trackingStatus) === 'handed_to_cargo',
  );
  const allAccepted = sourceItems.every(
    (item) =>
      Boolean(item?.cargoAccepted) ||
      String(item?.trackingStatus) === 'handed_to_cargo',
  );
  const submittedAt =
    order.readyForCargoAt ||
    sourceItems.find((item) => item.readyForCargoAt)?.readyForCargoAt ||
    shipment?.submittedAt;
  const acceptedAt =
    order.handedToCargoAt ||
    sourceItems.find((item) => item.handedToCargoAt)?.handedToCargoAt ||
    shipment?.acceptedAt;

  return (
    <div className="seller-order-handed-card">
      <div className="seller-order-handed-card__row">
        <span>{t('orders.card.orderCode', { defaultValue: 'Buyurtma' })}</span>
        <strong>{order.orderCode || '—'}</strong>
      </div>

      <div className="seller-order-handed-card__row">
        <span>
          {isGroup
            ? t('orders.card.barcodes', { defaultValue: 'Shtrix kodlar' })
            : t('orders.card.barcode')}
        </span>
        {isGroup && productCodes.length > 1 ? (
          <ul className="seller-order-handed-card__codes">
            {productCodes.map((code) => (
              <li key={code}>
                <strong>{code}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <strong>{productCodes[0] || order.productCode || '—'}</strong>
        )}
      </div>

      {isGroup ? (
        <div className="seller-order-handed-card__row">
          <span>{t('orders.card.products', { defaultValue: 'Mahsulotlar' })}</span>
          <strong>
            {t('orders.card.productCount', {
              count: order.productCount || items.length || productCodes.length || 1,
              defaultValue: '{{count}} ta mahsulot',
            })}
          </strong>
        </div>
      ) : null}

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
        {requestCodes.length > 1 ? (
          <ul className="seller-order-handed-card__codes">
            {requestCodes.map((code) => (
              <li key={code}>
                <strong>{code}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <strong>{requestCodes[0] || shipment?.requestCode || '—'}</strong>
        )}
      </div>
      {cargoGroupIds.length ? (
        <div className="seller-order-handed-card__row">
          <span>
            {t('orders.cargoHanded.cargoGroup', { defaultValue: 'Cargo guruh' })}
          </span>
          <strong>{cargoGroupIds[0]}</strong>
        </div>
      ) : null}
      <div className="seller-order-handed-card__row">
        <span>{t('orders.cargoHanded.submittedAt')}</span>
        <strong>{formatDateTime(submittedAt)}</strong>
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
              <strong>
                {allAccepted
                  ? t('orders.cargoHanded.accepted')
                  : t('orders.cargoHanded.partialAccepted', {
                      defaultValue: 'Qisman qabul qilingan',
                    })}
              </strong>
            </div>
            <div className="seller-order-handed-card__row">
              <span>{t('orders.cargoHanded.acceptedAt')}</span>
              <strong>{formatDateTime(acceptedAt)}</strong>
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
