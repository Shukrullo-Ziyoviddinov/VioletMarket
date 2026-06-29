import React, { useRef } from 'react';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';
import MessageChatDeleteShatter from '../../MessageChatDeleteShatter/MessageChatDeleteShatter';
import MessageChatQuotedBlock from '../MessageChatQuotedBlock/MessageChatQuotedBlock';

export default function SellerUserChatMessageBubble({
  message,
  onPress,
  isHighlighted = false,
  isDeleting = false,
  onJumpToMessage,
}) {
  const bubbleRef = useRef(null);
  const isSeller = message?.sender === 'seller';
  const isImage = message?.type === 'image';
  const imageSrc = isImage ? resolveAssetUrl(message.content) : '';

  const surface = (
    <>
      {message?.replyTo ? (
        <MessageChatQuotedBlock replyTo={message.replyTo} onJumpToMessage={onJumpToMessage} />
      ) : null}
      {isImage ? (
        <img src={imageSrc} alt="" className="seller-user-chat-bubble__image" />
      ) : (
        <p className="seller-user-chat-bubble__text">{message.content}</p>
      )}
      <MessageChatBubbleMeta message={message} viewerRole="seller" />
    </>
  );

  return (
    <button
      ref={bubbleRef}
      type="button"
      className={`seller-user-chat-bubble${
        isSeller ? ' seller-user-chat-bubble--seller' : ' seller-user-chat-bubble--customer'
      }${isImage ? ' seller-user-chat-bubble--image' : ''}${
        isHighlighted ? ' seller-user-chat-bubble--highlighted' : ''
      }${isDeleting ? ' seller-user-chat-bubble--deleting' : ''}`}
      onClick={() => onPress?.(message)}
      aria-label="Xabar amallari"
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
