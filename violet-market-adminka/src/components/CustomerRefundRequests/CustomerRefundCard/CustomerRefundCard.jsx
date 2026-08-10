import React from 'react';
import { formatRevenue, resolveProductImageUrl } from '../../../utils/productDisplay';
import './CustomerRefundCard.css';

function productTitle(item) {
  return (
    String(item?.title?.uz || '').trim() ||
    String(item?.title?.ru || '').trim() ||
    item?.productCode ||
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

function variantParts(unit) {
  return [unit?.size, unit?.color, unit?.storage, unit?.model]
    .map((part) => String(part || '').trim())
    .filter(Boolean);
}

export default function CustomerRefundCard({ item, confirming = false, onConfirm }) {
  const isPending = item?.status === 'pending';
  const units = Array.isArray(item?.units) && item.units.length
    ? item.units
    : [
        {
          id: item?.id,
          title: item?.title,
          productCode: item?.productCode,
          amount: item?.amount,
          imageUrl: item?.imageUrl,
          color: item?.color,
          size: item?.size,
          storage: item?.storage,
          model: item?.model,
        },
      ];
  const isGroup = Boolean(item?.isGroup) || units.length > 1;
  const reasonLabel =
    item?.reasonType === 'defective'
      ? 'Yaroqsiz'
      : item?.reasonType === 'unavailable'
        ? 'Mavjud emas'
        : 'Qaytarilgan';
  const reasonBadgeClass =
    item?.reasonType === 'defective'
      ? 'defective'
      : item?.reasonType === 'unavailable'
        ? 'unavailable'
        : 'return';
  const source = String(item?.source || 'courier').trim().toLowerCase();

  return (
    <article className="customer-refund-card">
      <div className="customer-refund-card__media">
        <img
          src={resolveProductImageUrl(item?.imageUrl || units[0]?.imageUrl)}
          alt={productTitle(item)}
          onError={(event) => {
            event.currentTarget.src = resolveProductImageUrl('');
          }}
        />
      </div>

      <div className="customer-refund-card__body">
        <div className="customer-refund-card__header">
          <div>
            <h3 className="customer-refund-card__title">{productTitle(item)}</h3>
            {item?.orderId ? (
              <p className="customer-refund-card__code">Buyurtma #{item.orderId}</p>
            ) : null}
            {!isGroup && item?.productCode ? (
              <p className="customer-refund-card__code">{item.productCode}</p>
            ) : null}
            {isGroup ? (
              <p className="customer-refund-card__code">{units.length} ta mahsulot</p>
            ) : null}
          </div>
          <div className="customer-refund-card__badges">
            <span
              className={`customer-refund-card__badge customer-refund-card__badge--${reasonBadgeClass}`}
            >
              {reasonLabel}
            </span>
            <span
              className={`customer-refund-card__badge customer-refund-card__badge--${
                isPending ? 'pending' : 'refunded'
              }`}
            >
              {isPending ? 'Kutilmoqda' : 'Qaytarildi'}
            </span>
          </div>
        </div>

        <div className="customer-refund-card__seller">
          <img
            src={resolveProductImageUrl(item?.seller?.logo)}
            alt={item?.seller?.name || 'Siller'}
            onError={(event) => {
              event.currentTarget.src = resolveProductImageUrl('');
            }}
          />
          <div>
            <span className="customer-refund-card__label">Siller</span>
            <strong>{item?.seller?.name || '—'}</strong>
          </div>
        </div>

        {source === 'cargo' ? (
          <div className="customer-refund-card__cargo">
            <div>
              <span className="customer-refund-card__label">Manba</span>
              <strong>Cargo (xorij)</strong>
            </div>
            <div>
              <span className="customer-refund-card__label">Cargo davlati</span>
              <strong>{item?.cargoCountryLabel || item?.cargoCountry || '—'}</strong>
            </div>
          </div>
        ) : source === 'seller_unavailable' ? (
          <div className="customer-refund-card__meta customer-refund-card__meta--courier">
            <div>
              <span className="customer-refund-card__label">Manba</span>
              <strong>Siller — mavjud emas</strong>
            </div>
          </div>
        ) : (
          <div className="customer-refund-card__meta customer-refund-card__meta--courier">
            <div>
              <span className="customer-refund-card__label">Kuryer</span>
              <strong>{personName(item?.courier)}</strong>
            </div>
          </div>
        )}

        {isGroup ? (
          <ul className="customer-refund-card__units">
            {units.map((unit) => {
              const variants = variantParts(unit);
              return (
                <li key={unit.id || `${unit.itemIndex}-${unit.unitIndex}`}>
                  <div className="customer-refund-card__unit-main">
                    <strong>{productTitle(unit)}</strong>
                    {unit.productCode ? (
                      <span className="customer-refund-card__unit-code">
                        {unit.productCode}
                      </span>
                    ) : null}
                    {variants.length ? (
                      <span className="customer-refund-card__unit-variants">
                        {variants.join(' · ')}
                      </span>
                    ) : null}
                  </div>
                  <strong className="customer-refund-card__unit-amount">
                    {formatRevenue(unit.amount)}
                  </strong>
                </li>
              );
            })}
          </ul>
        ) : (
          (() => {
            const variants = variantParts(item);
            return variants.length ? (
              <p className="customer-refund-card__variants">{variants.join(' · ')}</p>
            ) : null;
          })()
        )}

        <div className="customer-refund-card__meta">
          <div>
            <span className="customer-refund-card__label">
              {isGroup ? 'Jami summa' : 'Summa'}
            </span>
            <strong className="customer-refund-card__amount">
              {formatRevenue(item?.amount)}
            </strong>
          </div>
          <div>
            <span className="customer-refund-card__label">Mijoz</span>
            <strong>{personName(item?.customer)}</strong>
            <p className="customer-refund-card__phone">{item?.customer?.phone || '—'}</p>
          </div>
          <div>
            <span className="customer-refund-card__label">
              {source === 'seller_unavailable' ? 'Belgilandi' : 'Qaytarilgan'}
            </span>
            <strong>{formatDateTime(item?.returnedAt)}</strong>
          </div>
          {!isPending ? (
            <div>
              <span className="customer-refund-card__label">Mijozga qaytarilgan</span>
              <strong>{formatDateTime(item?.refundedAt)}</strong>
            </div>
          ) : null}
        </div>

        {isPending ? (
          <div className="customer-refund-card__actions">
            <button
              type="button"
              className="customer-refund-card__confirm"
              disabled={confirming}
              onClick={() => onConfirm?.(item)}
            >
              {confirming
                ? 'Saqlanmoqda...'
                : isGroup
                  ? 'Guruh uchun summa qaytarildi'
                  : 'Mijozga summa qaytarildi'}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
