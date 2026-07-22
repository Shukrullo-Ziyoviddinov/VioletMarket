import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { useTestOrderModal } from '../../contexts/TestOrderModalContext';
import { useUser } from '../../contexts/UserContext';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import { createPendingReviewsBatch } from '../../api/pendingReviewsApi';
import { getCartItemProductId } from '../../utils/cartItemProductId';
import { useToast } from '../../contexts/ToastContext';
import CommentFormModal from '../CommentFormModal';
import './TestOrderModal.css';

const TestOrderModal = ({ isOpen, onClose, cartSnapshot }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const { cart } = useCart();
  const { registerBeforeClose } = useTestOrderModal();
  const { authToken } = useUser();
  const { showToast } = useToast();
  const displayCart = (cartSnapshot && cartSnapshot.length > 0) ? cartSnapshot : cart;
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  // Har bir buyurtmada izoh yozilgan mahsulotlar (global comments emas)
  const [commentedInThisOrder, setCommentedInThisOrder] = useState(new Set());
  const commentedRef = useRef(commentedInThisOrder);
  const displayCartRef = useRef(displayCart);

  useEffect(() => {
    commentedRef.current = commentedInThisOrder;
  }, [commentedInThisOrder]);

  useEffect(() => {
    displayCartRef.current = displayCart;
  }, [displayCart]);
  
  // Get selected product from cart by ID
  const selectedProduct = selectedProductId
    ? displayCart.find((item) => getCartItemProductId(item) === selectedProductId) || null
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

  const handleProductClick = (product) => {
    // Faqat shu buyurtmada izoh yozilganini tekshiramiz (har bir buyurtma uchun yangi izoh mumkin)
    const pid = getCartItemProductId(product);
    if (pid == null) return;
    const hasCommentInThisOrder = commentedInThisOrder.has(String(pid));
    if (hasCommentInThisOrder) {
      return;
    }

    setSelectedProductId(pid);
    setIsCommentFormOpen(true);
  };

  const handleCommentSubmit = (productId) => {
    setCommentedInThisOrder(prev => new Set([...prev, String(productId)]));
    setSelectedProductId(null);
    setIsCommentFormOpen(false);
    window.dispatchEvent(new Event('pendingReviewsUpdated'));
  };

  const saveUnwrittenReviews = useCallback(async () => {
    const token = authToken || localStorage.getItem('authToken');
    if (!token) return;

    const cartItems = displayCartRef.current || [];
    const commented = commentedRef.current;
    // Topshirdimdan kelganlar allaqachon pending — qayta yaratmaslik
    const pendingItems = cartItems
      .map((item) => {
        const productId = getCartItemProductId(item);
        if (productId == null || commented.has(String(productId))) return null;
        if (item?.pendingReviewId) return null;
        return { productId };
      })
      .filter(Boolean);

    if (pendingItems.length === 0) return;

    try {
      await createPendingReviewsBatch(token, pendingItems);
      window.dispatchEvent(new Event('pendingReviewsUpdated'));
    } catch (err) {
      console.error('Kutilmagan sharhlarni saqlashda xatolik:', err);
      if (err?.status === 404) {
        showToast(
          i18n.t('profile.errorApiNotFound'),
          'error',
        );
      }
    }
  }, [authToken, i18n, showToast]);

  useEffect(() => {
    if (!isOpen) {
      registerBeforeClose(null);
      return;
    }
    registerBeforeClose(() => saveUnwrittenReviews());
    return () => registerBeforeClose(null);
  }, [isOpen, registerBeforeClose, saveUnwrittenReviews]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, handleClose]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsCommentFormOpen(false);
      setSelectedProductId(null);
      setCommentedInThisOrder(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // -------------------------------------------------------------------------
  // SOTILDI MODAL — .test-order-modal-content
  // Topshirdim → pendingReview → App poll → shu modal.
  // -------------------------------------------------------------------------
  const modalContent = (
    <div className="test-order-modal-overlay" onClick={handleClose}>
      <div className="test-order-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="test-order-modal-close" onClick={handleClose}>
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
              const itemProductId = getCartItemProductId(item);
              const hasCommentInThisOrder =
                itemProductId != null && commentedInThisOrder.has(String(itemProductId));
              return (
                <div
                  key={item.pendingReviewId || `${itemProductId}-${index}`}
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
                    {item.price !== '' && item.price != null ? (
                      <p className="test-order-product-price">{item.price} UZS</p>
                    ) : null}
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
          onSubmit={() => handleCommentSubmit(getCartItemProductId(selectedProduct))}
          productId={getCartItemProductId(selectedProduct)}
          productName={getLocalizedText(selectedProduct.title, lang)}
          productImage={selectedProduct.image}
          pendingReviewId={selectedProduct.pendingReviewId || null}
        />
      )}
    </>
  );
};

export default TestOrderModal;
