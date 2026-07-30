import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getPortalContainer } from '../../utils/utils';
import { buildReplyToPayload } from '../../utils/messageChatReplyUtils';
import { waitMessageChatDeleteAnimation } from '../../utils/messageChatDeleteAnimation';
import ProductSellerChatModalHeader from './ProductSellerChatModalHeader/ProductSellerChatModalHeader';
import ProductSellerChatMessageList from './ProductSellerChatMessageList/ProductSellerChatMessageList';
import ProductSellerChatComposer from './ProductSellerChatComposer/ProductSellerChatComposer';
import ProductSellerChatContextProduct from './ProductSellerChatContextProduct/ProductSellerChatContextProduct';
import MessageChatActionsModal from './MessageChatActionsModal';
import './ProductSellerChatModal.css';

export default function ProductSellerChatModal({
  open = false,
  seller = null,
  lang = 'uz',
  contextProduct = null,
  messages = [],
  loading = false,
  onClose,
  onSendText,
  onSendImage,
  onSendProduct,
  onDeleteMessage,
  onEditMessage,
  onDeleteThread,
  isPartnerTyping = false,
  isPartnerSending = false,
  isPartnerOnline = false,
  partnerLastActiveAt = null,
  isSending = false,
  onComposerActivity,
  onStopTyping,
}) {
  const { t } = useTranslation();
  const [contextProductSent, setContextProductSent] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [composerText, setComposerText] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const actionMessageRef = useRef(null);
  const previewImageRef = useRef('');
  const lockedScrollYRef = useRef(0);

  actionMessageRef.current = actionMessage;
  previewImageRef.current = previewImageUrl;

  useEffect(() => {
    if (!open) {
      setContextProductSent(false);
      setActionMessage(null);
      setReplyTarget(null);
      setEditingMessage(null);
      setComposerText('');
      setDeletingMessageId(null);
      setPreviewImageUrl('');
    }
  }, [open]);

  useEffect(() => {
    setContextProductSent(false);
  }, [contextProduct?.id]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (previewImageRef.current) {
          setPreviewImageUrl('');
          return;
        }
        if (actionMessageRef.current) {
          setActionMessage(null);
          return;
        }
        onClose?.();
      }
    };

    lockedScrollYRef.current = window.scrollY;
    const { style: bodyStyle } = document.body;
    const { style: htmlStyle } = document.documentElement;

    const prevBodyOverflow = bodyStyle.overflow;
    const prevHtmlOverflow = htmlStyle.overflow;
    const prevBodyPosition = bodyStyle.position;
    const prevBodyTop = bodyStyle.top;
    const prevBodyWidth = bodyStyle.width;

    htmlStyle.overflow = 'hidden';
    bodyStyle.overflow = 'hidden';
    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${lockedScrollYRef.current}px`;
    bodyStyle.width = '100%';

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      htmlStyle.overflow = prevHtmlOverflow;
      bodyStyle.overflow = prevBodyOverflow;
      bodyStyle.position = prevBodyPosition;
      bodyStyle.top = prevBodyTop;
      bodyStyle.width = prevBodyWidth;
      window.scrollTo(0, lockedScrollYRef.current);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !seller) return null;

  const resetComposerModes = () => {
    setReplyTarget(null);
    setEditingMessage(null);
    setComposerText('');
  };

  const handleSendText = async (text) => {
    if (editingMessage) {
      await onEditMessage?.(editingMessage.id, text);
      setEditingMessage(null);
      setComposerText('');
      return;
    }

    const replyTo = replyTarget ? buildReplyToPayload(replyTarget) : null;
    onSendText?.(text, replyTo);
    setReplyTarget(null);
    setComposerText('');
  };

  const handleDeleteMessage = async (message) => {
    if (!message?.id || deletingMessageId) return;

    setDeletingMessageId(message.id);
    await waitMessageChatDeleteAnimation();

    const ok = await onDeleteMessage?.(message.id);
    setDeletingMessageId(null);
    if (!ok) return;

    if (editingMessage?.id === message.id) {
      setEditingMessage(null);
      setComposerText('');
    }
    if (replyTarget?.id === message.id) {
      setReplyTarget(null);
    }
  };

  const handleEditMessage = (message) => {
    setReplyTarget(null);
    setEditingMessage(message);
    setComposerText(String(message.content || ''));
  };

  const handleReplyMessage = (message) => {
    setEditingMessage(null);
    setComposerText('');
    setReplyTarget(message);
  };

  const handleSendProduct = (product) => {
    if (!product || contextProductSent) return;
    onSendProduct?.(product);
    setContextProductSent(true);
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
        <ProductSellerChatModalHeader
          seller={seller}
          lang={lang}
          onBack={onClose}
          onDeleteThread={onDeleteThread}
          isPartnerTyping={isPartnerTyping}
          isPartnerSending={isPartnerSending}
          isPartnerOnline={isPartnerOnline}
          partnerLastActiveAt={partnerLastActiveAt}
        />
        <ProductSellerChatMessageList
          messages={messages}
          loading={loading}
          onMessagePress={setActionMessage}
          onImagePress={setPreviewImageUrl}
          deletingMessageId={deletingMessageId}
        />
        {contextProduct && !contextProductSent ? (
          <ProductSellerChatContextProduct product={contextProduct} onSend={handleSendProduct} />
        ) : null}
        <ProductSellerChatComposer
          text={composerText}
          onTextChange={setComposerText}
          editingMessage={editingMessage}
          replyTarget={replyTarget}
          onCancelComposerMode={resetComposerModes}
          onSendText={handleSendText}
          onSendImage={onSendImage}
          onComposerActivity={onComposerActivity}
          onStopTyping={onStopTyping}
          isSending={isSending}
        />
        <MessageChatActionsModal
          open={Boolean(actionMessage)}
          message={actionMessage}
          viewerRole="user"
          onClose={() => setActionMessage(null)}
          onDelete={handleDeleteMessage}
          onEdit={handleEditMessage}
          onReply={handleReplyMessage}
        />
      </div>

      {previewImageUrl ? (
        <div
          className="product-seller-chat-modal__image-preview"
          role="dialog"
          aria-modal="true"
          aria-label={t('productDetail.chat.image')}
        >
          <button
            type="button"
            className="product-seller-chat-modal__image-preview-backdrop"
            onClick={() => setPreviewImageUrl('')}
            aria-label={t('productDetail.chat.close')}
          />
          <img
            className="product-seller-chat-modal__image-preview-image"
            src={previewImageUrl}
            alt=""
          />
          <button
            type="button"
            className="product-seller-chat-modal__image-preview-close"
            onClick={() => setPreviewImageUrl('')}
            aria-label={t('productDetail.chat.close')}
          >
            ×
          </button>
        </div>
      ) : null}
    </div>,
    getPortalContainer(),
  );
}
