import React from 'react';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatDeleteShatter from '../../MessageChatDeleteShatter/MessageChatDeleteShatter';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock/MessageChatQuotedBlock';

const BUBBLE_COLORS = {
  customer: '#9b4fe7',
  seller: '#022ff9',
};

export default function SellerUserChatMessageBubble({
  message,
  onPress,
  messageRef,
  isHighlighted = false,
  isDeleting = false,
  onJumpToMessage,
}) {
  const isSeller = message?.sender === 'seller';
  const isImage = message?.type === 'image';
  const imageSrc = isImage ? resolveAssetUrl(message.content) : '';
  const shardColor = isSeller ? BUBBLE_COLORS.seller : BUBBLE_COLORS.customer;

  return (
    <button
      ref={messageRef}
      type="button"
      className={`seller-user-chat-bubble${
        isSeller ? ' seller-user-chat-bubble--seller' : ' seller-user-chat-bubble--customer'
      }${isImage ? ' seller-user-chat-bubble--image' : ''}${
        isHighlighted ? ' seller-user-chat-bubble--highlighted' : ''
      }${isDeleting ? ' seller-user-chat-bubble--deleting' : ''}`}
      onClick={() => onPress?.(message)}
      aria-label="Xabar amallari"
    >
      {message?.replyTo ? (
        <MessageChatQuotedBlock replyTo={message.replyTo} onJumpToMessage={onJumpToMessage} />
      ) : null}
      {isImage ? (
        <img src={imageSrc} alt="" className="seller-user-chat-bubble__image" />
      ) : (
        <p className="seller-user-chat-bubble__text">{message.content}</p>
      )}
      <MessageChatBubbleMeta message={message} viewerRole="seller" />
      <MessageChatDeleteShatter active={isDeleting} color={shardColor} seed={message?.id} />
    </button>
  );
}
