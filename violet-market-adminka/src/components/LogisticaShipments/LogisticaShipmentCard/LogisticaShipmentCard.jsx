import React from 'react';
import {
  formatCargoServiceTypeLabel,
  isMixedCargoLanes,
  normalizeCargoServiceType,
} from '../../../utils/cargoServiceRules';
import './LogisticaShipmentCard.css';

function cargoServiceLabel(shipment) {
  const counts = shipment?.cargoLaneCounts || {};
  const standard = Math.max(0, Number(counts.standard) || 0);
  const express = Math.max(0, Number(counts.express) || 0);
  if (isMixedCargoLanes({ standard, express })) {
    return `Express ${express} · Standard ${standard}`;
  }
  const type =
    normalizeCargoServiceType(shipment?.cargoServiceType) ||
    (express > 0 ? 'express' : standard > 0 ? 'standard' : null);
  return formatCargoServiceTypeLabel(type);
}

export default function LogisticaShipmentCard({ shipment, onOpen }) {
  const isGroup = Boolean(shipment?.isGroup);
  const productCount = Math.max(0, Number(shipment?.productCount) || 0);
  const productCode = shipment?.productId
    ? `#${String(shipment.productId).padStart(4, '0')}`
    : '—';
  const cargoLabel = cargoServiceLabel(shipment);

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

      {cargoLabel ? (
        <div className="logistica-shipment-card__cargo">{cargoLabel}</div>
      ) : null}

      {isGroup ? (
        <div className="logistica-shipment-card__badge">
          Guruh · {productCount || shipment.siblingIds?.length || 0} ta
        </div>
      ) : null}

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
        <span>{isGroup ? 'Mahsulotlar' : 'Shtrix'}</span>
        <strong>
          {isGroup
            ? `${productCount || shipment.siblingIds?.length || 0} ta`
            : productCode}
        </strong>
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
