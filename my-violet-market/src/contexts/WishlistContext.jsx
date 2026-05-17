import React, {

  createContext,

  useContext,

  useState,

  useEffect,

  useCallback,

} from 'react';

import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { useUser } from './UserContext';

import { useToast } from './ToastContext';

import { fetchWishlist, toggleWishlistItem } from '../api/wishlistApi';



const WishlistContext = createContext();



export const useWishlist = () => {

  const context = useContext(WishlistContext);

  if (!context) {

    throw new Error('useWishlist must be used within a WishlistProvider');

  }

  return context;

};



const productIdKey = (id) => String(id);



export const WishlistProvider = ({ children }) => {

  const navigate = useNavigate();

  const { t } = useTranslation();

  const { showToast } = useToast();

  const { authToken, userData } = useUser();

  const [wishlist, setWishlist] = useState([]);

  const [productIds, setProductIds] = useState(() => new Set());

  const [loading, setLoading] = useState(false);



  const syncFromResponse = useCallback((data) => {

    const ids = new Set((data.productIds || []).map(productIdKey));

    setProductIds(ids);

    setWishlist(Array.isArray(data.products) ? data.products : []);

  }, []);



  const loadWishlist = useCallback(async () => {

    if (!authToken) {

      setWishlist([]);

      setProductIds(new Set());

      return;

    }

    setLoading(true);

    try {

      const data = await fetchWishlist(authToken);

      syncFromResponse(data);

    } catch (err) {

      console.error('Wishlist yuklanmadi:', err);

    } finally {

      setLoading(false);

    }

  }, [authToken, syncFromResponse]);



  useEffect(() => {

    loadWishlist();

  }, [loadWishlist, userData.id]);



  useEffect(() => {

    localStorage.removeItem('wishlist');

  }, []);



  const isInWishlist = useCallback(

    (productId) => productIds.has(productIdKey(productId)),

    [productIds],

  );



  const toggleWishlist = useCallback(

    async (product) => {

      if (product?.id == null) return;



      if (!authToken) {

        showToast(t('wishlist.loginRequired'), 'info');

        navigate('/login');

        return;

      }



      const prevIds = new Set(productIds);

      const prevList = wishlist;

      const idStr = productIdKey(product.id);

      const wasLiked = productIds.has(idStr);



      if (wasLiked) {

        const nextIds = new Set(productIds);

        nextIds.delete(idStr);

        setProductIds(nextIds);

        setWishlist((list) => list.filter((p) => productIdKey(p.id) !== idStr));

      } else {

        const nextIds = new Set(productIds);

        nextIds.add(idStr);

        setProductIds(nextIds);

        setWishlist((list) => {

          if (list.some((p) => productIdKey(p.id) === idStr)) return list;

          return [product, ...list];

        });

      }



      try {

        const data = await toggleWishlistItem(authToken, product.id);

        syncFromResponse(data);

      } catch (err) {

        setProductIds(prevIds);

        setWishlist(prevList);

        console.error('Wishlist toggle xato:', err);

        if (err.code === 'PRODUCT_NOT_FOUND') {

          showToast(t('wishlist.productNotFound'), 'error');

        } else if (err.status === 401) {

          showToast(t('wishlist.loginRequired'), 'info');

          navigate('/login');

        } else {

          showToast(t('wishlist.toggleError'), 'error');

        }

      }

    },

    [authToken, navigate, productIds, wishlist, syncFromResponse, showToast, t],

  );



  const removeFromWishlist = useCallback(

    async (productId) => {

      const item = wishlist.find((p) => productIdKey(p.id) === productIdKey(productId));

      if (item) await toggleWishlist(item);

    },

    [wishlist, toggleWishlist],

  );



  const value = {

    wishlist,

    productIds,

    loading,

    toggleWishlist,

    isInWishlist,

    removeFromWishlist,

    refreshWishlist: loadWishlist,

  };



  return (

    <WishlistContext.Provider value={value}>

      {children}

    </WishlistContext.Provider>

  );

};


