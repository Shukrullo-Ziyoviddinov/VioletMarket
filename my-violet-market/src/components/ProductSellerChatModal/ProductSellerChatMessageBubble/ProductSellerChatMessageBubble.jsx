import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeImagePath } from '../../../utils/utils';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatDeleteShatter from '../../MessageChatDeleteShatter';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock';
import './ProductSellerChatMessageBubble.css';

export default function ProductSellerChatMessageBubble({
  message,
  onPress,
  onImagePress,
  isHighlighted = false,
  isDeleting = false,
  onJumpToMessage,
}) {
  const { t } = useTranslation();
  const bubbleRef = useRef(null);
  const isCustomer = message?.sender === 'customer';
  const isImage = message?.type === 'image';
  const imageSrc = isImage ? normalizeImagePath(message.content) : '';

  const surface = (
    <>
      {message?.replyTo ? (
        <MessageChatQuotedBlock replyTo={message.replyTo} onJumpToMessage={onJumpToMessage} />
      ) : null}
      {isImage ? (
        <img
          src={imageSrc}
          alt=""
          className="product-seller-chat-message-bubble__image"
          onClick={(event) => {
            event.stopPropagation();
            onImagePress?.(imageSrc);
          }}
        />
      ) : (
        <p className="product-seller-chat-message-bubble__text">{message.content}</p>
      )}
      <MessageChatBubbleMeta message={message} viewerRole="user" />
    </>
  );

  return (
    <button
      ref={bubbleRef}
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
      <div className={`message-chat-bubble-surface${isDeleting ? ' message-chat-bubble-surface--hidden' : ''}`}>
        {surface}
      </div>
      {isDeleting ? (
        <MessageChatDeleteShatter active={isDeleting} seed={message?.id} containerRef={bubbleRef}>
          <div className="message-chat-bubble-surface">{surface}</div>
        </MessageChatDeleteShatter>
      ) : null}
    </button>
  );
}
