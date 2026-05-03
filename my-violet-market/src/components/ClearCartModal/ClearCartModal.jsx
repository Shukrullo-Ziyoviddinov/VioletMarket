import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import './ClearCartModal.css';

const ClearCartModal = ({ isOpen, onClose, onConfirm }) => {
  const { i18n } = useTranslation();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
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
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      onConfirm();
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  const modalContent = (
    <div 
      className={`clear-cart-modal-overlay ${isClosing ? 'close' : 'open'}`}
      onClick={handleClose}
    >
      <div 
        className={`clear-cart-modal-content ${isClosing ? 'close' : 'open'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clear-cart-modal-body">
          <div className="clear-cart-icon">
            <i className="bx bx-trash"></i>
          </div>
          <h3>{i18n.t('clearCart.title')}</h3>
          <p>{i18n.t('clearCart.description')}</p>
        </div>
        <div className="clear-cart-modal-actions">
          <button 
            className="clear-cart-btn-no"
            onClick={handleClose}
          >
            {i18n.t('clearCart.no')}
          </button>
          <button 
            className="clear-cart-btn-yes"
            onClick={handleConfirm}
          >
            {i18n.t('clearCart.yes')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, getPortalContainer());
};

export default ClearCartModal;
