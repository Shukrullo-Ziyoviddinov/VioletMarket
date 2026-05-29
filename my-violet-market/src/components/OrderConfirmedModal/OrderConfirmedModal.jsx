import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getPortalContainer, getLocalizedText, normalizeImagePath } from '../../utils/utils';
import './OrderConfirmedModal.css';

const OrderConfirmedModal = ({ isOpen, onClose, addressText, cartItems = [] }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
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

  if (!isOpen && !isClosing) return null;

  const modalContent = (
    <div
      className={`order-confirmed-modal__overlay ${isClosing ? 'order-confirmed-modal__overlay--close' : 'order-confirmed-modal__overlay--open'}`}
      role="presentation"
    >
      <div
        className={`order-confirmed-modal ${isClosing ? 'order-confirmed-modal--close' : 'order-confirmed-modal--open'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-confirmed-modal-title"
      >
        <div className="order-confirmed-modal__header">
          <div className="order-confirmed-modal__icon" aria-hidden="true">
            <i className="bx bx-check" />
          </div>
          <h2 id="order-confirmed-modal-title" className="order-confirmed-modal__title">
            {i18n.t('checkout.orderConfirmedTitle')}
          </h2>
          <p className="order-confirmed-modal__desc">
            {i18n.t('checkout.orderConfirmedDesc')}
          </p>
        </div>

        <div className="order-confirmed-modal__delivery">
          <h3 className="order-confirmed-modal__delivery-title">
            {i18n.t('checkout.orderConfirmedDeliveryTitle')}
          </h3>
          <p className="order-confirmed-modal__address checkout-address-block__value">
            {addressText || '—'}
          </p>
        </div>

        <div className="order-confirmed-modal__products">
          {cartItems.map((item, index) => {
            const title = getLocalizedText(item.title, lang);
            return (
              <div key={index} className="order-confirmed-modal__product">
                {item.image && (
                  <img
                    src={normalizeImagePath(item.image)}
                    alt={title}
                    className="order-confirmed-modal__product-img"
                  />
                )}
                <div className="order-confirmed-modal__product-title">{title}</div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="order-confirmed-modal__btn"
          onClick={handleClose}
        >
          {i18n.t('checkout.orderConfirmedClose')}
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, getPortalContainer());
};

export default OrderConfirmedModal;
