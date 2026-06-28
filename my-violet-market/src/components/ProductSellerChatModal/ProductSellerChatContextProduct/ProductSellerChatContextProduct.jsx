import React from 'react';
import { useTranslation } from 'react-i18next';
import ProductSellerChatProductPreview from '../ProductSellerChatProductPreview/ProductSellerChatProductPreview';
import './ProductSellerChatContextProduct.css';

export default function ProductSellerChatContextProduct({ product, onSend }) {
  const { t } = useTranslation();

  if (!product) return null;

  return (
    <div className="product-seller-chat-context-product">
      <ProductSellerChatProductPreview product={product} />

      <button
        type="button"
        className="product-seller-chat-context-product__send"
        onClick={() => onSend?.(product)}
        aria-label={t('productDetail.chat.sendProduct')}
      >
        <i className="bx bx-send" aria-hidden="true" />
      </button>
    </div>
  );
}
