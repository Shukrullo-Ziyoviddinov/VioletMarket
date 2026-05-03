import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedText } from '../../utils/utils';
import './CheckoutProductRow.css';

const CheckoutProductRow = ({ item, lang }) => {
  const title = getLocalizedText(item.title, lang);
  const typeParts = [item.color, item.size, item.storage, item.model].filter(Boolean);
  const productType = typeParts.length ? typeParts.join(', ') : null;

  return (
    <div className="checkout-product-row">
      {item.image && <img src={item.image} alt={title} className="checkout-product-row__img" />}
      <div className="checkout-product-row__info">
        <div className="checkout-product-row__title">{title}</div>
        {productType && <div className="checkout-product-row__meta">{productType}</div>}
      </div>
    </div>
  );
};

export default CheckoutProductRow;
