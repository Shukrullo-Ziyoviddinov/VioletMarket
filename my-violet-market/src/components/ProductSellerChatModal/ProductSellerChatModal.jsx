import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getPortalContainer } from '../../utils/utils';
import ProductSellerChatModalHeader from './ProductSellerChatModalHeader/ProductSellerChatModalHeader';
import ProductSellerChatMessageList from './ProductSellerChatMessageList/ProductSellerChatMessageList';
import ProductSellerChatComposer from './ProductSellerChatComposer/ProductSellerChatComposer';
import './ProductSellerChatModal.css';

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ProductSellerChatModal({
  open = false,
  seller = null,
  lang = 'uz',
  messages = [],
  onClose,
  onSendMessage,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !seller) return null;

  const handleSendText = (text) => {
    onSendMessage?.({
      id: createMessageId(),
      sender: 'customer',
      type: 'text',
      content: text,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSendImage = (previewUrl) => {
    onSendMessage?.({
      id: createMessageId(),
      sender: 'customer',
      type: 'image',
      content: previewUrl,
      createdAt: new Date().toISOString(),
    });
  };

  return createPortal(
    <div className="product-seller-chat-modal" role="presentation">
      <button
        type="button"
        className="product-seller-chat-modal__backdrop"
        aria-label={t('productDetail.chat.close')}
        onClick={onClose}
      />

      <div
        className="product-seller-chat-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('productDetail.chat.title')}
      >
        <ProductSellerChatModalHeader seller={seller} lang={lang} onBack={onClose} />
        <ProductSellerChatMessageList messages={messages} />
        <ProductSellerChatComposer onSendText={handleSendText} onSendImage={handleSendImage} />
      </div>
    </div>,
    getPortalContainer(),
  );
}
