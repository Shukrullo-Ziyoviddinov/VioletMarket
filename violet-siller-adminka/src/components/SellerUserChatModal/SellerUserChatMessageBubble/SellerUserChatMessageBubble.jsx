import React from 'react';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock/MessageChatQuotedBlock';

export default function SellerUserChatMessageBubble({
  message,
  onPress,
  messageRef,
  isHighlighted = false,
  onJumpToMessage,
}) {
  const isSeller = message?.sender === 'seller';
  const isImage = message?.type === 'image';
  const imageSrc = isImage ? resolveAssetUrl(message.content) : '';

  return (
    <button
      ref={messageRef}
      type="button"
      className={`seller-user-chat-bubble${
        isSeller ? ' seller-user-chat-bubble--seller' : ' seller-user-chat-bubble--customer'
      }${isImage ? ' seller-user-chat-bubble--image' : ''}${
        isHighlighted ? ' seller-user-chat-bubble--highlighted' : ''
      }`}
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
    </button>
  );
}
