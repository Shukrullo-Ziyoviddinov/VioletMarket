import React from 'react';
import ProductSellerChatProductPreview from '../ProductSellerChatProductPreview/ProductSellerChatProductPreview';
import './ProductSellerChatProductMessage.css';

export default function ProductSellerChatProductMessage({ product, isCustomer = false }) {
  if (!product) return null;

  return (
    <div
      className={`product-seller-chat-product-message${
        isCustomer ? ' product-seller-chat-product-message--customer' : ' product-seller-chat-product-message--seller'
      }`}
    >
      <ProductSellerChatProductPreview product={product} compact />
    </div>
  );
}
