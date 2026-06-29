import React from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeImagePath } from '../../../utils/utils';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatDeleteShatter from '../../MessageChatDeleteShatter';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock';
import './ProductSellerChatMessageBubble.css';

const BUBBLE_COLORS = {
  customer: '#022ff9',
  seller: '#9b4fe7',
};

export default function ProductSellerChatMessageBubble({
  message,
  onPress,
  isHighlighted = false,
  isDeleting = false,
  onJumpToMessage,
}) {
  const { t } = useTranslation();
  const isCustomer = message?.sender === 'customer';
  const isImage = message?.type === 'image';
  const imageSrc = isImage ? normalizeImagePath(message.content) : '';
  const shardColor = isCustomer ? BUBBLE_COLORS.customer : BUBBLE_COLORS.seller;

  return (
    <button
      type="button"
      className={`product-seller-chat-message-bubble${
        isCustomer
          ? ' product-seller-chat-message-bubble--customer'
          : ' product-seller-chat-message-bubble--seller'
      }${isImage ? ' product-seller-chat-message-bubble--image' : ''}${
        isHighlighted ? ' product-seller-chat-message-bubble--highlighted' : ''
      }${isDeleting ? ' product-seller-chat-message-bubble--deleting' : ''}`}
      onClick={() => onPress?.(message)}
      aria-label={t('productDetail.chat.openMessageActions')}
    >
      {message?.replyTo ? (
        <MessageChatQuotedBlock replyTo={message.replyTo} onJumpToMessage={onJumpToMessage} />
      ) : null}
      {isImage ? (
        <img
          src={imageSrc}
          alt=""
          className="product-seller-chat-message-bubble__image"
        />
      ) : (
        <p className="product-seller-chat-message-bubble__text">{message.content}</p>
      )}
      <MessageChatBubbleMeta message={message} viewerRole="user" />
      <MessageChatDeleteShatter active={isDeleting} color={shardColor} seed={message?.id} />
    </button>
  );
}
