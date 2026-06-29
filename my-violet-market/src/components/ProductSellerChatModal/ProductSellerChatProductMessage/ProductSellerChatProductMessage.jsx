import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProductSellerChatProductPreview from '../ProductSellerChatProductPreview/ProductSellerChatProductPreview';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatDeleteShatter from '../../MessageChatDeleteShatter';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock';
import './ProductSellerChatProductMessage.css';

export default function ProductSellerChatProductMessage({
  product,
  message = null,
  isCustomer = false,
  onPress,
  isHighlighted = false,
  isDeleting = false,
  onJumpToMessage,
}) {
  const { t } = useTranslation();
  const bubbleRef = useRef(null);
  if (!product) return null;

  const surface = (
    <>
      {message?.replyTo ? (
        <MessageChatQuotedBlock replyTo={message.replyTo} onJumpToMessage={onJumpToMessage} />
      ) : null}
      <ProductSellerChatProductPreview product={product} compact />
      {message ? <MessageChatBubbleMeta message={message} viewerRole="user" /> : null}
    </>
  );

  return (
    <button
      ref={bubbleRef}
      type="button"
      className={`product-seller-chat-product-message${
        isCustomer ? ' product-seller-chat-product-message--customer' : ' product-seller-chat-product-message--seller'
      }${isHighlighted ? ' product-seller-chat-product-message--highlighted' : ''}${
        isDeleting ? ' product-seller-chat-product-message--deleting' : ''
      }`}
      onClick={() => onPress?.(message)}
      aria-label={t('productDetail.chat.openMessageActions')}
    >
      <div className={`message-chat-bubble-surface${isDeleting ? ' message-chat-bubble-surface--hidden' : ''}`}>
        {surface}
      </div>
      {isDeleting && message ? (
        <MessageChatDeleteShatter active={isDeleting} seed={message.id} containerRef={bubbleRef}>
          <div className="message-chat-bubble-surface">{surface}</div>
        </MessageChatDeleteShatter>
      ) : null}
    </button>
  );
}
