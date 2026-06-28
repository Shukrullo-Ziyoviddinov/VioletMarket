import React from 'react';
import { normalizeImagePath } from '../../../utils/utils';
import './ProductSellerChatMessageBubble.css';

export default function ProductSellerChatMessageBubble({ message }) {
  const isCustomer = message?.sender === 'customer';
  const isImage = message?.type === 'image';
  const imageSrc = isImage ? normalizeImagePath(message.content) : '';

  return (
    <div
      className={`product-seller-chat-message-bubble${
        isCustomer
          ? ' product-seller-chat-message-bubble--customer'
          : ' product-seller-chat-message-bubble--seller'
      }${isImage ? ' product-seller-chat-message-bubble--image' : ''}`}
    >
      {isImage ? (
        <img
          src={imageSrc}
          alt=""
          className="product-seller-chat-message-bubble__image"
        />
      ) : (
        <p className="product-seller-chat-message-bubble__text">{message.content}</p>
      )}
    </div>
  );
}
