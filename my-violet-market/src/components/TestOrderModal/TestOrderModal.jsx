import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import CommentFormModal from '../CommentFormModal';
import './TestOrderModal.css';

const TestOrderModal = ({ isOpen, onClose, cartSnapshot }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const { cart } = useCart();
  const displayCart = (cartSnapshot && cartSnapshot.length > 0) ? cartSnapshot : cart;
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  // Har bir buyurtmada izoh yozilgan mahsulotlar (global comments emas)
  const [commentedInThisOrder, setCommentedInThisOrder] = useState(new Set());
  
  // Get selected product from cart by ID
  const selectedProduct = selectedProductId 
    ? displayCart.find(item => item.id === selectedProductId) || null
    : null;

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

  const handleProductClick = (product) => {
    // Faqat shu buyurtmada izoh yozilganini tekshiramiz (har bir buyurtma uchun yangi izoh mumkin)
    const hasCommentInThisOrder = commentedInThisOrder.has(String(product.id));
    if (hasCommentInThisOrder) {
      return;
    }
    
    setSelectedProductId(product.id);
    setIsCommentFormOpen(true);
  };

  const handleCommentSubmit = (productId) => {
    setCommentedInThisOrder(prev => new Set([...prev, String(productId)]));
    setSelectedProductId(null);
    setIsCommentFormOpen(false);
  };

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsCommentFormOpen(false);
      setSelectedProductId(null);
      setCommentedInThisOrder(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="test-order-modal-overlay" onClick={onClose}>
      <div className="test-order-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="test-order-modal-close" onClick={onClose}>
          <i className="bx bx-x"></i>
        </button>
        
        <div className="test-order-modal-header">
          <h2 className="test-order-modal-title">{i18n.t('testOrder.title')}</h2>
          <p className="test-order-test-notice">
            {i18n.t('testOrder.notice')}
          </p>
        </div>

        <div className="test-order-products-list">
          {displayCart.length === 0 ? (
            <p className="no-products">{i18n.t('testOrder.noProducts')}</p>
          ) : (
            displayCart.map((item, index) => {
              const hasCommentInThisOrder = commentedInThisOrder.has(String(item.id));
              return (
                <div
                  key={index}
                  className={`test-order-product-item ${hasCommentInThisOrder ? 'has-comment' : ''}`}
                  onClick={() => handleProductClick(item)}
                >
                  <img
                    src={normalizeImagePath(item.image || '/img/no-image.png')}
                    alt={getLocalizedText(item.title, lang)}
                    className="test-order-product-image"
                    onError={(e) => {
                      e.target.src = normalizeImagePath('/img/no-image.png');
                    }}
                  />
                  <div className="test-order-product-info">
                    <h3 className="test-order-product-title">{getLocalizedText(item.title, lang)}</h3>
                    <p className="test-order-product-price">{item.price} UZS</p>
                    {hasCommentInThisOrder && (
                      <span className="test-order-comment-badge">Izoh qo'shilgan</span>
                    )}
                  </div>
                  <i className="bx bx-chevron-right test-order-product-arrow"></i>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, getPortalContainer())}
      {selectedProduct && isCommentFormOpen && (
        <CommentFormModal
          isOpen={isCommentFormOpen}
          onClose={() => {
            setIsCommentFormOpen(false);
            setSelectedProductId(null);
          }}
          onSubmit={() => handleCommentSubmit(selectedProduct.id)}
          productId={selectedProduct.id}
          productName={getLocalizedText(selectedProduct.title, lang)}
          productImage={selectedProduct.image}
        />
      )}
    </>
  );
};

export default TestOrderModal;
