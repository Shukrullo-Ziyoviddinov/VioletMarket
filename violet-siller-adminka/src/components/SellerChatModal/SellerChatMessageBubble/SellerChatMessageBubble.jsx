import React from 'react';
import './SellerChatMessageBubble.css';

export default function SellerChatMessageBubble({ message }) {
  const isSeller = message?.sender === 'seller';
  const isImage = message?.type === 'image';

  return (
    <div
      className={`seller-chat-message-bubble${
        isSeller ? ' seller-chat-message-bubble--seller' : ' seller-chat-message-bubble--customer'
      }`}
    >
      {isImage ? (
        <img
          src={message.content}
          alt="Yuborilgan rasm"
          className="seller-chat-message-bubble__image"
        />
      ) : (
        <p className="seller-chat-message-bubble__text">{message.content}</p>
      )}
    </div>
  );
}
