import React from 'react';
import { useTranslation } from 'react-i18next';
import ProductSellerChatProductPreview from '../ProductSellerChatProductPreview/ProductSellerChatProductPreview';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatDeleteShatter from '../../MessageChatDeleteShatter';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock';
import './ProductSellerChatProductMessage.css';

const BUBBLE_COLORS = {
  customer: '#022ff9',
  seller: '#9b4fe7',
};

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
  if (!product) return null;

  const shardColor = isCustomer ? BUBBLE_COLORS.customer : BUBBLE_COLORS.seller;

  return (
    <button
      type="button"
      className={`product-seller-chat-product-message${
        isCustomer ? ' product-seller-chat-product-message--customer' : ' product-seller-chat-product-message--seller'
      }${isHighlighted ? ' product-seller-chat-product-message--highlighted' : ''}${
        isDeleting ? ' product-seller-chat-product-message--deleting' : ''
      }`}
      onClick={() => onPress?.(message)}
      aria-label={t('productDetail.chat.openMessageActions')}
    >
      {message?.replyTo ? (
        <MessageChatQuotedBlock replyTo={message.replyTo} onJumpToMessage={onJumpToMessage} />
      ) : null}
      <ProductSellerChatProductPreview product={product} compact />
      {message ? <MessageChatBubbleMeta message={message} viewerRole="user" /> : null}
      {message ? <MessageChatDeleteShatter active={isDeleting} color={shardColor} seed={message.id} /> : null}
    </button>
  );
}
