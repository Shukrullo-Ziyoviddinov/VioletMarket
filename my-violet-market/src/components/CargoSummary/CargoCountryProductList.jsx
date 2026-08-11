import React from 'react';
import { getLocalizedText, normalizeImagePath } from '../../utils/utils';
import { getCartItemKey } from '../../utils/cartItemProductId';

function getItemWeightGrams(item) {
  const raw = item?.weight;
  if (raw == null || raw === '') return null;
  const grams = Number(raw);
  if (!Number.isFinite(grams) || grams <= 0) return null;
  return Math.round(grams);
}

export default function CargoCountryProductList({ items, lang, onProductClick }) {
  if (!items?.length) return null;

  return (
    <div className="cargo-country-products">
      {items.map((item, index) => {
        const title = getLocalizedText(item.title, lang);
        const weightGrams = getItemWeightGrams(item);
        return (
          <button
            key={getCartItemKey(item) || index}
            type="button"
            className="cargo-country-product"
            onClick={() => onProductClick?.(item)}
          >
            <img
              src={normalizeImagePath(item.image || '/img/no-image.png')}
              alt={title}
              className="cargo-country-product__img"
            />
            <div className="cargo-country-product__info">
              <span className="cargo-country-product__title">{title}</span>
              {weightGrams != null && (
                <span className="cargo-country-product__weight">{weightGrams}g</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
