import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatPrice, getLabelFromOption, getNumberPrice } from '../utils/utils';
import i18n from '../i18n';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(
    localStorage.getItem('selectedDeliveryType') || 'toshkent'
  );
  const [selectedCargoOptions, setSelectedCargoOptions] = useState(
    JSON.parse(localStorage.getItem('selectedCargoOptions') || '{}')
  );

  // LocalStorage dan yuklash
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        const withIds = parsed.map((item, i) => ({
          ...item,
          cartItemId: item.cartItemId || `cart-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
        }));
        setCart(withIds);
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  // LocalStorage ga saqlash
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Delivery type saqlash
  useEffect(() => {
    localStorage.setItem('selectedDeliveryType', selectedDeliveryType);
  }, [selectedDeliveryType]);

  // Cargo options saqlash
  useEffect(() => {
    localStorage.setItem('selectedCargoOptions', JSON.stringify(selectedCargoOptions));
  }, [selectedCargoOptions]);

  // Savatga qo'shish
  const addToCart = (product, color, size, storage, model) => {
    const lang = i18n.language || 'uz';
    const colorLabel = getLabelFromOption(color, lang);
    const sizeLabel = getLabelFromOption(size, lang);
    const storageLabel = getLabelFromOption(storage, lang);
    const modelLabel = getLabelFromOption(model, lang);

    // Narx aniqlash (priority: model > storage > color > product)
    const price = getNumberPrice(model) ?? 
                  getNumberPrice(storage) ?? 
                  getNumberPrice(color) ?? 
                  getNumberPrice(product) ?? 0;

    const originalPrice = getNumberPrice(model?.originalPrice) ?? 
                         getNumberPrice(storage?.originalPrice) ?? 
                         getNumberPrice(color?.originalPrice) ?? 
                         getNumberPrice(product?.originalPrice) ?? price;

    // Rasm aniqlash (priority: model > storage > color > product)
    let image = '/img/no-image.png';
    if (model?.image) image = model.image;
    else if (storage?.image) image = storage.image;
    else if (color?.mainImage) image = color.mainImage;
    else if (product?.image) image = product.image;

    const cartItem = {
      id: product?.id ?? Date.now(),
      cartItemId: `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: product?.title || 'Mahsulot',
      price: price,
      originalPrice: originalPrice,
      color: colorLabel,
      size: sizeLabel,
      storage: storageLabel,
      model: modelLabel,
      image: image,
      quantity: 1,
      countries: product?.countries || [],
      weight: product?.weight || 300
    };

    setCart(prev => [...prev, cartItem]);
    return cartItem;
  };

  // Miqdorni yangilash (obektni mutate qilmaslik — yangi nusxa yaratish)
  const updateQuantity = (index, change) => {
    setCart(prev => {
      const newCart = [...prev];
      if (!newCart[index]) return prev;
      const newQuantity = (newCart[index].quantity || 1) + change;
      if (newQuantity > 0) {
        newCart[index] = { ...newCart[index], quantity: newQuantity };
        return newCart;
      }
      return prev;
    });
  };

  // Savatdan o'chirish
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Savatni tozalash
  const clearCart = () => {
    setCart([]);
  };

  // Jami summa
  const getTotal = () => {
    return cart.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
  };

  // Jami dona
  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  // Delivery type o'zgartirish
  const changeDeliveryType = (type) => {
    setSelectedDeliveryType(type);
  };

  // Cargo option o'zgartirish
  const updateCargoSelection = (country, type) => {
    setSelectedCargoOptions(prev => ({
      ...prev,
      [country.toLowerCase()]: type
    }));
  };

  const value = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotal,
    getTotalItems,
    selectedDeliveryType,
    changeDeliveryType,
    selectedCargoOptions,
    updateCargoSelection
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

