import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatPrice, formatCargoPrice } from '../../utils/utils';
import { useCart } from '../../contexts/CartContext';
import { useTestOrderModal } from '../../contexts/TestOrderModalContext';
import { useToast } from '../../contexts/ToastContext';
import { useCheckoutPayment } from '../../contexts/CheckoutPaymentContext';
import ButtonLoader from '../ButtonLoader/ButtonLoader';
import './CheckoutOrderSummary.css';

const TEST_ORDER_MODAL_PENDING_KEY = 'pendingTestOrderModal';

const CheckoutOrderSummary = ({
  productTypesCount,
  totalItems,
  productsSum,
  deliveryPrice,
  cargoPrice,
  totalSum,
  hasAddress,
  address,
  onOrderConfirmed,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPayOnDelivery } = useCheckoutPayment();
  const { cart, checkoutCart, refreshCart } = useCart();
  const { scheduleOpenOnHome } = useTestOrderModal();
  const { showToast } = useToast();
  const [isPayLoading, setIsPayLoading] = useState(false);

  const handlePayClick = async () => {
    if (!hasAddress) return;
    setIsPayLoading(true);
    try {
      const cartSnapshot = [...cart];

      if (isPayOnDelivery) {
        const addressText = address?.addressLine || address?.formatted || '';
        await checkoutCart();
        onOrderConfirmed?.({ cartSnapshot, addressText });
        return;
      }

      await checkoutCart();
      window.dispatchEvent(new Event('appDataRefreshRequested'));
      // -------------------------------------------------------------------------
      // SOTILDI MODAL (.test-order-modal-content) — hozir checkout dan keyin ochiladi.
      // Keyinchalik real to'lov muvaffaqiyatli bo'lganda boshqa joydan chaqiriladi.
      // -------------------------------------------------------------------------
      scheduleOpenOnHome({
        cartSnapshot,
      });
      try {
        sessionStorage.setItem(
          TEST_ORDER_MODAL_PENDING_KEY,
          JSON.stringify({ cartSnapshot }),
        );
      } catch (storageError) {
        console.error('Pending test order modal state saqlanmadi:', storageError);
      }
      navigate('/', { replace: true });
    } catch (error) {
      if (error?.status === 409) {
        await refreshCart();
      }
      showToast(error?.message || t('cart.updateError'), 'error');
    } finally {
      setIsPayLoading(false);
    }
  };

  return (
    <div className="checkout-order-summary">
      <div className="checkout-order-summary__row">
        <span>{t('cart.statProductTypes')}</span>
        <span>{productTypesCount}</span>
      </div>
      <div className="checkout-order-summary__row">
        <span>{t('cart.statTotalItems')}</span>
        <span>{totalItems}</span>
      </div>
      <div className="checkout-order-summary__row">
        <span>{t('cart.statProducts')}</span>
        <span>{formatPrice(productsSum)}</span>
      </div>
      <div className="checkout-order-summary__row">
        <span>{t('cart.statDelivery')}</span>
        <span>
          {deliveryPrice > 0 ? formatPrice(deliveryPrice) : t('cart.free')}
        </span>
      </div>
      {cargoPrice > 0 && (
        <div className="checkout-order-summary__row">
          <span>{t('cart.statCargo')}</span>
          <span>{formatCargoPrice(cargoPrice)}</span>
        </div>
      )}
      <div className="checkout-order-summary__total">
        {t('cart.totalSum')} {formatPrice(totalSum)}
      </div>
      <button
        type="button"
        className={`checkout-order-summary__pay-btn ${!hasAddress ? 'checkout-order-summary__pay-btn--disabled' : ''} ${isPayLoading ? 'checkout-order-summary__pay-btn--loading' : ''}`}
        onClick={handlePayClick}
        disabled={!hasAddress || isPayLoading}
      >
        <ButtonLoader isLoading={isPayLoading}>
          {t(isPayOnDelivery ? 'checkout.confirmOrderButton' : 'checkout.payButton')}
        </ButtonLoader>
      </button>
    </div>
  );
};

export default CheckoutOrderSummary;
