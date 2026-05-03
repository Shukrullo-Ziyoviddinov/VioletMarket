import React from 'react';
import { useTranslation } from 'react-i18next';
import './CheckoutAddressBlock.css';

const CheckoutAddressBlock = ({ address, onAddAddress }) => {
  const { t } = useTranslation();
  const hasAddress = address && (address.addressLine || address.formatted);

  return (
    <div className="checkout-address-block">
      <div className="checkout-address-block__icon">
        <i className="bx bxs-truck" aria-hidden="true" />
      </div>
      <div className="checkout-address-block__text">
        <span
          className={`checkout-address-block__value ${!hasAddress ? 'checkout-address-block__value--empty' : ''}`}
        >
          {hasAddress
            ? address.addressLine || address.formatted
            : t('checkout.addressNotShown')}
        </span>
      </div>
      <button
        type="button"
        className="checkout-address-block__btn"
        onClick={onAddAddress}
      >
        {hasAddress ? t('checkout.changeAddress') : t('checkout.addAddress')}
      </button>
    </div>
  );
};

export default CheckoutAddressBlock;
