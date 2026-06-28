import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import SellerChatModalHeader from './SellerChatModalHeader/SellerChatModalHeader';
import SellerChatMessageList from './SellerChatMessageList/SellerChatMessageList';
import SellerChatComposer from './SellerChatComposer/SellerChatComposer';
import './SellerChatModal.css';

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SellerChatModal({
  open = false,
  thread = null,
  messages = [],
  onClose,
  onSendText,
  onSendImage,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !thread) return null;

  const handleSendText = (text) => {
    onSendText?.({
      id: createMessageId(),
      sender: 'seller',
      type: 'text',
      content: text,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSendImage = (previewUrl) => {
    onSendImage?.({
      id: createMessageId(),
      sender: 'seller',
      type: 'image',
      content: previewUrl,
      createdAt: new Date().toISOString(),
    });
  };

  return createPortal(
    <div className="seller-chat-modal" role="presentation">
      <button
        type="button"
        className="seller-chat-modal__backdrop"
        aria-label="Yopish"
        onClick={onClose}
      />

      <div className="seller-chat-modal__panel" role="dialog" aria-modal="true" aria-label="Chat">
        <SellerChatModalHeader
          participantName={thread.customerName}
          participantAvatar={thread.customerAvatar}
          onBack={onClose}
        />

        <SellerChatMessageList messages={messages} />

        <SellerChatComposer onSendText={handleSendText} onSendImage={handleSendImage} />
      </div>
    </div>,
    document.body,
  );
}
