import React from 'react';
import { useTranslation } from 'react-i18next';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import {
  formatSellerOrderAmount,
  getSellerOrderProductTitle,
} from '../../../utils/sellerOrdersDisplay';
import { resolveSellerCargoPackages } from '../../../utils/sellerOrderGroups';
import './SellerOrderGroupItems.css';

function optionValue(value) {
  const text = String(value || '').trim();
  return text || '—';
}

function resolveItems(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length) return items;
  return order ? [order] : [];
}

function unitKey(itemIndex, unitIndex) {
  return `${Number(itemIndex) || 0}:${Number(unitIndex) || 0}`;
}

function ProductCard({
  item,
  index,
  t,
  lang,
  selectable,
  selectedSet,
  onToggleUnit,
}) {
  const title = getSellerOrderProductTitle(item, lang);
  const imageUrl = resolveAssetUrl(item.imageUrl);
  const itemIndex = Number(item.itemIndex);
  const resolvedIndex = Number.isInteger(itemIndex) ? itemIndex : index;
  const unitIndex = Number(item.unitIndex) || 0;
  const selected =
    selectable && selectedSet.has(unitKey(resolvedIndex, unitIndex));

  return (
    <article
      className={`seller-order-group-items__card${
        selected ? ' seller-order-group-items__card--selected' : ''
      }`}
    >
      <div className="seller-order-group-items__product">
        {selectable ? (
          <button
            type="button"
            className={`seller-order-group-items__check${
              selected ? ' seller-order-group-items__check--on' : ''
            }`}
            aria-pressed={selected}
            aria-label={title}
            onClick={() => onToggleUnit?.(resolvedIndex, unitIndex)}
          />
        ) : null}
        <div className="seller-order-group-items__image">
          {imageUrl ? <img src={imageUrl} alt={title} /> : <span>—</span>}
        </div>
        <div className="seller-order-group-items__text">
          <strong title={title}>{title}</strong>
          <p>{item.productCode || '—'}</p>
          <p className="seller-order-group-items__price">
            {formatSellerOrderAmount(item.amount)}
          </p>
        </div>
      </div>

      <div className="seller-order-group-items__meta">
        <div className="seller-order-group-items__row">
          <span>{t('orders.modal.color')}</span>
          <strong>{optionValue(item.color)}</strong>
        </div>
        <div className="seller-order-group-items__row">
          <span>{t('orders.modal.size')}</span>
          <strong>{optionValue(item.size)}</strong>
        </div>
        <div className="seller-order-group-items__row">
          <span>{t('orders.modal.storage')}</span>
          <strong>{optionValue(item.storage)}</strong>
        </div>
        <div className="seller-order-group-items__row">
          <span>{t('orders.modal.model')}</span>
          <strong>{optionValue(item.model)}</strong>
        </div>
      </div>
    </article>
  );
}

function PackageSection({
  pkg,
  t,
  lang,
  selectable,
  selectedSet,
  onToggleUnit,
}) {
  const label =
    pkg.type === 'express'
      ? t('orders.cargoPackage.express', { defaultValue: 'Express paket' })
      : t('orders.cargoPackage.standard', { defaultValue: 'Standard paket' });

  return (
    <section
      className={`seller-order-group-items__package seller-order-group-items__package--${pkg.type}`}
    >
      <header className="seller-order-group-items__package-head">
        <div>
          <strong>{label}</strong>
          <p>
            {t('orders.card.barcode')}: {pkg.packageCode}
          </p>
        </div>
        <span>
          {t('orders.card.productCount', {
            count: pkg.productCount,
            defaultValue: '{{count}} ta mahsulot',
          })}
        </span>
      </header>
      {pkg.items.map((item, index) => (
        <ProductCard
          key={item.id || `${pkg.type}-${index}`}
          item={item}
          index={index}
          t={t}
          lang={lang}
          selectable={selectable}
          selectedSet={selectedSet}
          onToggleUnit={onToggleUnit}
        />
      ))}
    </section>
  );
}

export default function SellerOrderGroupItems({
  order,
  showWhenSingle = false,
  selectable = false,
  selectedUnits = [],
  onToggleUnit,
}) {
  const { t, i18n } = useTranslation();
  const items = resolveItems(order);
  const isGroup = items.length > 1 || Boolean(order?.isGroup);
  const packages = resolveSellerCargoPackages(order);
  const selectedSet = new Set(
    (Array.isArray(selectedUnits) ? selectedUnits : []).map((row) =>
      unitKey(row.itemIndex, row.unitIndex),
    ),
  );

  if (!items.length) return null;
  if (!isGroup && !showWhenSingle && !packages) return null;

  return (
    <div className="seller-order-group-items">
      {packages && packages.length > 1 ? (
        <p className="seller-order-group-items__hint">
          {t('orders.cargoPackage.splitHint', {
            defaultValue:
              'Express va Standard ni alohida paket qiling — bir paketga qo‘shmang.',
          })}
        </p>
      ) : null}
      {selectable && isGroup ? (
        <p className="seller-order-group-items__hint">
          {t('orders.modal.selectUnavailableHint', {
            defaultValue:
              '«Mavjud emas» uchun donalarni tanlang (bir nechtasini mumkin)',
          })}
        </p>
      ) : null}
      {packages
        ? packages.map((pkg) => (
            <PackageSection
              key={pkg.type}
              pkg={pkg}
              t={t}
              lang={i18n.language}
              selectable={selectable}
              selectedSet={selectedSet}
              onToggleUnit={onToggleUnit}
            />
          ))
        : items.map((item, index) => (
            <ProductCard
              key={item.id || `${index}`}
              item={item}
              index={index}
              t={t}
              lang={i18n.language}
              selectable={selectable}
              selectedSet={selectedSet}
              onToggleUnit={onToggleUnit}
            />
          ))}
    </div>
  );
}
