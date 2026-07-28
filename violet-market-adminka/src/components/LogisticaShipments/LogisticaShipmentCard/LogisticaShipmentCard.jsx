import React from 'react';
import './LogisticaShipmentCard.css';

export default function LogisticaShipmentCard({ shipment, onOpen }) {
  const productCode = shipment?.productId
    ? `#${String(shipment.productId).padStart(4, '0')}`
    : '—';

  return (
    <button
      type="button"
      className="logistica-shipment-card"
      onClick={() => onOpen?.(shipment)}
    >
      <div className="logistica-shipment-card__top">
        <strong className="logistica-shipment-card__code">
          {shipment.requestCode || '—'}
        </strong>
        <span className="logistica-shipment-card__country">
          {shipment.sellerCountryLabel || shipment.sellerCountry || '—'}
        </span>
      </div>

      <div className="logistica-shipment-card__row">
        <span>Siller</span>
        <strong title={shipment.sellerName}>{shipment.sellerName || '—'}</strong>
      </div>
      <div className="logistica-shipment-card__row">
        <span>Mahsulot</span>
        <strong title={shipment.productTitle}>
          {shipment.productTitle || '—'}
        </strong>
      </div>
      <div className="logistica-shipment-card__row">
        <span>Shtrix</span>
        <strong>{productCode}</strong>
      </div>
      <div className="logistica-shipment-card__row">
        <span>Holat</span>
        <strong className="logistica-shipment-card__status">
          {shipment.processStepLabel || 'Qabul qilindi'}
          {shipment.paidAt ? ' · To‘landi' : ''}
        </strong>
      </div>
    </button>
  );
}
