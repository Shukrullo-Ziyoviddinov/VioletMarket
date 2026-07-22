import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useCheckoutPayment } from '../../contexts/CheckoutPaymentContext';
import ButtonLoader from '../ButtonLoader/ButtonLoader';
import { formatPrice, formatCargoPrice } from '../../utils/utils';
import './CheckoutOrderSummary.css';

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
  const { selectedPayment, isPayOnDelivery } = useCheckoutPayment();
  const { cart, checkoutCart, refreshCart } = useCart();
  const { showToast } = useToast();
  const [isPayLoading, setIsPayLoading] = useState(false);

  const handlePayClick = async () => {
    if (!hasAddress) return;
    if (!selectedPayment) {
      showToast(t('checkout.selectPaymentRequired'), 'error');
      return;
    }

    setIsPayLoading(true);
    try {
      const cartSnapshot = [...cart];
      const paymentMethod = String(selectedPayment).trim();

      let addressPayload = address || null;
      if (!addressPayload) {
        try {
          const raw = localStorage.getItem('checkoutAddress');
          addressPayload = raw ? JSON.parse(raw) : null;
        } catch {
          addressPayload = null;
        }
      }

      const addressText =
        addressPayload?.addressLine || addressPayload?.formatted || '';

      // Faqat zakaz yuboriladi — «sotildi» / izoh modal yo‘q (ular Topshirdim da)
      await checkoutCart(paymentMethod, addressPayload);
      window.dispatchEvent(new Event('appDataRefreshRequested'));
      onOrderConfirmed?.({ cartSnapshot, addressText });
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
        className={`checkout-order-summary__pay-btn ${!hasAddress || !selectedPayment ? 'checkout-order-summary__pay-btn--disabled' : ''} ${isPayLoading ? 'checkout-order-summary__pay-btn--loading' : ''}`}
        onClick={handlePayClick}
        disabled={!hasAddress || !selectedPayment || isPayLoading}
      >
        <ButtonLoader isLoading={isPayLoading}>
          {t(isPayOnDelivery ? 'checkout.confirmOrderButton' : 'checkout.payButton')}
        </ButtonLoader>
      </button>
    </div>
  );
};

export default CheckoutOrderSummary;
