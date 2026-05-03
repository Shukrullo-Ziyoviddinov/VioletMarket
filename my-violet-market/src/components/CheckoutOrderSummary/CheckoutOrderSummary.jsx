import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatPrice, formatCargoPrice } from '../../utils/utils';
import { useCart } from '../../contexts/CartContext';
import { useTestOrderModal } from '../../contexts/TestOrderModalContext';
import ButtonLoader from '../ButtonLoader/ButtonLoader';
import './CheckoutOrderSummary.css';

const LOADER_DURATION_MS = 2000;

const CheckoutOrderSummary = ({
  productTypesCount,
  totalItems,
  productsSum,
  deliveryPrice,
  cargoPrice,
  totalSum,
  hasAddress,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { scheduleOpenOnHome } = useTestOrderModal();
  const [isPayLoading, setIsPayLoading] = useState(false);

  const handlePayClick = async () => {
    if (!hasAddress) return;
    setIsPayLoading(true);
    await new Promise((r) => setTimeout(r, LOADER_DURATION_MS));
    scheduleOpenOnHome({
      cartSnapshot: [...cart],
      onCloseExtra: () => {
        clearCart();
      },
    });
    setIsPayLoading(false);
    navigate('/', { replace: true });
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
          {t('checkout.payButton')}
        </ButtonLoader>
      </button>
    </div>
  );
};

export default CheckoutOrderSummary;
