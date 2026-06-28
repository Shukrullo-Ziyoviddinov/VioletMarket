import React from 'react';
import './ProductSellerChatMessageBubble.css';

export default function ProductSellerChatMessageBubble({ message }) {
  const isCustomer = message?.sender === 'customer';
  const isImage = message?.type === 'image';

  return (
    <div
      className={`product-seller-chat-message-bubble${
        isCustomer
          ? ' product-seller-chat-message-bubble--customer'
          : ' product-seller-chat-message-bubble--seller'
      }`}
    >
      {isImage ? (
        <img
          src={message.content}
          alt=""
          className="product-seller-chat-message-bubble__image"
        />
      ) : (
        <p className="product-seller-chat-message-bubble__text">{message.content}</p>
      )}
    </div>
  );
}
