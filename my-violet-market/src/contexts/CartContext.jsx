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
import { resolveCargoExpressPolicyForCart } from '../utils/cargoExpressPolicy';
import i18n from '../i18n';
import { useUser } from './UserContext';
import { useAppData } from './AppDataContext';
import { useToast } from './ToastContext';
import {
  fetchCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  dismissCartUrgency,
  clearCartApi,
  checkoutCartApi,
  updateCartCargoOptionsApi,
} from '../api/cartApi';
import { hydrateSelectedCargoOptions } from '../utils/cargoGrouping';

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

  const getStockPriceByLabel = (stockMap, label) => {
    if (!stockMap || typeof stockMap !== 'object' || Array.isArray(stockMap)) return null;
    const target = String(label || '').trim().toLowerCase();
    if (!target) return null;
    const key = Object.keys(stockMap).find((k) => String(k || '').trim().toLowerCase() === target);
    if (!key) return null;
    const entry = stockMap[key];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    return getNumberPrice(entry.price);
  };
  const getStockOriginalPriceByLabel = (stockMap, label) => {
    if (!stockMap || typeof stockMap !== 'object' || Array.isArray(stockMap)) return null;
    const target = String(label || '').trim().toLowerCase();
    if (!target) return null;
    const key = Object.keys(stockMap).find((k) => String(k || '').trim().toLowerCase() === target);
    if (!key) return null;
    const entry = stockMap[key];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    return getNumberPrice(entry.originalPrice);
  };

  const modelStockPrice = getStockPriceByLabel(
    color?.modelStock || product?.modelStock,
    modelLabel,
  );
  const modelStockOriginalPrice = getStockOriginalPriceByLabel(
    color?.modelStock || product?.modelStock,
    modelLabel,
  );
  const storageStockPrice = getStockPriceByLabel(
    color?.storageStock || product?.storageStock,
    storageLabel,
  );
  const storageStockOriginalPrice = getStockOriginalPriceByLabel(
    color?.storageStock || product?.storageStock,
    storageLabel,
  );

  const price =
    getNumberPrice(model) ??
    modelStockPrice ??
    getNumberPrice(storage) ??
    storageStockPrice ??
    getNumberPrice(color) ??
    getNumberPrice(product) ??
    0;

  const originalPrice =
    getNumberPrice(model?.originalPrice) ??
    modelStockOriginalPrice ??
    getNumberPrice(storage?.originalPrice) ??
    storageStockOriginalPrice ??
    getNumberPrice(color?.originalPrice) ??
    getNumberPrice(product?.originalPrice) ??
    price;

  let image = '/img/no-image.png';
  if (model?.image) image = model.image;
  else if (storage?.image) image = storage.image;
  else if (color?.mainImage) image = color.mainImage;
  else if (product?.mainImage) image = product.mainImage;
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
    sellerId: String(product?.sellerId || '').trim(),
    countries: product?.countries || [],
    weight: product?.weight || 300,
    cargoExpressPolicy: resolveCargoExpressPolicyForCart(product),
  };
}

function readLocalDeliveryType() {
  try {
    return localStorage.getItem('selectedDeliveryType') || 'toshkent';
  } catch {
    return 'toshkent';
  }
}

export const CartProvider = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { authToken, userData } = useUser();
  const { getSellerById } = useAppData();
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(readLocalDeliveryType);
  const [selectedCargoOptions, setSelectedCargoOptions] = useState({});

  const syncFromResponse = useCallback((data) => {
    const items = Array.isArray(data?.items) ? data.items : [];
    setCart(
      items.map((item) => {
        if (String(item?.sellerCountry || '').trim()) return item;
        const sellerId = String(item?.sellerId || '').trim();
        if (!sellerId || typeof getSellerById !== 'function') return item;
        const sellerCountry = String(getSellerById(sellerId)?.sellerCountry || '')
          .trim()
          .toLowerCase();
        return sellerCountry ? { ...item, sellerCountry } : item;
      }),
    );
    setSelectedCargoOptions(
      hydrateSelectedCargoOptions(items, data?.selectedCargoOptions),
    );
  }, [getSellerById]);

  const loadCart = useCallback(async () => {
    if (!authToken) {
      setCart([]);
      setSelectedCargoOptions({});
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
    try {
      localStorage.removeItem('cart');
      localStorage.removeItem('selectedCargoOptions');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('selectedDeliveryType', selectedDeliveryType);
    } catch {
      // ignore
    }
  }, [selectedDeliveryType]);

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

      try {
        const payload = buildCartPayload(product, color, size, storage, model);
        const data = await addCartItem(authToken, payload);
        syncFromResponse(data);
        return payload;
      } catch (err) {
        if (err?.message !== 'UNAUTHORIZED') {
          showToast(err?.message || t('cart.updateError'), 'error');
        }
        throw err;
      }
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

  const checkoutCart = useCallback(async (paymentMethod, deliveryAddress = null) => {
    if (!authToken) {
      throw new Error('UNAUTHORIZED');
    }
    const data = await checkoutCartApi(authToken, {
      paymentMethod,
      deliveryAddress,
    });
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

  const updateCargoSelection = useCallback(
    async (country, type) => {
      const key = String(country || '').trim().toLowerCase();
      const nextType = String(type || '').trim().toLowerCase();
      if (!key || (nextType !== 'standard' && nextType !== 'express')) return;

      const prev = selectedCargoOptions;
      setSelectedCargoOptions((current) => ({ ...current, [key]: nextType }));

      if (!authToken) return;
      try {
        const data = await updateCartCargoOptionsApi(authToken, {
          country: key,
          type: nextType,
        });
        syncFromResponse(data);
      } catch (err) {
        console.error('Cargo tanlovi saqlanmadi:', err);
        setSelectedCargoOptions(prev);
        showToast(t('cart.updateError'), 'error');
      }
    },
    [authToken, selectedCargoOptions, showToast, syncFromResponse, t],
  );

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
