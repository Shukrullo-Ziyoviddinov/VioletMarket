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
  const { highlightedMessageId, registerMessageRef, jumpToMessage } = useMessageChatJumpTo();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="product-seller-chat-message-list" role="log" aria-live="polite">
      {messages.length === 0 ? (
        <p className="product-seller-chat-message-list__empty">{t('productDetail.chat.empty')}</p>
      ) : (
        messages.map((message) => {
          const isHighlighted = highlightedMessageId === message.id;
          const isDeleting = deletingMessageId === message.id;

          if (message?.type === 'product') {
            return (
              <ProductSellerChatProductMessage
                key={message.id}
                product={message.content}
                message={message}
                isCustomer={message.sender === 'customer'}
                onPress={onMessagePress}
                messageRef={registerMessageRef(message.id)}
                isHighlighted={isHighlighted}
                isDeleting={isDeleting}
                onJumpToMessage={jumpToMessage}
              />
            );
          }

          return (
            <ProductSellerChatMessageBubble
              key={message.id}
              message={message}
              onPress={onMessagePress}
              messageRef={registerMessageRef(message.id)}
              isHighlighted={isHighlighted}
              isDeleting={isDeleting}
              onJumpToMessage={jumpToMessage}
            />
          );
        })
      )}
      <div ref={endRef} className="product-seller-chat-message-list__anchor" />
    </div>
  );
}
