import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProductSellerChatMessageBubble from '../ProductSellerChatMessageBubble/ProductSellerChatMessageBubble';
import ProductSellerChatProductMessage from '../ProductSellerChatProductMessage/ProductSellerChatProductMessage';
import MessageChatSendStatus from '../../MessageChatSendStatus';
import './ProductSellerChatMessageList.css';

export default function ProductSellerChatMessageList({ messages = [], isSending = false }) {
  const { t } = useTranslation();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  return (
    <div className="product-seller-chat-message-list" role="log" aria-live="polite">
      {messages.length === 0 ? (
        <p className="product-seller-chat-message-list__empty">{t('productDetail.chat.empty')}</p>
      ) : (
        messages.map((message) => {
          if (message?.type === 'product') {
            return (
              <ProductSellerChatProductMessage
                key={message.id}
                product={message.content}
                isCustomer={message.sender === 'customer'}
              />
            );
          }

          return <ProductSellerChatMessageBubble key={message.id} message={message} />;
        })
      )}
      <MessageChatSendStatus active={isSending} />
      <div ref={endRef} className="product-seller-chat-message-list__anchor" />
    </div>
  );
}
