import React, { useRef } from 'react';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatDeleteShatter from '../../MessageChatDeleteShatter/MessageChatDeleteShatter';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock/MessageChatQuotedBlock';

export default function SellerUserChatProductMessage({
  product,
  message,
  isSeller,
  onPress,
  isHighlighted = false,
  isDeleting = false,
  onJumpToMessage,
}) {
  const bubbleRef = useRef(null);
  if (!product) return null;
  const title = String(product.title || '').trim() || 'Mahsulot';
  const imageSrc = resolveAssetUrl(product.image);

  const surface = (
    <>
      {message?.replyTo ? (
        <MessageChatQuotedBlock replyTo={message.replyTo} onJumpToMessage={onJumpToMessage} />
      ) : null}
      <div className="seller-user-chat-product__body">
        <img src={imageSrc} alt="" className="seller-user-chat-product__image" />
        <div className="seller-user-chat-product__info">
          <p className="seller-user-chat-product__title">{title}</p>
          {product.price ? <span className="seller-user-chat-product__price">{product.price}</span> : null}
        </div>
      </div>
      {message ? <MessageChatBubbleMeta message={message} viewerRole="seller" /> : null}
    </>
  );

  return (
    <button
      ref={bubbleRef}
      type="button"
      className={`seller-user-chat-product${
        isSeller ? ' seller-user-chat-product--seller' : ' seller-user-chat-product--customer'
      }${isHighlighted ? ' seller-user-chat-product--highlighted' : ''}${
        isDeleting ? ' seller-user-chat-product--deleting' : ''
      }`}
      onClick={() => onPress?.(message)}
      aria-label="Xabar amallari"
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
