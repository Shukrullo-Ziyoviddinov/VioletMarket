import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLabelFromOption, getNumberPrice } from '../utils/utils';
import i18n from '../i18n';
import { useUser } from './UserContext';
import { useToast } from './ToastContext';
import {
  fetchCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  dismissCartUrgency,
  clearCartApi,
  checkoutCartApi,
} from '../api/cartApi';

const CartContext = createContext();

function parseUrgencyMs(value) {
  if (!value) return NaN;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

function buildCartPayload(product, color, size, storage, model) {
  const lang = i18n.language || 'uz';
  const colorLabel = getLabelFromOption(color, lang);
  const sizeLabel = getLabelFromOption(size, lang);
  const storageLabel = getLabelFromOption(storage, lang);
  const modelLabel = getLabelFromOption(model, lang);

  const price =
    getNumberPrice(model) ??
    getNumberPrice(storage) ??
    getNumberPrice(color) ??
    getNumberPrice(product) ??
    0;

  const originalPrice =
    getNumberPrice(model?.originalPrice) ??
    getNumberPrice(storage?.originalPrice) ??
    getNumberPrice(color?.originalPrice) ??
    getNumberPrice(product?.originalPrice) ??
    price;

  let image = '/img/no-image.png';
  if (model?.image) image = model.image;
  else if (storage?.image) image = storage.image;
  else if (color?.mainImage) image = color.mainImage;
  else if (product?.image) image = product.image;

  return {
    productId: product?.id,
    title: product?.title || 'Mahsulot',
    price,
    originalPrice,
    color: colorLabel,
    size: sizeLabel,
    storage: storageLabel,
    model: modelLabel,
    image,
    quantity: 1,
    countries: product?.countries || [],
    weight: product?.weight || 300,
  };
}

export const CartProvider = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { authToken, userData } = useUser();
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(
    localStorage.getItem('selectedDeliveryType') || 'toshkent',
  );
  const [selectedCargoOptions, setSelectedCargoOptions] = useState(
    JSON.parse(localStorage.getItem('selectedCargoOptions') || '{}'),
  );

  const syncFromResponse = useCallback((data) => {
    setCart(Array.isArray(data.items) ? data.items : []);
  }, []);

  const loadCart = useCallback(async () => {
    if (!authToken) {
      setCart([]);
      setCartLoading(false);
      setCartReady(true);
      return;
    }
    setCartLoading(true);
    try {
      const data = await fetchCart(authToken);
      syncFromResponse(data);
    } catch (err) {
      console.error('Savat yuklanmadi:', err);
    } finally {
      setCartLoading(false);
      setCartReady(true);
    }
  }, [authToken, syncFromResponse]);

  useEffect(() => {
    loadCart();
  }, [loadCart, userData.id]);

  useEffect(() => {
    localStorage.removeItem('cart');
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedDeliveryType', selectedDeliveryType);
  }, [selectedDeliveryType]);

  useEffect(() => {
    localStorage.setItem('selectedCargoOptions', JSON.stringify(selectedCargoOptions));
  }, [selectedCargoOptions]);

  const addToCart = useCallback(
    async (product, color, size, storage, model) => {
      if (product?.id == null) {
        throw new Error('INVALID_PRODUCT');
      }

      if (!authToken) {
        showToast(t('cart.loginRequired'), 'info');
        navigate('/login');
        throw new Error('UNAUTHORIZED');
      }

      const payload = buildCartPayload(product, color, size, storage, model);
      const data = await addCartItem(authToken, payload);
      syncFromResponse(data);
      return payload;
    },
    [authToken, navigate, showToast, syncFromResponse, t],
  );

  const updateQuantity = useCallback(
    async (index, change) => {
      const item = cart[index];
      if (!item?.cartItemId || !authToken) return;

      try {
        const data = await updateCartItemQuantity(authToken, item.cartItemId, change);
        syncFromResponse(data);
      } catch (err) {
        console.error('Savat miqdori yangilanmadi:', err);
        showToast(t('cart.updateError'), 'error');
      }
    },
    [authToken, cart, showToast, syncFromResponse, t],
  );

  const removeFromCart = useCallback(
    async (index) => {
      const item = cart[index];
      if (!item?.cartItemId || !authToken) return;

      try {
        const data = await removeCartItem(authToken, item.cartItemId);
        syncFromResponse(data);
      } catch (err) {
        console.error('Savatdan o\'chirilmadi:', err);
        showToast(t('cart.updateError'), 'error');
      }
    },
    [authToken, cart, showToast, syncFromResponse, t],
  );

  const clearCart = useCallback(async () => {
    if (!authToken) {
      setCart([]);
      return;
    }
    try {
      const data = await clearCartApi(authToken);
      syncFromResponse(data);
    } catch (err) {
      console.error('Savat tozalanmadi:', err);
      showToast(t('cart.updateError'), 'error');
      throw err;
    }
  }, [authToken, showToast, syncFromResponse, t]);

  const checkoutCart = useCallback(async () => {
    if (!authToken) {
      throw new Error('UNAUTHORIZED');
    }
    const data = await checkoutCartApi(authToken);
    syncFromResponse(data);
    return data;
  }, [authToken, syncFromResponse]);

  const getTotal = useCallback(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = item.quantity || 1;
      return sum + price * quantity;
    }, 0);
  }, [cart]);

  const getTotalItems = useCallback(() => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cart]);

  const changeDeliveryType = (type) => {
    setSelectedDeliveryType(type);
  };

  const updateCargoSelection = (country, type) => {
    setSelectedCargoOptions((prev) => ({
      ...prev,
      [country.toLowerCase()]: type,
    }));
  };

  const urgencyItems = useMemo(() => {
    const withUrgency = cart.filter((item) => Number.isFinite(parseUrgencyMs(item?.urgencyNextShowAt)));
    if (withUrgency.length === 0) return [];
    return withUrgency.sort(
      (a, b) => parseUrgencyMs(a.urgencyNextShowAt) - parseUrgencyMs(b.urgencyNextShowAt),
    );
  }, [cart]);

  const dismissUrgencyBanner = useCallback(
    async (cartItem) => {
      if (!cartItem) return;

      if (authToken && cartItem.cartItemId) {
        try {
          const data = await dismissCartUrgency(authToken, cartItem.cartItemId);
          syncFromResponse(data);
        } catch (err) {
          console.error('Urgency holati yangilanmadi:', err);
        }
      }

    },
    [authToken, syncFromResponse],
  );

  const value = {
    cart,
    cartLoading,
    cartReady,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkoutCart,
    getTotal,
    getTotalItems,
    selectedDeliveryType,
    changeDeliveryType,
    selectedCargoOptions,
    updateCargoSelection,
    urgencyItems,
    dismissUrgencyBanner,
    refreshCart: loadCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
