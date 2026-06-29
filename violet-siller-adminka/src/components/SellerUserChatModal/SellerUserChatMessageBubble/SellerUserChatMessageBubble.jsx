import React from 'react';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';

export default function SellerUserChatMessageBubble({ message, viewerRole = 'seller' }) {
  const isSeller = message?.sender === 'seller';
  const isImage = message?.type === 'image';
  const imageSrc = isImage ? resolveAssetUrl(message.content) : '';

  return (
    <div
      className={`seller-user-chat-bubble${
        isSeller ? ' seller-user-chat-bubble--seller' : ' seller-user-chat-bubble--customer'
      }${isImage ? ' seller-user-chat-bubble--image' : ''}`}
    >
      {isImage ? (
        <img src={imageSrc} alt="" className="seller-user-chat-bubble__image" />
      ) : (
        <p className="seller-user-chat-bubble__text">{message.content}</p>
      )}
      <MessageChatBubbleMeta message={message} viewerRole={viewerRole} />
    </div>
  );
}
