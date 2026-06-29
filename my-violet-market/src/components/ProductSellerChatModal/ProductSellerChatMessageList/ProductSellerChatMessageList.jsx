import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMessageChatJumpTo } from '../../../hooks/useMessageChatJumpTo';
import ProductSellerChatMessageBubble from '../ProductSellerChatMessageBubble/ProductSellerChatMessageBubble';
import ProductSellerChatProductMessage from '../ProductSellerChatProductMessage/ProductSellerChatProductMessage';
import './ProductSellerChatMessageList.css';

export default function ProductSellerChatMessageList({
  messages = [],
  onMessagePress,
  deletingMessageId = null,
}) {
  const { t } = useTranslation();
  const endRef = useRef(null);
  const prevLengthRef = useRef(messages.length);
  const { highlightedMessageId, registerMessageRef, jumpToMessage } = useMessageChatJumpTo();

  useEffect(() => {
    if (deletingMessageId) return;

    const grew = messages.length > prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (grew) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, deletingMessageId]);

  return (
    <div className="product-seller-chat-message-list" role="log" aria-live="polite">
      {messages.length === 0 ? (
        <p className="product-seller-chat-message-list__empty">{t('productDetail.chat.empty')}</p>
      ) : (
        messages.map((message) => {
          const isHighlighted = highlightedMessageId === message.id;
          const isDeleting = deletingMessageId === message.id;

          const rowClassName = `message-chat-message-row message-chat-message-row--${
            message.sender === 'customer' ? 'end' : 'start'
          }${isDeleting ? ' message-chat-message-row--deleting' : ''}`;

          if (message?.type === 'product') {
            return (
              <div key={message.id} ref={registerMessageRef(message.id)} className={rowClassName}>
                <ProductSellerChatProductMessage
                  product={message.content}
                  message={message}
                  isCustomer={message.sender === 'customer'}
                  onPress={onMessagePress}
                  isHighlighted={isHighlighted}
                  isDeleting={isDeleting}
                  onJumpToMessage={jumpToMessage}
                />
              </div>
            );
          }

          return (
            <div key={message.id} ref={registerMessageRef(message.id)} className={rowClassName}>
              <ProductSellerChatMessageBubble
                message={message}
                onPress={onMessagePress}
                isHighlighted={isHighlighted}
                isDeleting={isDeleting}
                onJumpToMessage={jumpToMessage}
              />
            </div>
          );
        })
      )}
      <div ref={endRef} className="product-seller-chat-message-list__anchor" />
    </div>
  );
}
