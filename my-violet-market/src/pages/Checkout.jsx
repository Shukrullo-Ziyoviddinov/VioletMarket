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
import CheckoutPaymentSelect from '../components/CheckoutPaymentSelect';
import CheckoutOrderSummary from '../components/CheckoutOrderSummary';
import { CheckoutPaymentProvider } from '../contexts/CheckoutPaymentContext';
import AddressModal from '../components/AddressModal';
import OrderConfirmedModal from '../components/OrderConfirmedModal';
import { saveDeliveryAddressApi } from '../api/cartApi';
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
  const [isOrderConfirmedOpen, setIsOrderConfirmedOpen] = useState(false);
  const [orderConfirmedPayload, setOrderConfirmedPayload] = useState(null);

  const { userData, authToken } = useUser();
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

    // Manzilni darhol serverga yozamiz — checkout body kelmasa ham orderga tushadi
    if (authToken && address) {
      saveDeliveryAddressApi(authToken, address).catch((err) => {
        console.error('Manzil serverga saqlanmadi:', err);
      });
    }
  };

  useEffect(() => {
    if (!cartReady) return;
    if (cart.length === 0 && !isOrderConfirmedOpen) {
      navigate('/cart', { replace: true });
    }
  }, [cartReady, cart.length, navigate, isOrderConfirmedOpen]);

  const handleOrderConfirmed = (payload) => {
    setOrderConfirmedPayload(payload);
    setIsOrderConfirmedOpen(true);
    window.dispatchEvent(new Event('appDataRefreshRequested'));
  };

  const handleOrderConfirmedClose = () => {
    setIsOrderConfirmedOpen(false);
    setOrderConfirmedPayload(null);
    navigate('/', { replace: true });
  };

  if (!cartReady || (cart.length === 0 && !isOrderConfirmedOpen)) {
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
              <div className="checkout-profile-row__content">
                <span className="checkout-profile-row__label">
                  {i18n.t('checkout.buyer')}
                </span>
                <div className="checkout-profile-row__text">
                  <div className="checkout-profile-row__name">
                    {userData.firstName?.trim() || userData.lastName?.trim() ? (
                      <>
                        {userData.firstName?.trim() && (
                          <span>{userData.firstName.trim()}</span>
                        )}
                        {userData.lastName?.trim() && (
                          <span>{userData.lastName.trim()}</span>
                        )}
                      </>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  {userData.phone?.trim() && (
                    <span className="checkout-profile-row__phone">
                      {userData.phone.trim()}
                    </span>
                  )}
                </div>
              </div>
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
          <CheckoutPaymentProvider>
            <CheckoutPaymentSelect />
            <CheckoutOrderSummary
              productTypesCount={cart.length}
              totalItems={getTotalItems()}
              productsSum={totalProductPrice}
              deliveryPrice={deliveryPrice}
              cargoPrice={cargoPrice}
              totalSum={finalTotal}
              hasAddress={!!(savedAddress && (savedAddress.addressLine || savedAddress.formatted))}
              address={savedAddress}
              onOrderConfirmed={handleOrderConfirmed}
            />
          </CheckoutPaymentProvider>
        </aside>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        initialAddress={savedAddress}
      />

      <OrderConfirmedModal
        isOpen={isOrderConfirmedOpen}
        onClose={handleOrderConfirmedClose}
        addressText={orderConfirmedPayload?.addressText || ''}
        cartItems={orderConfirmedPayload?.cartSnapshot || []}
      />
    </div>
  );
};

export default Checkout;
