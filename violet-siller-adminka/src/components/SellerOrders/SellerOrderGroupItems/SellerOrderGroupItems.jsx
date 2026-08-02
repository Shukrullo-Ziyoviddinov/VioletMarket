import React from 'react';
import { useTranslation } from 'react-i18next';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import {
  formatSellerOrderAmount,
  getSellerOrderProductTitle,
} from '../../../utils/sellerOrdersDisplay';
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

export default function SellerOrderGroupItems({
  order,
  showWhenSingle = false,
  selectable = false,
  selectedItemIndex = null,
  onSelectItemIndex,
}) {
  const { t, i18n } = useTranslation();
  const items = resolveItems(order);
  const isGroup = items.length > 1 || Boolean(order?.isGroup);

  if (!items.length) return null;
  if (!isGroup && !showWhenSingle) return null;

  return (
    <div className="seller-order-group-items">
      {selectable && isGroup ? (
        <p className="seller-order-group-items__hint">
          {t('orders.modal.selectUnavailableHint', {
            defaultValue: '«Mavjud emas» uchun mahsulotni tanlang',
          })}
        </p>
      ) : null}
      {items.map((item, index) => {
        const title = getSellerOrderProductTitle(item, i18n.language);
        const imageUrl = resolveAssetUrl(item.imageUrl);
        const itemIndex = Number(item.itemIndex);
        const resolvedIndex = Number.isInteger(itemIndex) ? itemIndex : index;
        const key = item.id || `${resolvedIndex}-${item.unitIndex}-${index}`;
        const selected = selectable && selectedItemIndex === resolvedIndex;

        return (
          <article
            key={key}
            className={`seller-order-group-items__card${
              selected ? ' seller-order-group-items__card--selected' : ''
            }`}
          >
            <div className="seller-order-group-items__product">
              {selectable ? (
                <label className="seller-order-group-items__radio">
                  <input
                    type="radio"
                    name="seller-unavailable-item"
                    checked={selected}
                    onChange={() => onSelectItemIndex?.(resolvedIndex)}
                  />
                </label>
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
      })}
    </div>
  );
}
