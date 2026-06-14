import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { useAppData } from '../../contexts/AppDataContext';
import { formatPrice, getDeliveryTiers, getLocalizedText } from '../../utils/utils';
import './DeliveryInfoModal.css';

const CLOSE_THRESHOLD_PERCENT = 0.2; // 20% pastga surilsa yopiladi

const DeliveryInfoModal = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const { deliveryPrices } = useAppData();
  const prices = deliveryPrices || {};
  const lang = i18n.language || 'uz';
  const contentRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const startDragYRef = useRef(0);
  const dragYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleDragStart = useCallback((clientY) => {
    startYRef.current = clientY;
    startDragYRef.current = dragYRef.current;
    isDraggingRef.current = false;
  }, []);

  const handleDragMove = useCallback((clientY, preventScroll) => {
    const content = contentRef.current;
    if (!content) return;
    const deltaY = clientY - startYRef.current;
    const scrollTop = content.scrollTop;
    const canDragToClose = scrollTop === 0 && deltaY > 0;
    if (canDragToClose || isDraggingRef.current) {
      if (canDragToClose && !isDraggingRef.current) {
        isDraggingRef.current = true;
      }
      if (preventScroll) preventScroll();
      const newY = Math.max(0, startDragYRef.current + deltaY);
      dragYRef.current = newY;
      setDragY(newY);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    const content = contentRef.current;
    const currentDragY = dragYRef.current;
    if (!content) return;
    const modalHeight = content.offsetHeight;
    const threshold = modalHeight * CLOSE_THRESHOLD_PERCENT;
    if (currentDragY >= threshold) {
      onClose();
    }
    dragYRef.current = 0;
    setDragY(0);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) setDragY(0);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toshkentInfo = prices.toshkent;
  const viloyatInfo = prices.viloyat;
  const toshkentTiers = getDeliveryTiers(toshkentInfo, 'toshkent');
  const viloyatTiers = getDeliveryTiers(viloyatInfo, 'viloyat');
  const freeLabel = i18n.t('cart.free');

  const dragHandleProps = {
    onTouchStart: (e) => {
      e.stopPropagation();
      handleDragStart(e.touches[0].clientY);
    },
    onTouchMove: (e) => {
      handleDragMove(e.touches[0].clientY, () => {
        if (e.cancelable) e.preventDefault();
      });
    },
    onTouchEnd: (e) => {
      if (e.cancelable) e.preventDefault();
      handleDragEnd();
    },
    onMouseDown: (e) => {
      e.preventDefault();
      handleDragStart(e.clientY);
      const onMouseMove = (ev) => handleDragMove(ev.clientY, () => ev.preventDefault());
      const onMouseUp = () => {
        handleDragEnd();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
  };

  const modalContent = (
    <div className="delivery-modal-overlay" onClick={onClose}>
      <div
        ref={contentRef}
        className="delivery-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `translateY(${dragY}px)` }}
        {...dragHandleProps}
      >
        <div className="delivery-modal-drag-handle">
          <span className="delivery-modal-drag-indicator" />
        </div>
        <div className="delivery-modal-header">
          <h3>{i18n.t('delivery.modalTitle')}</h3>
          <button className="delivery-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="delivery-modal-body">
          <div className="delivery-info-section">
            <h4>{getLocalizedText(toshkentInfo?.name, lang)}</h4>
            {toshkentTiers.map((tier) => (
              <div key={`tsh-${tier.index}`} className="delivery-price-item">
                <span>{getLocalizedText(tier.label, lang)}</span>
                <span className="price">{tier.price === 0 ? freeLabel : formatPrice(tier.price)}</span>
              </div>
            ))}
          </div>
          
          <div className="delivery-info-section">
            <h4>{getLocalizedText(viloyatInfo?.name, lang)}</h4>
            {viloyatTiers.map((tier) => (
              <div key={`vil-${tier.index}`} className="delivery-price-item">
                <span>{getLocalizedText(tier.label, lang)}</span>
                <span className="price">{tier.price === 0 ? freeLabel : formatPrice(tier.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, getPortalContainer());
};

export default DeliveryInfoModal;
