import React from 'react';
import { resolveProductImageUrl } from '../../../utils/productDisplay';
import {
  formatAdminOrderAmount,
  getAdminOrderProductTitle,
} from '../../../utils/adminOrdersDisplay';
import './AdminOrderGroupItems.css';

function optionValue(value) {
  const text = String(value || '').trim();
  return text || '—';
}

function resolveItems(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length) return items;
  return order ? [order] : [];
}

export default function AdminOrderGroupItems({
  order,
  showWhenSingle = false,
  selectable = false,
  selectedItemIndex = null,
  onSelectItemIndex,
}) {
  const items = resolveItems(order);
  const isGroup = items.length > 1 || Boolean(order?.isGroup);

  if (!items.length) return null;
  if (!isGroup && !showWhenSingle) return null;

  return (
    <div className="admin-order-group-items">
      {selectable && isGroup ? (
        <p className="admin-order-group-items__hint">
          «Mavjud emas» uchun mahsulotni tanlang
        </p>
      ) : null}
      {items.map((item, index) => {
        const title = getAdminOrderProductTitle(item);
        const imageUrl = resolveProductImageUrl(item.imageUrl);
        const itemIndex = Number(item.itemIndex);
        const resolvedIndex = Number.isInteger(itemIndex) ? itemIndex : index;
        const key = item.id || `${resolvedIndex}-${item.unitIndex}-${index}`;
        const selected = selectable && selectedItemIndex === resolvedIndex;

        return (
          <article
            key={key}
            className={`admin-order-group-items__card${
              selected ? ' admin-order-group-items__card--selected' : ''
            }`}
          >
            <div className="admin-order-group-items__product">
              {selectable ? (
                <label className="admin-order-group-items__radio">
                  <input
                    type="radio"
                    name="admin-unavailable-item"
                    checked={selected}
                    onChange={() => {
                      /* controlled; toggle onClick da */
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      onSelectItemIndex?.(selected ? null : resolvedIndex);
                    }}
                  />
                </label>
              ) : null}
              <div className="admin-order-group-items__image">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    onError={(event) => {
                      event.currentTarget.src = resolveProductImageUrl('');
                    }}
                  />
                ) : (
                  <span>—</span>
                )}
              </div>
              <div className="admin-order-group-items__text">
                <strong title={title}>{title}</strong>
                <p>{item.productCode || '—'}</p>
                <p className="admin-order-group-items__price">
                  {formatAdminOrderAmount(item.amount)}
                </p>
              </div>
            </div>

            <div className="admin-order-group-items__meta">
              <div className="admin-order-group-items__row">
                <span>Rang</span>
                <strong>{optionValue(item.color)}</strong>
              </div>
              <div className="admin-order-group-items__row">
                <span>O‘lcham</span>
                <strong>{optionValue(item.size)}</strong>
              </div>
              <div className="admin-order-group-items__row">
                <span>Xotira</span>
                <strong>{optionValue(item.storage)}</strong>
              </div>
              <div className="admin-order-group-items__row">
                <span>Model</span>
                <strong>{optionValue(item.model)}</strong>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
