import React from 'react';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatDeleteShatter from '../../MessageChatDeleteShatter/MessageChatDeleteShatter';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock/MessageChatQuotedBlock';

const BUBBLE_COLORS = {
  customer: '#9b4fe7',
  seller: '#022ff9',
};

export default function SellerUserChatProductMessage({
  product,
  message,
  isSeller,
  onPress,
  messageRef,
  isHighlighted = false,
  isDeleting = false,
  onJumpToMessage,
}) {
  if (!product) return null;
  const title = String(product.title || '').trim() || 'Mahsulot';
  const imageSrc = resolveAssetUrl(product.image);
  const shardColor = isSeller ? BUBBLE_COLORS.seller : BUBBLE_COLORS.customer;

  return (
    <button
      ref={messageRef}
      type="button"
      className={`seller-user-chat-product${
        isSeller ? ' seller-user-chat-product--seller' : ' seller-user-chat-product--customer'
      }${isHighlighted ? ' seller-user-chat-product--highlighted' : ''}${
        isDeleting ? ' seller-user-chat-product--deleting' : ''
      }`}
      onClick={() => onPress?.(message)}
      aria-label="Xabar amallari"
    >
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
      {message ? <MessageChatDeleteShatter active={isDeleting} color={shardColor} seed={message.id} /> : null}
    </button>
  );
}
