import React, { createContext, useContext, useMemo, useState } from 'react';

export const CHECKOUT_PAYMENT_ON_DELIVERY = 'on_delivery';

const CheckoutPaymentContext = createContext(null);

export const useCheckoutPayment = () => {
  const context = useContext(CheckoutPaymentContext);
  if (!context) {
    throw new Error('useCheckoutPayment must be used within CheckoutPaymentProvider');
  }
  return context;
};

export const CheckoutPaymentProvider = ({ children }) => {
  const [selectedPayment, setSelectedPayment] = useState(null);

  const value = useMemo(
    () => ({
      selectedPayment,
      setSelectedPayment,
      isPayOnDelivery: selectedPayment === CHECKOUT_PAYMENT_ON_DELIVERY,
    }),
    [selectedPayment],
  );

  return (
    <CheckoutPaymentContext.Provider value={value}>
      {children}
    </CheckoutPaymentContext.Provider>
  );
};
