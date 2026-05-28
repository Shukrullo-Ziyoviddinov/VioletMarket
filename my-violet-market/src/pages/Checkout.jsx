import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { useUser } from '../contexts/UserContext';
import { useAppData } from '../contexts/AppDataContext';
import {
  calculateDeliveryPrice,
  calculateCargoPrice,
} from '../utils/utils';
import CheckoutAddressBlock from '../components/CheckoutAddressBlock';
import CheckoutProductRow from '../components/CheckoutProductRow';
import CheckoutOrderSummary from '../components/CheckoutOrderSummary';
import AddressModal from '../components/AddressModal';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const [savedAddress, setSavedAddress] = useState(() => {
    try {
      const s = localStorage.getItem('checkoutAddress');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const { userData } = useUser();
  const {
    cart,
    cartReady,
    getTotal,
    getTotalItems,
    selectedDeliveryType,
    selectedCargoOptions,
  } = useCart();
  const { deliveryPrices, cargoRates } = useAppData();

  const totalProductPrice = useMemo(() => getTotal(), [cart]);
  const deliveryPrice = useMemo(
    () => calculateDeliveryPrice(totalProductPrice, selectedDeliveryType, deliveryPrices),
    [totalProductPrice, selectedDeliveryType, deliveryPrices]
  );
  const cargoPrice = useMemo(
    () => calculateCargoPrice(cart, selectedCargoOptions, cargoRates),
    [cart, selectedCargoOptions, cargoRates]
  );
  const finalTotal = totalProductPrice + deliveryPrice;

  const handleSaveAddress = (address) => {
    setSavedAddress(address);
    try {
      localStorage.setItem('checkoutAddress', JSON.stringify(address));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!cartReady) return;
    if (cart.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cartReady, cart.length, navigate]);

  if (!cartReady || cart.length === 0) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-main">
          <section className="checkout-section checkout-section_address">
            <CheckoutAddressBlock
              address={savedAddress}
              onAddAddress={() => setIsAddressModalOpen(true)}
            />
            <div className="checkout-profile-row">
              <div className="checkout-profile-row__icon">
                <i className="bx bx-user" aria-hidden="true" />
              </div>
              <span className="checkout-profile-row__label">
                {i18n.t('checkout.buyer')}
              </span>
              <span className="checkout-profile-row__text">
                {[userData.firstName, userData.lastName, userData.phone]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </span>
            </div>
          </section>

          <section className="checkout-section checkout-section_products">
            <h2 className="checkout-section__title">
              {i18n.t('checkout.productsTitle')}
            </h2>
            <div className="checkout-product-list">
              {cart.map((item, index) => (
                <CheckoutProductRow
                  key={index}
                  item={item}
                  lang={lang}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="checkout-sidebar">
          <CheckoutOrderSummary
            productTypesCount={cart.length}
            totalItems={getTotalItems()}
            productsSum={totalProductPrice}
            deliveryPrice={deliveryPrice}
            cargoPrice={cargoPrice}
            totalSum={finalTotal}
            hasAddress={!!(savedAddress && (savedAddress.addressLine || savedAddress.formatted))}
          />
        </aside>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        initialAddress={savedAddress}
      />
    </div>
  );
};

export default Checkout;
