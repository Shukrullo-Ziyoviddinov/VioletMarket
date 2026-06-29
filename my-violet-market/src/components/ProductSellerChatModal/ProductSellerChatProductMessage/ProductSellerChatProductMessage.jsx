import React from 'react';
import ProductSellerChatProductPreview from '../ProductSellerChatProductPreview/ProductSellerChatProductPreview';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import './ProductSellerChatProductMessage.css';

export default function ProductSellerChatProductMessage({
  product,
  message = null,
  isCustomer = false,
  viewerRole = 'user',
}) {
  if (!product) return null;

  return (
    <div
      className={`product-seller-chat-product-message${
        isCustomer ? ' product-seller-chat-product-message--customer' : ' product-seller-chat-product-message--seller'
      }`}
    >
      <ProductSellerChatProductPreview product={product} compact />
      {message ? <MessageChatBubbleMeta message={message} viewerRole={viewerRole} /> : null}
    </div>
  );
}
