import React from 'react';
import { useTranslation } from 'react-i18next';
import ProductSellerChatProductPreview from '../ProductSellerChatProductPreview/ProductSellerChatProductPreview';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock';
import './ProductSellerChatProductMessage.css';

export default function ProductSellerChatProductMessage({
  product,
  message = null,
  isCustomer = false,
  onPress,
  messageRef,
  isHighlighted = false,
  onJumpToMessage,
}) {
  const { t } = useTranslation();
  if (!product) return null;

  return (
    <button
      ref={messageRef}
      type="button"
      className={`product-seller-chat-product-message${
        isCustomer ? ' product-seller-chat-product-message--customer' : ' product-seller-chat-product-message--seller'
      }${isHighlighted ? ' product-seller-chat-product-message--highlighted' : ''}`}
      onClick={() => onPress?.(message)}
      aria-label={t('productDetail.chat.openMessageActions')}
    >
      {message?.replyTo ? (
        <MessageChatQuotedBlock replyTo={message.replyTo} onJumpToMessage={onJumpToMessage} />
      ) : null}
      <ProductSellerChatProductPreview product={product} compact />
      {message ? <MessageChatBubbleMeta message={message} viewerRole="user" /> : null}
    </button>
  );
}
