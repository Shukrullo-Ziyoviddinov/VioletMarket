import React from 'react';
import { resolveAssetUrl } from '../../../utils/mediaUrl';
import MessageChatBubbleMeta from '../../MessageChatBubbleMeta';

export default function SellerUserChatProductMessage({ product, message, isSeller }) {
  if (!product) return null;
  const title = String(product.title || '').trim() || 'Mahsulot';
  const imageSrc = resolveAssetUrl(product.image);

  return (
    <div
      className={`seller-user-chat-product${
        isSeller ? ' seller-user-chat-product--seller' : ' seller-user-chat-product--customer'
      }`}
    >
      <div className="seller-user-chat-product__body">
        <img src={imageSrc} alt="" className="seller-user-chat-product__image" />
        <div className="seller-user-chat-product__info">
          <p className="seller-user-chat-product__title">{title}</p>
          {product.price ? <span className="seller-user-chat-product__price">{product.price}</span> : null}
        </div>
      </div>
      {message ? <MessageChatBubbleMeta message={message} viewerRole="seller" /> : null}
    </div>
  );
}
