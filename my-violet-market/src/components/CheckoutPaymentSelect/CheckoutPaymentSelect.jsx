import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import {
  CHECKOUT_PAYMENT_ON_DELIVERY,
  useCheckoutPayment,
} from '../../contexts/CheckoutPaymentContext';
import { normalizeImagePath } from '../../utils/utils';
import { isUzOnlyWarehouseProduct } from '../../utils/warehouseProduct';
import './CheckoutPaymentSelect.css';

const PAYME_IMG = '/img/payme_preview_rev_1.png';
const CLICK_IMG = '/img/click_preview_rev_1.png';

const ONLINE_OPTIONS = [
  { id: 'payme', image: PAYME_IMG, labelKey: 'checkout.paymentPayme' },
  { id: 'click', image: CLICK_IMG, labelKey: 'checkout.paymentClick' },
];

const CheckoutPaymentSelect = () => {
  const { t } = useTranslation();
  const { cart } = useCart();
  const { selectedPayment, setSelectedPayment } = useCheckoutPayment();

  const showPayOnDelivery = useMemo(
    () => cart.length > 0 && cart.every((item) => isUzOnlyWarehouseProduct(item)),
    [cart],
  );

  useEffect(() => {
    if (!showPayOnDelivery && selectedPayment === CHECKOUT_PAYMENT_ON_DELIVERY) {
      setSelectedPayment(null);
    }
  }, [showPayOnDelivery, selectedPayment, setSelectedPayment]);

  return (
    <div className="checkout-payment-select">
      <h3 className="checkout-payment-select__title">
        {t('checkout.paymentSelectTitle')}
      </h3>
      <div className="checkout-payment-select__options" role="radiogroup" aria-label={t('checkout.paymentSelectTitle')}>
        {ONLINE_OPTIONS.map((option) => {
          const isActive = selectedPayment === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`checkout-payment-select__option${isActive ? ' checkout-payment-select__option--active' : ''}`}
              onClick={() => setSelectedPayment(option.id)}
            >
              <img
                src={normalizeImagePath(option.image)}
                alt={t(option.labelKey)}
                className="checkout-payment-select__img"
              />
            </button>
          );
        })}
      </div>

      {showPayOnDelivery && (
        <button
          type="button"
          role="radio"
          aria-checked={selectedPayment === CHECKOUT_PAYMENT_ON_DELIVERY}
          className={`checkout-payment-select__on-delivery${selectedPayment === CHECKOUT_PAYMENT_ON_DELIVERY ? ' checkout-payment-select__on-delivery--active' : ''}`}
          onClick={() => setSelectedPayment(CHECKOUT_PAYMENT_ON_DELIVERY)}
        >
          <span className="checkout-payment-select__on-delivery-icon" aria-hidden="true">
            <i className="bx bx-credit-card" />
          </span>
          <span className="checkout-payment-select__on-delivery-label">
            {t('checkout.paymentOnDelivery')}
          </span>
        </button>
      )}
    </div>
  );
};

export default CheckoutPaymentSelect;
