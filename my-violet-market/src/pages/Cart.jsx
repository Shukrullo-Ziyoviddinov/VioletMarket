import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { useAppData } from '../contexts/AppDataContext';
import { formatPrice, calculateDeliveryPrice, calculateCargoPrice, getLocalizedText } from '../utils/utils';
import CargoSummary from '../components/CargoSummary';
import DeliveryInfoModal from '../components/DeliveryInfoModal';
import ClearCartModal from '../components/ClearCartModal';
import ButtonLoader from '../components/ButtonLoader/ButtonLoader';
import TavsiyaEtamiz from '../components/TavsiyaEtamiz';
import { SkeletonCartCargoPanel, CartPageSkeleton } from '../components/SkeletonLoader';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { getCartItemKey } from '../utils/cartItemProductId';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const [isDeliveryInfoModalOpen, setIsDeliveryInfoModalOpen] = useState(false);
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
  const [isClearLoading, setIsClearLoading] = useState(false);
  const [highlightedCartIndex, setHighlightedCartIndex] = useState(null);
  const { showToast } = useToast();
  const { authToken, authLoading } = useUser();
  const {
    cart,
    cartLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotal,
    getTotalItems,
    selectedDeliveryType,
    changeDeliveryType,
    selectedCargoOptions,
    updateCargoSelection
  } = useCart();
  const { deliveryPrices, cargoRates, loading: appDataLoading } = useAppData();

  // Mahsulotlar narxi
  const totalProductPrice = useMemo(() => getTotal(), [cart]);
  
  // Yetkazib berish narxi - selectedDeliveryType o'zgarganda yangilanadi
  const deliveryPrice = useMemo(() => {
    return calculateDeliveryPrice(totalProductPrice, selectedDeliveryType, deliveryPrices);
  }, [totalProductPrice, selectedDeliveryType, deliveryPrices]);
  
  // Kargo narxi
  const cargoPrice = useMemo(() => {
    return calculateCargoPrice(cart, selectedCargoOptions, cargoRates);
  }, [cart, selectedCargoOptions, cargoRates]);
  
  // Umumiy summa - kargo narxi kiritilmaydi
  // selectedDeliveryType o'zgarganda deliveryPrice yangilanadi, shuning uchun finalTotal ham yangilanadi
  const finalTotal = useMemo(() => {
    const calculatedDeliveryPrice = calculateDeliveryPrice(totalProductPrice, selectedDeliveryType, deliveryPrices);
    return totalProductPrice + calculatedDeliveryPrice;
  }, [totalProductPrice, selectedDeliveryType, deliveryPrices]);

  const handleCargoProductClick = useCallback((item) => {
    const index = cart.findIndex((cartItem) => getCartItemKey(cartItem) === getCartItemKey(item));
    if (index < 0) return;

    const el = document.getElementById(`cart-item-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setHighlightedCartIndex(index);
    window.setTimeout(() => setHighlightedCartIndex(null), 2200);
  }, [cart]);

  const hasAuthToken =
    Boolean(authToken) || (authLoading && Boolean(localStorage.getItem('authToken')));
  const showCartSkeleton = hasAuthToken && (authLoading || cartLoading);
  const showEmpty = !authLoading && !cartLoading && cart.length === 0;

  if (showCartSkeleton) {
    return (
      <div className="cart-page cart-page--skeleton">
        <CartPageSkeleton />
        <div className="container">
          <div className="cart-page-recs-wrap">
            <TavsiyaEtamiz useScrollable={true} />
          </div>
        </div>
      </div>
    );
  }

  if (showEmpty) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <img src="/img/cart0_preview_rev_1.png" alt="Empty cart" />
          <p>{i18n.t('cart.emptyTitle')}</p>
          <Link to="/">{i18n.t('cart.goHome')}</Link>
        </div>
        <div className="container">
          <div className="cart-page-recs-wrap">
            <TavsiyaEtamiz useScrollable={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-items-section">
          {cart.map((item, index) => (
            <div
              key={item.cartItemId || `cart-${index}`}
              id={`cart-item-${index}`}
              className={`cart-item${highlightedCartIndex === index ? ' cart-item--highlight' : ''}`}
            >
              <img src={item.image} alt={getLocalizedText(item.title, lang)} />
              <div className="cart-item-info">
                <div className="cart-item-title">{getLocalizedText(item.title, lang)}</div>
                <div className="cart-item-details">
                  {item.color && <div>{i18n.t('productDetail.colorLabel')} {item.color}</div>}
                  {item.size && <div>{i18n.t('productDetail.sizeLabel')} {item.size}</div>}
                  {item.storage && <div>{i18n.t('productDetail.storageLabel')} {item.storage}</div>}
                  {item.model && <div>{i18n.t('productDetail.modelLabel')} {item.model}</div>}
                </div>
                <div className="quantity-controls">
                  <button onClick={() => updateQuantity(index, -1)}>-</button>
                  <span>{item.quantity || 1}</span>
                  <button onClick={() => updateQuantity(index, 1)}>+</button>
                </div>
                <div className="cart-item-price">
                  {formatPrice((item.price || 0) * (item.quantity || 1))}
                </div>
              </div>
              <button className="remove-btn" onClick={() => removeFromCart(index)}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary-section">
          <div className="cart-summary">
            <div className="cart-stats">
              <div className="stat-item">
                <span>{i18n.t('cart.statProductTypes')}</span>
                <span>{cart.length}</span>
              </div>
              <div className="stat-item">
                <span>{i18n.t('cart.statTotalItems')}</span>
                <span>{getTotalItems()}</span>
              </div>
              <div className="stat-item">
                <span>{i18n.t('cart.statProducts')}</span>
                <span>{formatPrice(totalProductPrice)}</span>
              </div>
              <div className="stat-item">
                <span>{i18n.t('cart.statDelivery')}</span>
                <span>{deliveryPrice > 0 ? formatPrice(deliveryPrice) : i18n.t('cart.free')}</span>
              </div>
              {cargoPrice > 0 && (
                <>
                  <div className="stat-item">
                    <span>{i18n.t('cart.statCargo')}</span>
                    <span>${cargoPrice.toFixed(2)}</span>
                  </div>
                  <p className="cart-summary__cargo-note">
                    {i18n.t('cargo.feeLaterNote')}
                  </p>
                </>
              )}
            </div>
            <div className="total-price" key={`total-${selectedDeliveryType}-${deliveryPrice}`}>
              {i18n.t('cart.totalSum')} {formatPrice(finalTotal)}
            </div>
          </div>

          <div className="delivery-section">
            <div className="delivery-section-header">
              <h3>{i18n.t('cart.deliverySectionTitle')}</h3>
              <button 
                className="delivery-info-btn" 
                onClick={() => setIsDeliveryInfoModalOpen(true)}
              >
                <i className='bx bx-info-circle'></i>
                {i18n.t('cart.deliveryInfo')}
              </button>
            </div>
            <div className="delivery-options">
              <label
                className={`delivery-option ${selectedDeliveryType === 'toshkent' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  changeDeliveryType('toshkent');
                }}
              >
                <input
                  type="radio"
                  name="delivery-type"
                  value="toshkent"
                  checked={selectedDeliveryType === 'toshkent'}
                  onChange={(e) => {
                    e.stopPropagation();
                    changeDeliveryType('toshkent');
                  }}
                />
                <div className="delivery-option-content">
                  <span>{i18n.t('cart.deliveryToshkent')}</span>
                  <span>{selectedDeliveryType === 'toshkent' && deliveryPrice === 0 ? i18n.t('cart.free') : ''}</span>
                </div>
              </label>
              <label
                className={`delivery-option ${selectedDeliveryType === 'viloyat' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  changeDeliveryType('viloyat');
                }}
              >
                <input
                  type="radio"
                  name="delivery-type"
                  value="viloyat"
                  checked={selectedDeliveryType === 'viloyat'}
                  onChange={(e) => {
                    e.stopPropagation();
                    changeDeliveryType('viloyat');
                  }}
                />
                <div className="delivery-option-content">
                  <span>{i18n.t('cart.deliveryViloyat')}</span>
                  <span>{selectedDeliveryType === 'viloyat' && deliveryPrice === 0 ? i18n.t('cart.free') : ''}</span>
                </div>
              </label>
            </div>
          </div>

          {appDataLoading ? <SkeletonCartCargoPanel /> : <CargoSummary onCargoProductClick={handleCargoProductClick} />}

          <div className="cart-actions">
            <button
              className="checkout-btn"
              type="button"
              onClick={() => navigate('/checkout')}
            >
              {i18n.t('cart.checkout')}
            </button>
            <button
              className="clear-btn"
              type="button"
              onClick={() => setIsClearCartModalOpen(true)}
              disabled={isClearLoading}
            >
              <ButtonLoader isLoading={isClearLoading}>
                {i18n.t('cart.clearCart')}
              </ButtonLoader>
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="cart-page-recs-wrap">
          <TavsiyaEtamiz useScrollable={true} />
        </div>
      </div>

      {/* Delivery Info Modal */}
      <DeliveryInfoModal
        isOpen={isDeliveryInfoModalOpen}
        onClose={() => setIsDeliveryInfoModalOpen(false)}
      />

      {/* Clear Cart Modal */}
      <ClearCartModal
        isOpen={isClearCartModalOpen}
        onClose={() => setIsClearCartModalOpen(false)}
        onConfirm={async () => {
          setIsClearLoading(true);
          try {
            await clearCart();
            showToast(i18n.t('cart.toastCleared'), 'success');
            setIsClearCartModalOpen(false);
          } catch {
            /* xato toast CartContext da */
          } finally {
            setIsClearLoading(false);
          }
        }}
      />
    </div>
  );
};

export default Cart;

