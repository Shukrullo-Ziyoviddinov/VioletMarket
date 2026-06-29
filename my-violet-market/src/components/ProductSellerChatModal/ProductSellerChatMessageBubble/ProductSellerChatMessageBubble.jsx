import React from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeImagePath } from '../../../utils/utils';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock';
import './ProductSellerChatMessageBubble.css';

export default function ProductSellerChatMessageBubble({ message, onPress }) {
  const { t } = useTranslation();
  const isCustomer = message?.sender === 'customer';
  const isImage = message?.type === 'image';
  const imageSrc = isImage ? normalizeImagePath(message.content) : '';

  return (
    <button
      type="button"
      className={`product-seller-chat-message-bubble${
        isCustomer
          ? ' product-seller-chat-message-bubble--customer'
          : ' product-seller-chat-message-bubble--seller'
      }${isImage ? ' product-seller-chat-message-bubble--image' : ''}`}
      onClick={() => onPress?.(message)}
      aria-label={t('productDetail.chat.openMessageActions')}
    >
      {message?.replyTo ? <MessageChatQuotedBlock replyTo={message.replyTo} /> : null}
      {isImage ? (
        <img
          src={imageSrc}
          alt=""
          className="product-seller-chat-message-bubble__image"
        />
      ) : (
        <p className="product-seller-chat-message-bubble__text">
          {message.content}
          {message.editedAt ? (
            <span className="product-seller-chat-message-bubble__edited">
              {' '}
              {t('productDetail.chat.edited')}
            </span>
          ) : null}
        </p>
      )}
      <MessageChatBubbleMeta message={message} viewerRole="user" />
    </button>
  );
}
