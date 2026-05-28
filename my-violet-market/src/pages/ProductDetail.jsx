import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from '../contexts/ToastContext';
import { useViewedAt } from '../contexts/ViewedAtContext';
import { useUser } from '../contexts/UserContext';
import { useComments } from '../contexts/CommentsContext';
import { useTranslation } from 'react-i18next';
import { formatPrice, getNumberPrice, normalizeImagePath, getLabelFromOption, getLocalizedText } from '../utils/utils';
import ButtonLoader from '../components/ButtonLoader/ButtonLoader';
import ProductCard from '../components/ProductCard';
import StylingIdea from '../components/StylingIdea';
import Recommended from '../components/Recommended';
import TavsiyaEtamiz from '../components/TavsiyaEtamiz';
import VideoModal from '../components/VideoModal';
import ImageModal from '../components/ImageModal';
import CommentsSection from '../components/CommentsSection';
import CommentsModal from '../components/CommentsModal';
import DeliveryInfo from '../components/DeliveryInfo';
import FlashSaleCountdown from '../components/FlashSaleCountdown/FlashSaleCountdown';
import DragScroll from '../components/DragScroll';
import ProductDetailSalesFooter from '../components/ProductDetailSalesFooter/ProductDetailSalesFooter';
import { useMainImageDrag } from '../components/mainImageDrag';
import SizeChartUpperBodyDiagram from '../components/SizeChartUpperBodyDiagram/SizeChartUpperBodyDiagram';
import SizeChartFootwearDiagram from '../components/SizeChartFootwearDiagram/SizeChartFootwearDiagram';
import SizeChartPantsDiagram from '../components/SizeChartPantsDiagram/SizeChartPantsDiagram';
import SizeChartGuidanceFooter from '../components/SizeChartGuidanceFooter/SizeChartGuidanceFooter';
import ProductPolicy from '../components/ProductPolicy';
import SellerSubscriberCount from '../components/SellerSubscriberCount';
import SellerSubscribeButton from '../components/SellerSubscribeButton';
import { useAppData } from '../contexts/AppDataContext';
import { SkeletonPulse } from '../components/SkeletonLoader';
import { useSellerSubscription } from '../hooks/useSellerSubscription';
import {
  isValidTypeSize,
  resolveSizeChartGuideSrc,
  typeSizeI18nKey,
} from '../constants/sizeChartKind';
import { apiUrl } from '../config/api';
import '../components/FlashSaleSection/FlashSaleSection.css';
import './ProductDetail.css';

const PRODUCT_DETAIL_HISTORY_KEY = 'productDetailViewedProducts';

const normalizeStockLabel = (value) => String(value ?? '').trim().toLowerCase();

const toStockNumber = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
};

const getStockEntryQuantity = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return toStockNumber(value.quantity);
  }
  return toStockNumber(value);
};

const sumStockNumbers = (items) => {
  if (!Array.isArray(items)) return null;
  let total = 0;
  let found = false;

  for (const item of items) {
    const qty = toStockNumber(item?.quantity);
    if (qty === null) continue;
    total += qty;
    found = true;
  }

  return found ? total : null;
};

const sumStockMapValues = (stockMap) => {
  if (!stockMap || typeof stockMap !== 'object' || Array.isArray(stockMap)) return null;
  const values = Object.values(stockMap);
  let total = 0;
  let found = false;

  for (const value of values) {
    const qty = getStockEntryQuantity(value);
    if (qty === null) continue;
    total += qty;
    found = true;
  }

  return found ? total : null;
};

const pickBestStockCandidate = (candidates) => {
  const values = (Array.isArray(candidates) ? candidates : [])
    .map((value) => {
      if (value == null || value === '') return null;
      const num = Number(value);
      if (!Number.isFinite(num)) return null;
      return Math.max(0, num);
    })
    .filter((value) => value != null);
  if (values.length === 0) return null;
  return Math.max(...values);
};

const getProductVariantQuantityTotal = (product) => {
  const rootVariantCandidate = pickBestStockCandidate([
    sumStockNumbers(product?.models),
    sumStockNumbers(product?.storage),
    sumStockMapValues(product?.modelStock),
    sumStockMapValues(product?.storageStock),
    sumStockMapValues(product?.sizeStock),
    sumStockMapValues(product?.colorStock),
  ]);

  const colors = Array.isArray(product?.colors) ? product.colors : [];

  if (colors.length > 0) {
    let total = 0;
    let found = false;

    for (const color of colors) {
      const colorVariantCandidate = pickBestStockCandidate([
        sumStockNumbers(color?.models),
        sumStockNumbers(color?.storage),
        sumStockMapValues(color?.modelStock),
        sumStockMapValues(color?.storageStock),
        sumStockMapValues(color?.sizeStock),
      ]);
      if (colorVariantCandidate !== null) {
        total += colorVariantCandidate;
        found = true;
        continue;
      }
      const colorQty = toStockNumber(color?.quantity);
      if (colorQty !== null) {
        total += colorQty;
        found = true;
      }
    }

    if (found) return total;
  }

  const effectiveQty = toStockNumber(product?.effectiveQuantity);
  const finalVariantCandidate = pickBestStockCandidate([effectiveQty, rootVariantCandidate]);
  if (finalVariantCandidate !== null) return finalVariantCandidate;

  return toStockNumber(product?.quantity);
};

const findStockValue = (stockMap, label) => {
  if (!stockMap || typeof stockMap !== 'object' || Array.isArray(stockMap)) return null;
  const target = normalizeStockLabel(label);
  if (!target) return null;
  const matchedKey = Object.keys(stockMap).find((key) => normalizeStockLabel(key) === target);
  if (!matchedKey) return null;
  return getStockEntryQuantity(stockMap[matchedKey]);
};

const getSizesFromColor = (color) => {
  if (!color || typeof color !== 'object') return [];
  const stock = color.sizeStock;
  if (stock && typeof stock === 'object' && !Array.isArray(stock)) {
    return Object.keys(stock);
  }
  if (Array.isArray(color.sizes)) {
    return color.sizes;
  }
  return [];
};

const normalizeVariantLabel = (value) => String(value || '').trim().toLowerCase();

const getStockQuantityByLabel = (stockMap, label) => {
  if (!stockMap || typeof stockMap !== 'object') return null;
  const target = normalizeVariantLabel(label);
  if (!target) return null;
  const key = Object.keys(stockMap).find((k) => normalizeVariantLabel(k) === target);
  if (!key) return null;
  const quantity = Number(stockMap[key]);
  if (Number.isFinite(quantity)) return quantity;
  return getStockEntryQuantity(stockMap[key]);
};

const getStockPriceByLabel = (stockMap, label) => {
  if (!stockMap || typeof stockMap !== 'object' || Array.isArray(stockMap)) return null;
  const target = normalizeVariantLabel(label);
  if (!target) return null;
  const key = Object.keys(stockMap).find((k) => normalizeVariantLabel(k) === target);
  if (!key) return null;
  const entry = stockMap[key];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  return getNumberPrice(entry.price);
};

const getStockOriginalPriceByLabel = (stockMap, label) => {
  if (!stockMap || typeof stockMap !== 'object' || Array.isArray(stockMap)) return null;
  const target = normalizeVariantLabel(label);
  if (!target) return null;
  const key = Object.keys(stockMap).find((k) => normalizeVariantLabel(k) === target);
  if (!key) return null;
  const entry = stockMap[key];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  return getNumberPrice(entry.originalPrice);
};

const getStorageValue = (storage) =>
  typeof storage === 'object' && storage?.size ? storage.size : storage;

const getModelValue = (model) =>
  typeof model === 'object' && model?.name ? model.name : model;

const getStockAwareOptions = (fallbackList, stockMap) => {
  if (stockMap && typeof stockMap === 'object' && !Array.isArray(stockMap)) {
    return Object.keys(stockMap);
  }
  return Array.isArray(fallbackList) ? fallbackList : [];
};

const getProductMainImage = (product) =>
  product?.image || product?.mainImage || product?.colors?.[0]?.mainImage || '/img/no-image.png';

const resolveCommentPreviewLimit = () => {
  if (typeof window === 'undefined') return 3;
  const width = Number(window.innerWidth) || 0;
  if (width >= 385 && width <= 450) return 4;
  return 3;
};

const ProductDetail = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'uz';
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { getCommentsByProductId, comments, loadCommentsForProduct } = useComments();
  const { recordView } = useViewedAt();
  const { authToken, authLoading } = useUser();
  const { allProducts, getSellerById, loading, error } = useAppData();
  const catalog = allProducts || [];
  const showDetailSkeleton = loading && !error;
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [shareSheetOffset, setShareSheetOffset] = useState(0);
  const [isShareSheetDragging, setIsShareSheetDragging] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [productData, setProductData] = useState(null);
  const [serverProductQty, setServerProductQty] = useState(null);
  const [commentPreviewLimit, setCommentPreviewLimit] = useState(resolveCommentPreviewLimit);
  const [commentsPreviewMode, setCommentsPreviewMode] = useState('spread');
  const commentsDisplayRef = useRef(null);
  const commentsIconRef = useRef(null);
  const commentsCountRef = useRef(null);

  const shareSheetStartYRef = useRef(0);
  const shareSheetCurrentYRef = useRef(0);

  // Mahsulot ma'lumotlarini yuklash va yangilash
  const loadProductData = useCallback(() => {
    setServerProductQty(null);
    const savedProduct = sessionStorage.getItem('selectedProduct');
    if (savedProduct) {
      try {
        const product = JSON.parse(savedProduct);
        const latestProduct =
          catalog.find((p) => String(p.id) === String(product?.id)) || product;
        // Debug: product ma'lumotlarini tekshirish
        console.log('Product loaded:', {
          id: latestProduct.id,
          countries: latestProduct.countries,
          deliveryInfo: latestProduct.deliveryInfo,
          hasCountries: !!latestProduct.countries,
          isArray: Array.isArray(latestProduct.countries),
          hasUzb: latestProduct.countries?.some(c => c?.toLowerCase() === "uzb"),
          hasDeliveryInfo: !!latestProduct.deliveryInfo
        });
        setProductData(latestProduct);
        const colorList = Array.isArray(latestProduct.colors) ? latestProduct.colors : [];
        const colorStock = latestProduct?.colorStock;
        const stockColorList =
          colorList.length === 0 && colorStock && typeof colorStock === 'object'
            ? Object.keys(colorStock).map((label) => ({ name: label, colorFilter: label }))
            : [];
        // Media doim ko'rinishi uchun stokdan qat'i nazar birinchi rangni tanlaymiz.
        const firstAvailableColor = colorList[0] || stockColorList[0] || null;
        const initialSizes = getStockAwareOptions(
          firstAvailableColor?.sizes,
          firstAvailableColor?.sizeStock || latestProduct?.sizeStock,
        );
        const initialStorageOptions = getStockAwareOptions(
          firstAvailableColor?.storage || latestProduct?.storage,
          firstAvailableColor?.storageStock || latestProduct?.storageStock,
        );
        const initialModelOptions = getStockAwareOptions(
          firstAvailableColor?.models || latestProduct?.models,
          firstAvailableColor?.modelStock || latestProduct?.modelStock,
        );

        setSelectedColor(firstAvailableColor);
        setSelectedSize(initialSizes[0] || null);
        setSelectedStorage(initialStorageOptions[0] || null);
        setSelectedModel(initialModelOptions[0] || null);
        setCurrentImageIndex(0);
        setImageErrors(new Set());
        window.scrollTo({ top: 0, behavior: 'instant' });
      } catch (e) {
        console.error('Error loading product:', e);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate, catalog]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  useEffect(() => {
    let cancelled = false;
    const currentId = productData?.id;
    if (currentId == null) return undefined;

    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/products/${encodeURIComponent(currentId)}`));
        if (!res.ok) return;
        const fresh = await res.json();
        if (!fresh || cancelled) return;
        const computedQty =
          toStockNumber(fresh?.effectiveQuantity) ??
          getProductVariantQuantityTotal(fresh);
        setProductData((prev) => {
          if (!prev || String(prev.id) !== String(currentId)) return prev;
          return fresh;
        });
        setServerProductQty(computedQty ?? 0);
        try {
          sessionStorage.setItem('selectedProduct', JSON.stringify(fresh));
        } catch {
          // sessionStorage cheklangan bo'lsa ham sahifa ishlashi kerak.
        }
      } catch {
        // Silent fallback: selectedProduct ishlamasa ham sahifa ochiq qoladi.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productData?.id]);

  useEffect(() => {
    if (authLoading || !authToken || !productData?.id) return;
    recordView(productData.id);
  }, [authLoading, authToken, productData?.id, recordView]);

  useEffect(() => {
    const handleResize = () => {
      setCommentPreviewLimit(resolveCommentPreviewLimit());
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!productData) return;

    try {
      const rawHistory = sessionStorage.getItem(PRODUCT_DETAIL_HISTORY_KEY);
      const history = rawHistory ? JSON.parse(rawHistory) : [];
      const safeHistory = Array.isArray(history) ? history : [];
      const lastItem = safeHistory[safeHistory.length - 1];

      if (!lastItem || String(lastItem.id) !== String(productData.id)) {
        const nextHistory = [...safeHistory, productData];
        sessionStorage.setItem(PRODUCT_DETAIL_HISTORY_KEY, JSON.stringify(nextHistory));
      }
    } catch (error) {
      console.error('Failed to update product detail history:', error);
    }
  }, [productData]);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [productData?.id]);

  const handleBackFromProductDetail = useCallback(() => {
    try {
      const rawHistory = sessionStorage.getItem(PRODUCT_DETAIL_HISTORY_KEY);
      const history = rawHistory ? JSON.parse(rawHistory) : [];
      const safeHistory = Array.isArray(history) ? history : [];

      if (safeHistory.length > 1) {
        const nextHistory = safeHistory.slice(0, -1);
        const previousProduct = nextHistory[nextHistory.length - 1];

        sessionStorage.setItem(PRODUCT_DETAIL_HISTORY_KEY, JSON.stringify(nextHistory));
        sessionStorage.setItem('selectedProduct', JSON.stringify(previousProduct));
        window.dispatchEvent(new Event('productStorageChange'));
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
    } catch (error) {
      console.error('Failed to handle product detail back action:', error);
    }

    navigate(-1);
  }, [navigate]);

  // sessionStorage o'zgarishlarini kuzatish (boshqa tab yoki component'dan o'zgarishlar uchun)
  useEffect(() => {
    let isMounted = true;

    const handleStorageChange = (e) => {
      if (e.key === 'selectedProduct' && isMounted) {
        loadProductData();
      }
    };

    // Custom event listener - bir xil tab ichida o'zgarishlar uchun
    const handleCustomStorageChange = () => {
      if (isMounted) {
        loadProductData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productStorageChange', handleCustomStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productStorageChange', handleCustomStorageChange);
    };
  }, [loadProductData]);

  // Size chart modal ochilganda scroll bloklash
  useEffect(() => {
    if (isSizeChartOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isSizeChartOpen]);

  useEffect(() => {
    document.body.classList.add('product-detail-page-active');
    return () => {
      document.body.classList.remove('product-detail-page-active');
    };
  }, []);

  // Share menu tashqariga bosilganda yopish
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isShareMenuOpen && !e.target.closest('.share-menu') && !e.target.closest('.share-btn')) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isShareMenuOpen]);

  useEffect(() => {
    if (!isShareMenuOpen) {
      setShareSheetOffset(0);
      setIsShareSheetDragging(false);
      document.body.classList.remove('share-menu-open');
      return;
    }

    if (window.matchMedia('(max-width: 768px)').matches) {
      document.body.classList.add('share-menu-open');
    }

    return () => {
      document.body.classList.remove('share-menu-open');
    };
  }, [isShareMenuOpen]);

  // Sichqoncha wheel va drag orqali scroll qilish
  useEffect(() => {
    if (!productData) return;

    const containers = ['.colors-container', '.sizes-container', '.storage-container', '.models-container'];
    
    const handleWheel = (e) => {
      const container = e.currentTarget;
      const isScrollable = container.scrollWidth > container.clientWidth;
      
      if (isScrollable) {
        // Agar gorizontal scroll qilinadigan bo'lsa
        if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
          // Vertical wheel event ni horizontal scroll ga aylantirish
          container.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      }
    };

    // Sichqoncha bilan bosib surib scroll qilish
    const dragState = new Map(); // Har bir container uchun alohida state

    const handleMouseDown = (e) => {
      // Faqat left mouse button
      if (e.button !== 0) return;
      
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      
      dragState.set(container, {
        isDown: true,
        startX: e.pageX - rect.left,
        scrollLeft: container.scrollLeft
      });
      
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
      e.preventDefault();
    };

    const handleMouseUp = (e) => {
      containers.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const state = dragState.get(el);
          if (state && state.isDown) {
            dragState.set(el, { ...state, isDown: false });
            el.style.cursor = 'grab';
            el.style.userSelect = '';
          }
        });
      });
    };

    const handleMouseMove = (e) => {
      containers.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(container => {
          const state = dragState.get(container);
          if (state && state.isDown) {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const x = e.pageX - rect.left;
            const walk = (x - state.startX) * 2;
            container.scrollLeft = state.scrollLeft - walk;
          }
        });
      });
    };

    const handleMouseLeave = (e) => {
      const container = e.currentTarget;
      const state = dragState.get(container);
      if (state && state.isDown) {
        dragState.set(container, { ...state, isDown: false });
        container.style.cursor = 'grab';
        container.style.userSelect = '';
      }
    };

    const timeoutId = setTimeout(() => {
      containers.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.style.cursor = 'grab';
          el.addEventListener('wheel', handleWheel, { passive: false });
          el.addEventListener('mousedown', handleMouseDown);
          el.addEventListener('mouseleave', handleMouseLeave);
          el.addEventListener('mousemove', handleMouseMove);
        });
      });
      
      // Document level mouseup - sichqoncha tashqariga chiqib ketsa ham
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      containers.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.removeEventListener('wheel', handleWheel);
          el.removeEventListener('mousedown', handleMouseDown);
          el.removeEventListener('mouseleave', handleMouseLeave);
          el.removeEventListener('mousemove', handleMouseMove);
          el.style.cursor = '';
          el.style.userSelect = '';
        });
      });
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      dragState.clear();
    };
  }, [productData]);

  useEffect(() => {
    if (productData?.id != null) {
      loadCommentsForProduct(productData.id);
    }
  }, [productData?.id, loadCommentsForProduct]);

  // Get all comments for this product
  const allComments = useMemo(() => {
    if (!productData) return [];
    const productId = String(productData.id);
    return getCommentsByProductId(productId);
  }, [productData, comments, getCommentsByProductId]);

  // Calculate rating and comment count (must be before early return)
  const { averageRating, commentCount } = useMemo(() => {
    if (!productData) return { averageRating: 5, commentCount: 0 };
    
    const productId = String(productData.id);
    const comments = getCommentsByProductId(productId);
    const count = comments.length;
    
    // Filter out invalid ratings (should be 1-5)
    const validComments = comments.filter(comment => {
      const rating = Number(comment.rating);
      return !isNaN(rating) && rating >= 1 && rating <= 5;
    });
    
    // If no comments or no valid ratings, return default rating of 5
    if (count === 0 || validComments.length === 0) {
      return { averageRating: 5, commentCount: count };
    }
    
    // Calculate average rating from all valid comments
    const sum = validComments.reduce((acc, comment) => {
      const rating = Number(comment.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return acc;
      }
      return acc + rating;
    }, 0);
    
    const avg = sum / validComments.length;
    
    // Round to 1 decimal place, ensure it's between 1 and 5
    const finalRating = Math.min(5, Math.max(1, Math.round(avg * 10) / 10));
    
    return {
      averageRating: finalRating,
      commentCount: count
    };
  }, [productData, comments, getCommentsByProductId]);
  const detailStarFillLevels = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const raw = Number(averageRating) - index;
        return Math.max(0, Math.min(1, raw));
      }),
    [averageRating],
  );
  const commentImageList = useMemo(
    () =>
      allComments
        .map((comment) =>
          typeof comment?.image === 'string' ? comment.image.trim() : '',
        )
        .filter(Boolean),
    [allComments],
  );
  const commentPreviewImages = useMemo(
    () => commentImageList.slice(0, commentPreviewLimit),
    [commentImageList, commentPreviewLimit],
  );
  const remainingCommentImageCount = Math.max(0, commentImageList.length - commentPreviewImages.length);

  useEffect(() => {
    if (commentPreviewImages.length === 0) {
      setCommentsPreviewMode('spread');
      return undefined;
    }

    const measureMode = () => {
      const rowNode = commentsDisplayRef.current;
      const iconNode = commentsIconRef.current;
      const countNode = commentsCountRef.current;
      if (!rowNode || !iconNode || !countNode) return;

      const imageCount = commentPreviewImages.length;
      const hasMore = remainingCommentImageCount > 0;
      const bubbleSize = 30;
      const spreadGap = 4;
      const previewLeftGap = 2;
      const leadingGap = 7;
      const internalPadding = 24; // left + right padding (12px + 12px)

      const spreadWidth =
        previewLeftGap +
        imageCount * bubbleSize +
        Math.max(0, imageCount - 1) * spreadGap +
        (hasMore ? bubbleSize + spreadGap : 0);

      const occupiedWithoutPreview =
        iconNode.offsetWidth +
        countNode.offsetWidth +
        leadingGap +
        internalPadding;

      const freeWidth = Math.max(0, rowNode.clientWidth - occupiedWithoutPreview);
      const shouldCompact = spreadWidth > freeWidth;
      setCommentsPreviewMode(shouldCompact ? 'compact' : 'spread');
    };

    measureMode();
    window.addEventListener('resize', measureMode);
    return () => {
      window.removeEventListener('resize', measureMode);
    };
  }, [commentPreviewImages.length, remainingCommentImageCount]);

  const detailSellerId = productData?.sellerId;
  const detailSeller = useMemo(
    () => (detailSellerId ? getSellerById(detailSellerId) : null),
    [detailSellerId, getSellerById]
  );
  const sellerProductCountForDetail = useMemo(
    () =>
      detailSellerId
        ? catalog.filter((p) => p.sellerId === detailSellerId).length
        : 0,
    [detailSellerId, catalog]
  );
  const sellerBaseSubscribers = detailSeller?.subscriberCount ?? 0;
  const {
    displayCount: sellerSubscriberDisplay,
    subscribed: sellerSubscribed,
    toggle: sellerSubscribeToggle,
  } = useSellerSubscription(detailSellerId, sellerBaseSubscribers);

  // All images calculation - must be before early return for hooks
  const allImages = useMemo(() => {
    const colorList = Array.isArray(productData?.colors) ? productData.colors : [];
    const selectedLabel = normalizeVariantLabel(getLabelFromOption(selectedColor, lang));
    const resolvedColor =
      colorList.find((color) => {
        const colorLabel = normalizeVariantLabel(getLabelFromOption(color, lang));
        return (
          (selectedLabel && colorLabel && selectedLabel === colorLabel) ||
          (selectedColor?.colorFilter && color?.colorFilter && selectedColor.colorFilter === color.colorFilter) ||
          (selectedColor?.mainImage && color?.mainImage && selectedColor.mainImage === color.mainImage)
        );
      }) || selectedColor;

    const mainImage = resolvedColor?.mainImage || getProductMainImage(productData);
    const hasColorVariants = Array.isArray(productData?.colors) && productData.colors.length > 0;
    const colorThumbnails = Array.isArray(resolvedColor?.thumbnails) ? resolvedColor.thumbnails : [];
    const productThumbnails =
      Array.isArray(productData?.thumbnails) && productData.thumbnails.length > 0
        ? productData.thumbnails
        : [];
    const thumbnails = hasColorVariants ? colorThumbnails : productThumbnails;
    return [
      normalizeImagePath(mainImage),
      ...thumbnails.map(normalizeImagePath)
    ];
  }, [productData, selectedColor, lang]);

  // Carousel funksiyalari - ImageBanner kabi (must be before early return)
  const nextImageSlide = useCallback(() => {
    if (allImages.length > 0) {
      setCurrentImageIndex(prev => (prev + 1) % allImages.length);
    }
  }, [allImages.length]);

  const prevImageSlide = useCallback(() => {
    if (allImages.length > 0) {
      setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);
    }
  }, [allImages.length]);

  const mainImageDrag = useMainImageDrag({
    imageCount: allImages.length,
    disabled: showDetailSkeleton,
    onPrev: prevImageSlide,
    onNext: nextImageSlide,
    resetKey: currentImageIndex,
  });

  const mainImageSlides = useMemo(() => {
    if (allImages.length === 0) {
      return [{ src: normalizeImagePath('/img/no-image.png'), index: 0 }];
    }

    if (allImages.length === 1) {
      return [{ src: allImages[0], index: 0 }];
    }

    const previousIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
    const nextIndex = (currentImageIndex + 1) % allImages.length;

    return [
      { src: allImages[previousIndex], index: previousIndex },
      { src: allImages[currentImageIndex], index: currentImageIndex },
      { src: allImages[nextIndex], index: nextIndex },
    ];
  }, [allImages, currentImageIndex]);

  const colorOptions = useMemo(() => {
    const colors = Array.isArray(productData?.colors) ? productData.colors : [];
    const colorStock = productData?.colorStock;
    if (colors.length === 0 && colorStock && typeof colorStock === 'object') {
      return Object.keys(colorStock).map((label, index) => ({
        key: `color-stock-${label}-${index}`,
        color: { name: label, colorFilter: label },
        available: (getStockEntryQuantity(colorStock[label]) || 0) > 0,
      }));
    }
    return colors.map((color, index) => {
      const stockQty = findStockValue(productData?.colorStock, getLabelFromOption(color, lang));
      const rawQty = stockQty ?? Number(color?.quantity);
      const available = Number.isFinite(rawQty) ? rawQty > 0 : true;
      return {
        key: `${color?.colorFilter || ''}-${color?.mainImage || ''}-${index}`,
        color,
        available,
      };
    });
  }, [productData?.colors, productData?.colorStock, lang]);

  const sizeOptions = useMemo(() => {
    const stock = selectedColor?.sizeStock || productData?.sizeStock;
    const stockKeys =
      stock && typeof stock === 'object' && !Array.isArray(stock)
        ? Object.keys(stock)
        : [];
    if (stockKeys.length > 0) {
      return stockKeys.map((label) => ({
        value: label,
        label,
        available: (getStockEntryQuantity(stock[label]) || 0) > 0,
      }));
    }
    return getSizesFromColor(selectedColor).map((label) => ({
      value: label,
      label,
      available: true,
    }));
  }, [productData?.sizeStock, selectedColor]);

  const storageOptions = useMemo(() => {
    const optionsFromData = Array.isArray(selectedColor?.storage)
      ? selectedColor.storage
      : Array.isArray(productData?.storage)
        ? productData.storage
        : [];
    const stockMap = selectedColor?.storageStock || productData?.storageStock;
    if (optionsFromData.length > 0) {
      return optionsFromData.map((option, index) => {
        const label = getLabelFromOption(option, lang) || String(index);
        const ownQty = Number(option?.quantity);
        const stockQty =
          Number.isFinite(ownQty) ? ownQty : getStockQuantityByLabel(stockMap, label);
        return {
          option,
          label,
          available: stockQty == null ? true : stockQty > 0,
        };
      });
    }
    if (stockMap && typeof stockMap === 'object') {
      return Object.keys(stockMap).map((label) => ({
        option: label,
        label,
        available: (getStockEntryQuantity(stockMap[label]) || 0) > 0,
      }));
    }
    return [];
  }, [productData?.storage, productData?.storageStock, selectedColor, lang]);

  const modelOptions = useMemo(() => {
    const optionsFromData = Array.isArray(selectedColor?.models)
      ? selectedColor.models
      : Array.isArray(productData?.models)
        ? productData.models
        : [];
    const stockMap = selectedColor?.modelStock || productData?.modelStock;
    if (optionsFromData.length > 0) {
      return optionsFromData.map((option, index) => {
        const label = getLabelFromOption(option, lang) || String(index);
        const ownQty = Number(option?.quantity);
        const stockQty =
          Number.isFinite(ownQty) ? ownQty : getStockQuantityByLabel(stockMap, label);
        return {
          option,
          label,
          available: stockQty == null ? true : stockQty > 0,
        };
      });
    }
    if (stockMap && typeof stockMap === 'object') {
      return Object.keys(stockMap).map((label) => ({
        option: label,
        label,
        available: (getStockEntryQuantity(stockMap[label]) || 0) > 0,
      }));
    }
    return [];
  }, [productData?.models, productData?.modelStock, selectedColor, lang]);

  useEffect(() => {
    if (sizeOptions.length === 0) {
      setSelectedSize(null);
      return;
    }
    const current = selectedSize;
    const existsAndAvailable = sizeOptions.some((opt) => opt.value === current && opt.available);
    if (!existsAndAvailable) {
      const fallback = sizeOptions.find((opt) => opt.available) || sizeOptions[0];
      setSelectedSize(fallback.value);
    }
  }, [sizeOptions, selectedSize]);

  useEffect(() => {
    if (storageOptions.length === 0) {
      setSelectedStorage(null);
      return;
    }
    const currentLabel = getLabelFromOption(selectedStorage, lang);
    const existsAndAvailable = storageOptions.some(
      (opt) => normalizeVariantLabel(opt.label) === normalizeVariantLabel(currentLabel) && opt.available,
    );
    if (!existsAndAvailable) {
      const fallback = storageOptions.find((opt) => opt.available) || storageOptions[0];
      setSelectedStorage(fallback.option);
    }
  }, [storageOptions, selectedStorage, lang]);

  useEffect(() => {
    if (modelOptions.length === 0) {
      setSelectedModel(null);
      return;
    }
    const currentLabel = getLabelFromOption(selectedModel, lang);
    const existsAndAvailable = modelOptions.some(
      (opt) => normalizeVariantLabel(opt.label) === normalizeVariantLabel(currentLabel) && opt.available,
    );
    if (!existsAndAvailable) {
      const fallback = modelOptions.find((opt) => opt.available) || modelOptions[0];
      setSelectedModel(fallback.option);
    }
  }, [modelOptions, selectedModel, lang]);

  const totalProductQty = getProductVariantQuantityTotal(productData);
  const selectedVariantQty = (() => {
    const modelOwnQty = toStockNumber(selectedModel?.quantity);
    if (modelOwnQty !== null) return modelOwnQty;

    const modelStockQty = findStockValue(
      selectedColor?.modelStock || productData?.modelStock,
      getModelValue(selectedModel),
    );
    if (modelStockQty !== null) return modelStockQty;

    const storageOwnQty = toStockNumber(selectedStorage?.quantity);
    if (storageOwnQty !== null) return storageOwnQty;

    const storageStockQty = findStockValue(
      selectedColor?.storageStock || productData?.storageStock,
      getStorageValue(selectedStorage),
    );
    if (storageStockQty !== null) return storageStockQty;

    const sizeStockQty = findStockValue(selectedColor?.sizeStock || productData?.sizeStock, selectedSize);
    if (sizeStockQty !== null) return sizeStockQty;

    const colorStockQty = findStockValue(productData?.colorStock, getLabelFromOption(selectedColor, lang));
    if (colorStockQty !== null) return colorStockQty;

    const colorQty =
      findStockValue(productData?.colorStock, getLabelFromOption(selectedColor, lang)) ??
      toStockNumber(selectedColor?.quantity);
    if (colorQty !== null) return colorQty;

    return null;
  })();
  const effectiveStockQty = selectedVariantQty !== null ? selectedVariantQty : totalProductQty;
  const selectedSizeAvailable =
    sizeOptions.length === 0 ||
    sizeOptions.some(
      (opt) => opt.value === selectedSize && opt.available,
    );
  const selectedStorageAvailable =
    storageOptions.length === 0 ||
    storageOptions.some(
      (opt) => normalizeVariantLabel(opt.label) === normalizeVariantLabel(getLabelFromOption(selectedStorage, lang)) && opt.available,
    );
  const selectedModelAvailable =
    modelOptions.length === 0 ||
    modelOptions.some(
      (opt) => normalizeVariantLabel(opt.label) === normalizeVariantLabel(getLabelFromOption(selectedModel, lang)) && opt.available,
    );
  const selectedColorQty =
    findStockValue(productData?.colorStock, getLabelFromOption(selectedColor, lang)) ??
    toStockNumber(selectedColor?.quantity);
  const selectedColorAvailable =
    !selectedColor || selectedColorQty === null || selectedColorQty > 0;
  const isCurrentVariantAvailable =
    effectiveStockQty !== null &&
    effectiveStockQty > 0 &&
    selectedColorAvailable &&
    selectedSizeAvailable &&
    selectedStorageAvailable &&
    selectedModelAvailable;

  // Mahsulot cart da bor-yo'qligini tekshirish (variant kombinatsiyasi bilan) (must be before early return)
  const isProductInCart = useMemo(() => {
    if (!productData) return false;
    
    // Tanlangan variant label'larini olish
    const colorLabel = getLabelFromOption(selectedColor, lang);
    const sizeLabel = getLabelFromOption(selectedSize, lang);
    const storageLabel = getLabelFromOption(selectedStorage, lang);
    const modelLabel = getLabelFromOption(selectedModel, lang);
    
    // Cart da aynan shu product ID va variant kombinatsiyasi mavjudligini tekshirish
    return cart.some(item => 
      item.id === productData.id &&
      item.color === colorLabel &&
      item.size === sizeLabel &&
      item.storage === storageLabel &&
      item.model === modelLabel
    );
  }, [cart, productData, selectedColor, selectedSize, selectedStorage, selectedModel, lang]);

  // isAddedToCart ni avtomatik yangilash (must be before early return)
  useEffect(() => {
    setIsAddedToCart(isProductInCart);
  }, [isProductInCart]);

  const structuredDescriptionBlock = useMemo(() => {
    const d = productData?.description;
    if (!Array.isArray(d) || d.length === 0) return null;
    const block = d[0];
    if (!block) return null;
    const hasMain = Array.isArray(block.mainFeatures) && block.mainFeatures.length > 0;
    const hasTech = Array.isArray(block.technicalSpecs) && block.technicalSpecs.length > 0;
    const inf = block.info;
    const hasInfo =
      inf != null &&
      (typeof inf === 'string'
        ? inf.trim().length > 0
        : typeof inf === 'object' &&
          (String(inf.uz ?? '').trim().length > 0 || String(inf.ru ?? '').trim().length > 0));
    if (!hasMain && !hasTech && !hasInfo) return null;
    return block;
  }, [productData?.description]);

  /** Sarlavhadan keyin: description[0].info yoki mahsulotdagi info */
  const descriptionIntroInfoText = useMemo(() => {
    if (!productData) return '';
    const d = productData.description;
    const fromFirst =
      Array.isArray(d) && d.length > 0 && d[0]?.info != null ? d[0].info : null;
    const infoObj = fromFirst ?? productData.info ?? null;
    if (infoObj == null) return '';
    return getLocalizedText(infoObj, lang).trim();
  }, [productData, lang]);

  const normalizedSizeChart = useMemo(() => {
    const raw = productData?.sizeChart;
    if (!raw) return null;

    if (Array.isArray(raw)) {
      if (raw.length === 0) return null;
      if (typeof raw[0] === 'string') {
        return {
          mode: 'legacyImages',
          images: raw.map((src) => ({ src })),
        };
      }
      return null;
    }

    if (typeof raw === 'object') {
      const measureColumns = Array.isArray(raw.measureColumns) ? raw.measureColumns : [];
      let columns = Array.isArray(raw.columns) ? raw.columns : [];
      let rows = Array.isArray(raw.rows) ? raw.rows : [];

      if (measureColumns.length > 0) {
        const lengths = measureColumns.map((m) =>
          Array.isArray(m?.values) ? m.values.length : 0
        );
        const rowCount =
          lengths.length > 0 ? Math.min(...lengths) : 0;
        if (rowCount > 0) {
          columns = measureColumns.map((m) => m.label);
          rows = [];
          for (let i = 0; i < rowCount; i += 1) {
            rows.push(measureColumns.map((m) => m.values[i]));
          }
        }
      }

      const guideImagesRaw = Array.isArray(raw.guideImages) ? raw.guideImages : [];
      const typeSizeRaw = raw.typeSize ?? raw.chartKind;
      const typeSize = isValidTypeSize(typeSizeRaw) ? typeSizeRaw : undefined;
      const guideImages = guideImagesRaw
        .map((img) => {
          const itemRaw = img?.typeSize ?? img?.kind;
          const itemTypeSize = isValidTypeSize(itemRaw) ? itemRaw : undefined;
          const src = resolveSizeChartGuideSrc({
            explicitSrc: img?.src,
            itemTypeSize,
            parentTypeSize: typeSize,
          });
          const { kind: _legacyKind, chartKind: _legacyImgChart, ...rest } = img;
          return { ...rest, typeSize: itemTypeSize, src };
        })
        .filter((img) => Boolean(img.src));
      const images = Array.isArray(raw.images) ? raw.images : [];

      const hasTable = columns.length > 0 && rows.length > 0;
      const hasStructuredContent =
        hasTable || guideImages.length > 0 || images.length > 0;
      if (!hasStructuredContent) return null;

      const { chartKind: _legacyChartKind, notes: _omitNotes, ...rawRest } = raw;

      return {
        mode: 'structured',
        ...rawRest,
        typeSize,
        columns,
        rows,
        guideImages,
        images,
      };
    }

    return null;
  }, [productData?.sizeChart]);

  const hasSizeChart = !!normalizedSizeChart;

  if (!productData) return null;

  const currentPrice = getNumberPrice(selectedModel) ?? 
                      getStockPriceByLabel(
                        selectedColor?.modelStock || productData?.modelStock,
                        getModelValue(selectedModel),
                      ) ??
                      getNumberPrice(selectedStorage) ?? 
                      getStockPriceByLabel(
                        selectedColor?.storageStock || productData?.storageStock,
                        getStorageValue(selectedStorage),
                      ) ??
                      getNumberPrice(selectedColor) ?? 
                      getNumberPrice(productData) ?? 0;
  const currentOriginalPrice = getNumberPrice(selectedModel?.originalPrice) ??
                      getStockOriginalPriceByLabel(
                        selectedColor?.modelStock || productData?.modelStock,
                        getModelValue(selectedModel),
                      ) ??
                      getNumberPrice(selectedStorage?.originalPrice) ??
                      getStockOriginalPriceByLabel(
                        selectedColor?.storageStock || productData?.storageStock,
                        getStorageValue(selectedStorage),
                      ) ??
                      getNumberPrice(selectedColor?.originalPrice) ??
                      getNumberPrice(productData?.originalPrice);

  const handleAddToCart = async () => {
    if (selectedVariantQty !== null && selectedVariantQty <= 0) {
      showToast(i18n.t('cart.updateError'), 'error');
      return;
    }

    if (selectedVariantQty === null && totalProductQty !== null && totalProductQty <= 0) {
      showToast(i18n.t('cart.updateError'), 'error');
      return;
    }

    const colorQty = toStockNumber(selectedColor?.quantity);
    if (colorQty !== null && colorQty <= 0) {
      showToast(i18n.t('cart.updateError'), 'error');
      return;
    }

    const sizeQty = findStockValue(selectedColor?.sizeStock || productData?.sizeStock, selectedSize);
    if (sizeQty !== null && sizeQty <= 0) {
      showToast(i18n.t('cart.updateError'), 'error');
      return;
    }

    const storageQty = findStockValue(
      selectedColor?.storageStock || productData?.storageStock,
      getStorageValue(selectedStorage),
    );
    if (storageQty !== null && storageQty <= 0) {
      showToast(i18n.t('cart.updateError'), 'error');
      return;
    }

    const modelQty = findStockValue(
      selectedColor?.modelStock || productData?.modelStock,
      getModelValue(selectedModel),
    );
    if (modelQty !== null && modelQty <= 0) {
      showToast(i18n.t('cart.updateError'), 'error');
      return;
    }

    if (isProductInCart || isAddedToCart) {
      navigate('/cart');
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(productData, selectedColor, selectedSize, selectedStorage, selectedModel);
      showToast(i18n.t('cart.toastAdded'), 'success');
      setIsAddedToCart(true);
    } catch {
      /* login redirect yoki xato */
    } finally {
      setIsAddingToCart(false);
    }
  };

  const isColorAvailable = (color) => {
    const qty =
      findStockValue(productData?.colorStock, getLabelFromOption(color, lang)) ??
      toStockNumber(color?.quantity);
    return qty === null || qty > 0;
  };

  const isSizeAvailable = (color, size) => {
    const colorQty =
      findStockValue(productData?.colorStock, getLabelFromOption(color, lang)) ??
      toStockNumber(color?.quantity);
    if (colorQty !== null && colorQty <= 0) return false;
    const sizeQty = findStockValue(color?.sizeStock || productData?.sizeStock, size);
    return sizeQty === null || sizeQty > 0;
  };

  const isStorageAvailable = (color, storageOption) => {
    const colorQty =
      findStockValue(productData?.colorStock, getLabelFromOption(color, lang)) ??
      toStockNumber(color?.quantity);
    if (colorQty !== null && colorQty <= 0) return false;
    const storageQty = findStockValue(
      color?.storageStock || productData?.storageStock,
      getStorageValue(storageOption),
    );
    return storageQty === null || storageQty > 0;
  };

  const isModelAvailable = (color, modelOption) => {
    const colorQty =
      findStockValue(productData?.colorStock, getLabelFromOption(color, lang)) ??
      toStockNumber(color?.quantity);
    if (colorQty !== null && colorQty <= 0) return false;
    const modelQty = findStockValue(color?.modelStock || productData?.modelStock, getModelValue(modelOption));
    return modelQty === null || modelQty > 0;
  };

  const pickFirstAvailable = (list, checker) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    const found = list.find((item) => checker(item));
    return found ?? list[0];
  };

  const handleColorChange = (color) => {
    if (!color) return;
    if (!isColorAvailable(color)) return;
    const sizeOptions = getStockAwareOptions(color?.sizes, color?.sizeStock || productData?.sizeStock);
    const storageOptions = getStockAwareOptions(
      color?.storage || productData?.storage,
      color?.storageStock || productData?.storageStock,
    );
    const modelOptions = getStockAwareOptions(
      color?.models || productData?.models,
      color?.modelStock || productData?.modelStock,
    );
    setSelectedColor(color);
    setSelectedSize(pickFirstAvailable(sizeOptions, (option) => isSizeAvailable(color, option)) || null);
    setSelectedStorage(
      pickFirstAvailable(storageOptions, (option) => isStorageAvailable(color, option)) || null,
    );
    setSelectedModel(
      pickFirstAvailable(modelOptions, (option) => isModelAvailable(color, option)) || null,
    );
    setCurrentImageIndex(0);
  };

  const handleLike = () => {
    toggleWishlist(productData);
    showToast(
      isInWishlist(productData.id) 
        ? 'Mahsulot sevimlilardan olib tashlandi' 
        : 'Mahsulot sevimlilarga qo\'shildi',
      'success'
    );
  };

  const handleShare = (platform) => {
    const productUrl = window.location.href;
    const productTitle = getLocalizedText(productData.title, lang) || 'Mahsulot';
    const productPrice = formatPrice(currentPrice);
    const shareText = `${productTitle} - ${productPrice}`;

    switch(platform) {
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + productUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(productUrl).then(() => {
          showToast('Link nusxalandi! 📋', 'success');
        }).catch(() => {
          showToast('Xatolik yuz berdi', 'error');
        });
        break;
      default:
        break;
    }
    setIsShareMenuOpen(false);
  };

  const handleShareSheetTouchStart = (e) => {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    shareSheetStartYRef.current = e.touches[0].clientY;
    shareSheetCurrentYRef.current = e.touches[0].clientY;
    setIsShareSheetDragging(true);
  };

  const handleShareSheetTouchMove = (e) => {
    if (!isShareSheetDragging || !window.matchMedia('(max-width: 768px)').matches) return;
    const currentY = e.touches[0].clientY;
    shareSheetCurrentYRef.current = currentY;
    const diff = currentY - shareSheetStartYRef.current;
    const nextOffset = Math.max(0, diff);
    setShareSheetOffset(nextOffset);

    if (nextOffset > 0) {
      e.preventDefault();
    }
  };

  const handleShareSheetTouchEnd = () => {
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    const draggedDistance = shareSheetCurrentYRef.current - shareSheetStartYRef.current;
    const closeThreshold = 120;

    if (draggedDistance > closeThreshold) {
      setIsShareMenuOpen(false);
    } else {
      setShareSheetOffset(0);
    }

    setIsShareSheetDragging(false);
  };

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const descriptionStr =
    Array.isArray(productData.description) ? '' : getLocalizedText(productData.description, lang);
  const hasStructuredDescription = !!structuredDescriptionBlock;
  const hasStructuredMainFeatures =
    !!structuredDescriptionBlock &&
    Array.isArray(structuredDescriptionBlock.mainFeatures) &&
    structuredDescriptionBlock.mainFeatures.length > 0;
  const hasStructuredTechnical =
    !!structuredDescriptionBlock &&
    Array.isArray(structuredDescriptionBlock.technicalSpecs) &&
    structuredDescriptionBlock.technicalSpecs.length > 0;
  /** Texnik jadval bor bo‘lsa, asosiy xususiyatlar «Ko‘proq» gacha yashirin */
  const shouldCollapseMainFeatures = hasStructuredTechnical && hasStructuredMainFeatures;
  const hasDescription =
    (descriptionStr && descriptionStr.trim().length > 0) ||
    hasStructuredDescription ||
    descriptionIntroInfoText.length > 0;
  const hasDescriptionImages = productData.descriptionImages && productData.descriptionImages.length > 0;
  const shouldShowDescription = hasDescription || hasDescriptionImages;
  const descriptionText = descriptionStr || '';
  const isShortText = !hasStructuredDescription && descriptionText.length <= 200;
  const showReadMoreBtn =
    shouldCollapseMainFeatures ||
    hasDescriptionImages ||
    (!hasStructuredDescription && descriptionText.length > 200);
  const displayQuantity = (() => {
    if (serverProductQty !== null) return serverProductQty;
    const fallbackQty = getProductVariantQuantityTotal(productData);
    if (fallbackQty !== null) return fallbackQty;
    return 0;
  })();
  const addToCartDisabled = isAddingToCart || !isCurrentVariantAvailable;


  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail-grid">
          <div className="product-images">
            <div
              className={mainImageDrag.wrapperClassName}
              ref={mainImageDrag.wrapperRef}
              {...mainImageDrag.wrapperHandlers}
            >
              <button
                className="product-detail-mobile-back-btn"
                onClick={handleBackFromProductDetail}
                title="Ortga"
                aria-label="Ortga"
              >
                <i className="bx bx-arrow-back"></i>
              </button>

              {/* Action Icons */}
              <div className="action-icons">
                <button 
                  className={`icon-btn like-btn ${isInWishlist(productData.id) ? 'liked' : ''}`}
                  onClick={handleLike}
                  title="Sevimlilar"
                >
                  <i className={`heart-icons ${isInWishlist(productData.id) ? 'bx bxs-heart' : 'bx bx-heart'}`}></i>
                </button>
                <button 
                  className="icon-btn share-btn" 
                  onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                  title="Ulashish"
                >
                  <i className="bx bx-share-alt"></i>
                </button>
              </div>

              {/* Share Menu */}
              {isShareMenuOpen && (
                <>
                  <div className="share-menu-overlay" onClick={() => setIsShareMenuOpen(false)}></div>
                  <div
                    className={`share-menu active ${isShareSheetDragging ? 'dragging' : ''}`}
                    style={{ '--sheet-offset': `${shareSheetOffset}px` }}
                  >
                    <div
                      className="share-menu-drag-handle"
                      onTouchStart={handleShareSheetTouchStart}
                      onTouchMove={handleShareSheetTouchMove}
                      onTouchEnd={handleShareSheetTouchEnd}
                    >
                      <span className="share-menu-drag-bar"></span>
                    </div>
                  <div className="share-menu-title">Ulashish</div>
                  <div className="share-options">
                    <a href="#" className="share-option telegram" onClick={(e) => { e.preventDefault(); handleShare('telegram'); }}>
                      <i className="bx bxl-telegram"></i>
                      <span>Telegram</span>
                    </a>
                    <a href="#" className="share-option whatsapp" onClick={(e) => { e.preventDefault(); handleShare('whatsapp'); }}>
                      <i className="bx bxl-whatsapp"></i>
                      <span>WhatsApp</span>
                    </a>
                    <a href="#" className="share-option facebook" onClick={(e) => { e.preventDefault(); handleShare('facebook'); }}>
                      <i className="bx bxl-facebook-circle"></i>
                      <span>Facebook</span>
                    </a>
                    <a href="#" className="share-option copy" onClick={(e) => { e.preventDefault(); handleShare('copy'); }}>
                      <i className="bx bx-copy"></i>
                      <span>Linkni nusxalash</span>
                    </a>
                  </div>
                  </div>
                </>
              )}

              <div
                className={`${mainImageDrag.containerClassName} ${allImages.length <= 1 ? 'main-image-container--single' : ''}`}
                style={mainImageDrag.containerStyle}
                aria-busy={showDetailSkeleton}
              >
                {showDetailSkeleton ? (
                  <SkeletonPulse
                    className="product-detail-main-image__skeleton"
                    aria-hidden
                  />
                ) : (
                  <div className="main-image-track">
                    {mainImageSlides.map((slide, slidePosition) => (
                      <div className="main-image-slide" key={`${slide.index}-${slidePosition}`}>
                        <img
                          src={slide.src || '/img/no-image.png'}
                          alt={getLocalizedText(productData.title, lang)}
                          className="main-image"
                          onClick={(e) => {
                            if (slide.index === currentImageIndex && mainImageDrag.canOpenImageModal(allImages.length > 0)) {
                              e.preventDefault();
                              setIsImageModalOpen(true);
                            }
                          }}
                          draggable={false}
                          onError={(e) => {
                            if (!imageErrors.has(slide.index)) {
                              setImageErrors(prev => new Set([...prev, slide.index]));
                              e.target.src = '/img/no-image.png';
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {productData.video && (
                <div 
                  className="video-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVideoModalOpen(true);
                  }}
                >
                  <i className="bx bx-play"></i>
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <DragScroll
                className="thumbnail-list"
                direction="horizontal"
                aria-busy={showDetailSkeleton}
              >
                {showDetailSkeleton
                  ? Array.from({ length: Math.min(allImages.length, 10) }, (_, index) => (
                      <SkeletonPulse
                        key={`thumbnail-sk-${index}`}
                        className={`thumbnail thumbnail--skeleton ${index === currentImageIndex ? 'selected' : ''}`}
                        aria-hidden
                      />
                    ))
                  : allImages.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className={`thumbnail ${index === currentImageIndex ? 'selected' : ''}`}
                        draggable={false}
                        onClick={() => setCurrentImageIndex(index)}
                        onError={(e) => {
                          e.target.src = normalizeImagePath('/img/no-image.png');
                        }}
                      />
                    ))}
              </DragScroll>
            )}
          </div>

          <div className="product-info">
            <h1 className="product-title">
              {showDetailSkeleton ? (
                <SkeletonPulse className="product-detail-title__skeleton" aria-hidden />
              ) : (
                getLocalizedText(productData.title, lang)
              )}
            </h1>

            <div className="price-section" aria-busy={showDetailSkeleton}>
              {showDetailSkeleton ? (
                <>
                  <SkeletonPulse className="product-detail-price__skeleton product-detail-price__skeleton--main" aria-hidden />
                  <SkeletonPulse className="product-detail-price__skeleton product-detail-price__skeleton--muted" aria-hidden />
                </>
              ) : (
                <>
                  <span className="price">{formatPrice(currentPrice)}</span>
                  {currentOriginalPrice != null && (
                    <span className="original-price">{formatPrice(currentOriginalPrice)}</span>
                  )}
                  {productData.discount && (
                    <span className="discount">{getLocalizedText(productData.discount, lang)}</span>
                  )}
                </>
              )}
            </div>

            {productData.flashDurationHours != null && productData.flashDurationHours > 0 && (
              <div className="product-detail-page__flash-sale">
                <FlashSaleCountdown
                  flashDurationHours={productData.flashDurationHours}
                  productId={productData.id}
                />
              </div>
            )}

            <div className="product-rating-comments-detail">
              <div className="rating-display-detail">
                <div className="star-icons-detail" aria-label={`Rating ${averageRating} out of 5`}>
                  {detailStarFillLevels.map((fill, index) => (
                    <span
                      key={`detail-star-${index}`}
                      className="star-icon-detail"
                      style={{ '--star-fill': `${Math.round(fill * 100)}%` }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-value-detail">{averageRating}</span>
              </div>
              <div 
                className="comments-display-detail"
                ref={commentsDisplayRef}
                onClick={() => setIsCommentsModalOpen(true)}
              >
                <i ref={commentsIconRef} className="bx bxs-message-rounded"></i>
                <span ref={commentsCountRef} className="comments-count-detail">{commentCount} ta sharh</span>
                {commentPreviewImages.length > 0 ? (
                  <div
                    className={`comments-preview-images ${
                      commentsPreviewMode === 'compact' ? 'comments-preview-images--compact' : ''
                    }`}
                    aria-hidden="true"
                  >
                    {commentPreviewImages.map((imageSrc, index) => (
                      <img
                        key={`comment-preview-${index}`}
                        src={normalizeImagePath(imageSrc)}
                        alt=""
                        className="comments-preview-image"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                    {remainingCommentImageCount > 0 ? (
                      <span className="comments-preview-more">+{remainingCommentImageCount}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {colorOptions.length > 0 && (
              <div className="color-selection">
                <h3>{i18n.t('productDetail.colorLabel')} {selectedColor !== null ? getLabelFromOption(selectedColor, lang) : colorOptions[0]?.label}</h3>
                <div className="colors-container">
                  {showDetailSkeleton
                    ? Array.from({ length: Math.min(colorOptions.length, 8) }, (_, index) => (
                        <SkeletonPulse
                          key={`color-sk-${index}`}
                          className="color-option color-option--skeleton"
                          aria-hidden
                        />
                      ))
                    : colorOptions.map(({ color, available }, index) => {
                        const currentColor = selectedColor !== null ? selectedColor : colorOptions[0]?.color;
                        const colorLabel = getLabelFromOption(color, lang);
                        const isSelected = currentColor && color && (
                          (currentColor.colorFilter && color.colorFilter && currentColor.colorFilter === color.colorFilter) ||
                          (currentColor.mainImage && color.mainImage && currentColor.mainImage === color.mainImage) ||
                          (getLabelFromOption(currentColor, lang) && colorLabel && getLabelFromOption(currentColor, lang) === colorLabel)
                        );
                        const unavailable = !available || !isColorAvailable(color);
                        return (
                          <button
                            key={`color-${index}-${colorLabel || index}`}
                            type="button"
                            aria-label={colorLabel || `Color ${index + 1}`}
                            className={`color-option-wrap ${unavailable ? 'color-option-wrap--unavailable' : ''}`}
                            disabled={unavailable}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleColorChange(color);
                            }}
                          >
                            <img
                              src={normalizeImagePath(color.mainImage || getProductMainImage(productData))}
                              alt={colorLabel || `Color ${index + 1}`}
                              className={`color-option ${isSelected ? 'selected' : ''}`}
                              onError={(e) => {
                                e.target.src = normalizeImagePath('/img/no-image.png');
                              }}
                            />
                          </button>
                        );
                      })}
                </div>
              </div>
            )}

            {sizeOptions.length > 0 && (
              <div className="size-selection">
                <h3>{i18n.t('productDetail.sizeLabel')} {selectedSize !== null ? selectedSize : (sizeOptions[0]?.label || '')}</h3>
                <div className="sizes-container">
                  {showDetailSkeleton
                    ? Array.from({ length: Math.min(sizeOptions.length, 10) }, (_, index) => (
                        <SkeletonPulse
                          key={`size-sk-${index}`}
                          className={`size-option size-option--skeleton size-option--skeleton-${(index % 4) + 1}`}
                          aria-hidden
                        />
                      ))
                    : sizeOptions.map((sizeOption, index) => {
                        const currentSize = selectedSize !== null ? selectedSize : sizeOptions[0]?.value;
                        const isSelected = sizeOption.value === currentSize;
                        const unavailable = !sizeOption.available;
                        return (
                          <button
                            key={`size-${index}`}
                            className={`size-option ${isSelected ? 'selected' : ''} ${unavailable ? 'size-option--unavailable' : ''}`}
                            disabled={unavailable}
                            onClick={() => {
                              setSelectedSize(sizeOption.value);
                            }}
                          >
                            {sizeOption.label}
                          </button>
                        );
                      })}
                </div>
                {/* Size Chart */}
                {!showDetailSkeleton && hasSizeChart && (
                  <div className="size-chart">
                    <button 
                      className="size-chart-trigger"
                      onClick={() => {
                        setIsSizeChartOpen(true);
                      }}
                    >
                      <span><i className="fas fa-ruler"></i> {i18n.t('productDetail.sizeChartLabel')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="product-detail-quantity-row">
              <div className="product-detail-quantity" aria-live="polite">
                <i className="bx bx-package" aria-hidden="true" />
                <span>
                  {i18n.t('productDetail.quantityLeft', {
                    count: displayQuantity,
                  })}
                </span>
              </div>
              <ProductDetailSalesFooter
                meta={productData?.productDetailSalesMeta}
                remainingQuantity={displayQuantity}
                soldCount={productData?.flashSaleSoldCount}
              />
            </div>

            {storageOptions.length > 0 && (
              <div className="storage-selection">
                <h3>{i18n.t('productDetail.storageLabel')} {
                  selectedStorage !== null
                    ? (typeof selectedStorage === 'object' && selectedStorage.size ? selectedStorage.size : (typeof selectedStorage === 'string' ? selectedStorage : ''))
                    : (storageOptions[0]?.label || '')
                }</h3>
                <div className="storage-container">
                  {showDetailSkeleton
                    ? Array.from({ length: Math.min(storageOptions.length, 6) }, (_, index) => (
                        <SkeletonPulse
                          key={`storage-sk-${index}`}
                          className={`storage-option storage-option--skeleton storage-option--skeleton-${(index % 3) + 1}`}
                          aria-hidden
                        />
                      ))
                    : storageOptions.map((storageOption, index) => {
                        const currentStorageValue =
                          selectedStorage != null
                            ? normalizeVariantLabel(getLabelFromOption(selectedStorage, lang))
                            : normalizeVariantLabel(storageOptions[0]?.label);
                        const isSelected =
                          normalizeVariantLabel(storageOption.label) === currentStorageValue;
                        const unavailable = !storageOption.available;
                        return (
                          <button
                            key={`storage-${index}`}
                            className={`storage-option ${isSelected ? 'selected' : ''} ${unavailable ? 'storage-option--unavailable' : ''}`}
                            disabled={unavailable}
                            onClick={() => {
                              setSelectedStorage(storageOption.option);
                            }}
                          >
                            {storageOption.label}
                          </button>
                        );
                      })}
                </div>
              </div>
            )}

            {modelOptions.length > 0 && (
              <div className="model-selection">
                <h3>{i18n.t('productDetail.modelLabel')} {
                  selectedModel !== null
                    ? (typeof selectedModel === 'object' && selectedModel.name ? selectedModel.name : (typeof selectedModel === 'string' ? selectedModel : ''))
                    : (modelOptions[0]?.label || '')
                }</h3>
                <div className="models-container">
                  {showDetailSkeleton
                    ? Array.from({ length: Math.min(modelOptions.length, 6) }, (_, index) => (
                        <SkeletonPulse
                          key={`model-sk-${index}`}
                          className={`model-option model-option--skeleton model-option--skeleton-${(index % 3) + 1}`}
                          aria-hidden
                        />
                      ))
                    : modelOptions.map((modelOption, index) => {
                        const currentModelValue =
                          selectedModel != null
                            ? normalizeVariantLabel(getLabelFromOption(selectedModel, lang))
                            : normalizeVariantLabel(modelOptions[0]?.label);
                        const isSelected =
                          normalizeVariantLabel(modelOption.label) === currentModelValue;
                        const unavailable = !modelOption.available;
                        return (
                          <button
                            key={`model-${index}`}
                            className={`model-option ${isSelected ? 'selected' : ''} ${unavailable ? 'model-option--unavailable' : ''}`}
                            disabled={unavailable}
                            onClick={() => {
                              setSelectedModel(modelOption.option);
                            }}
                          >
                            {modelOption.label}
                          </button>
                        );
                      })}
                </div>
              </div>
            )}

            <div className='addo-btn__detail'>
              <button
                type="button"
                className="product-detail-action-icon product-detail-action-icon--support"
                aria-label="Aloqa"
              >
                <i className="bx bx-headphone" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="product-detail-action-icon product-detail-action-icon--cart"
                onClick={() => navigate('/cart')}
                aria-label={i18n.t('productDetail.goToCart')}
              >
                <i className="fas fa-shopping-cart" aria-hidden="true" />
                {cart.length > 0 ? (
                  <span className="cart-badge">{cart.length > 99 ? '99+' : cart.length}</span>
                ) : null}
              </button>
              <button
                className="add-to-cart-btn-detail"
                onClick={handleAddToCart}
                disabled={addToCartDisabled}
              >
                <ButtonLoader isLoading={isAddingToCart}>
                  {isAddedToCart || isProductInCart ? (
                    <>
                      <i className="fas fa-shopping-cart"></i>
                      <span>{i18n.t('productDetail.goToCart')}</span>
                    </>
                  ) : (
                    <span>{i18n.t('productDetail.addToCart')}</span>
                  )}
                </ButtonLoader>
              </button>
            </div>



            {/* Delivery Info - Only for UZB products */}
            <DeliveryInfo product={productData} />

            <ProductPolicy product={productData} lang={lang} skeleton={showDetailSkeleton} />

            {detailSeller && (
              <div className="product-detail-seller-wrap">
                <Link
                  to={`/seller/${detailSellerId}`}
                  className="product-detail-seller"
                  aria-label={`${getLocalizedText(detailSeller.name, lang)} — ${i18n.t('seller.productsTitle')}`}
                >
                  <img
                    src={normalizeImagePath(detailSeller.logo)}
                    alt=""
                    className="product-detail-seller__logo"
                    onError={(e) => {
                      e.target.src = normalizeImagePath('/img/no-image.png');
                    }}
                  />
                  <div className="product-detail-seller__main">
                    <span className="product-detail-seller__name">
                      {getLocalizedText(detailSeller.name, lang)}
                    </span>
                    <div className="seller-profile__stats-row">
                      <p className="seller-profile__product-count">
                        {i18n.t('seller.productCount', { count: sellerProductCountForDetail })}
                      </p>
                      <SellerSubscriberCount count={sellerSubscriberDisplay} />
                    </div>
                  </div>
                </Link>
                <div className="product-detail-seller__subscribe-wrap">
                  <SellerSubscribeButton
                    subscribed={sellerSubscribed}
                    onToggle={sellerSubscribeToggle}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Description - Below grid on desktop */}
        {shouldShowDescription && (
          <div
            className="product-description auto-loader-bg"
            id="descriptionSection"
            aria-busy={showDetailSkeleton}
          >
            <div className="description-intro">
              <div className="description-header">
                {showDetailSkeleton ? (
                  <>
                    <SkeletonPulse className="description-header__icon-skeleton" aria-hidden />
                    <SkeletonPulse className="description-header__title-skeleton" aria-hidden />
                  </>
                ) : (
                  <>
                    <div className="header-icon auto-loader-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <h3>
                      {structuredDescriptionBlock
                        ? getLocalizedText(structuredDescriptionBlock.title, lang)
                        : i18n.t('productDetail.descriptionHeader')}
                    </h3>
                  </>
                )}
              </div>
              {showDetailSkeleton && descriptionIntroInfoText.length > 0 ? (
                <div className="description-info description-info--skeleton" aria-hidden>
                  <SkeletonPulse className="description-info__line description-info__line--a" />
                  <SkeletonPulse className="description-info__line description-info__line--b" />
                  <SkeletonPulse className="description-info__line description-info__line--c" />
                </div>
              ) : (
                descriptionIntroInfoText.length > 0 && (
                  <p className="description-info">{descriptionIntroInfoText}</p>
                )
              )}
            </div>
            {structuredDescriptionBlock && (
              <>
                {Array.isArray(structuredDescriptionBlock.technicalSpecs) &&
                  structuredDescriptionBlock.technicalSpecs.length > 0 && (
                    <div className="description description--technical">
                      {structuredDescriptionBlock.technicalHeading && (
                        <h4 className="description-section-subtitle">
                          {showDetailSkeleton ? (
                            <SkeletonPulse className="description-section-subtitle__skeleton" aria-hidden />
                          ) : (
                            getLocalizedText(structuredDescriptionBlock.technicalHeading, lang)
                          )}
                        </h4>
                      )}
                      <div className="technical-specs-table-wrap">
                        <table className="technical-specs-table">
                          <tbody>
                            {showDetailSkeleton
                              ? Array.from(
                                  {
                                    length: Math.min(structuredDescriptionBlock.technicalSpecs.length, 8),
                                  },
                                  (_, idx) => (
                                    <tr key={`tech-sk-${idx}`}>
                                      <td>
                                        <SkeletonPulse
                                          className="technical-specs-td-skeleton technical-specs-td-skeleton--first"
                                          aria-hidden
                                        />
                                      </td>
                                      <td>
                                        <SkeletonPulse
                                          className="technical-specs-td-skeleton technical-specs-td-skeleton--value"
                                          aria-hidden
                                        />
                                      </td>
                                    </tr>
                                  )
                                )
                              : structuredDescriptionBlock.technicalSpecs.map((row, idx) => (
                                  <tr key={idx}>
                                    <td>{getLocalizedText(row.label, lang)}</td>
                                    <td>{getLocalizedText(row.value, lang)}</td>
                                  </tr>
                                ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                {Array.isArray(structuredDescriptionBlock.mainFeatures) &&
                  structuredDescriptionBlock.mainFeatures.length > 0 && (
                    <div
                      className={`description-collapsible${!shouldCollapseMainFeatures || isDescriptionExpanded ? ' show' : ''}`}
                    >
                      <div className="description description--technical">
                        {structuredDescriptionBlock.mainFeaturesHeading && (
                          <h4 className="description-section-subtitle">
                            {showDetailSkeleton ? (
                              <SkeletonPulse className="description-section-subtitle__skeleton" aria-hidden />
                            ) : (
                              getLocalizedText(structuredDescriptionBlock.mainFeaturesHeading, lang)
                            )}
                          </h4>
                        )}
                        <div className="technical-specs-table-wrap">
                          <table className="technical-specs-table">
                            <tbody>
                              {showDetailSkeleton
                                ? Array.from(
                                    {
                                      length: Math.min(
                                        structuredDescriptionBlock.mainFeatures.length,
                                        8
                                      ),
                                    },
                                    (_, idx) => (
                                      <tr key={`mainf-sk-${idx}`}>
                                        <td>
                                          <SkeletonPulse
                                            className="technical-specs-td-skeleton technical-specs-td-skeleton--first"
                                            aria-hidden
                                          />
                                        </td>
                                        <td>
                                          <SkeletonPulse
                                            className="technical-specs-td-skeleton technical-specs-td-skeleton--value"
                                            aria-hidden
                                          />
                                        </td>
                                      </tr>
                                    )
                                  )
                                : structuredDescriptionBlock.mainFeatures.map((item, idx) => (
                                    <tr key={idx}>
                                      <td>{getLocalizedText(item.title, lang)}</td>
                                      <td>{getLocalizedText(item.text, lang)}</td>
                                    </tr>
                                  ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}
            {!structuredDescriptionBlock && !!descriptionText && (
              <p className={`description ${!isDescriptionExpanded && !isShortText ? 'collapsed' : ''}`}>
                {descriptionText}
              </p>
            )}
            {hasDescriptionImages && (
              <div className={`description-images ${isDescriptionExpanded ? 'show' : ''}`}>
                {showDetailSkeleton
                  ? productData.descriptionImages.map((_, index) => (
                      <SkeletonPulse
                        key={`desc-img-sk-${index}`}
                        className="description-images__img-skeleton"
                        aria-hidden
                      />
                    ))
                  : productData.descriptionImages.map((imgSrc, index) => (
                      <img 
                        key={index}
                        src={normalizeImagePath(imgSrc)} 
                        alt={`Description ${index + 1}`}
                        onError={(e) => {
                          e.target.src = normalizeImagePath('/img/no-image.png');
                        }}
                      />
                    ))}
              </div>
            )}
            {showReadMoreBtn && (
              <div className="read-more">
                <button className="read-more-btn" onClick={toggleDescription}>
                  {isDescriptionExpanded ? 'Kamroq xususiyatlar' : 'Ko\'proq xususiyatlar'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Comments Section - Below grid on desktop */}
        <CommentsSection productId={productData.id} />

        {/* Size Chart Modal */}
        {isSizeChartOpen && hasSizeChart && (
          <div 
            className="size-chart-modal" 
            onClick={(e) => {
              e.stopPropagation();
              if (e.target.className === 'size-chart-modal' || e.target.classList.contains('size-chart-modal')) {
                setIsSizeChartOpen(false);
                document.body.classList.remove('no-scroll');
              }
            }}
          >
            <div
              className="size-chart-modal-content"
              onClick={(e) => e.stopPropagation()}
              data-type-size={
                normalizedSizeChart.mode === 'structured' && normalizedSizeChart.typeSize
                  ? String(normalizedSizeChart.typeSize)
                  : undefined
              }
            >
              <button 
                className="size-chart-close"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSizeChartOpen(false);
                  document.body.classList.remove('no-scroll');
                }}
              >
                &times;
              </button>
              <h2>
                {normalizedSizeChart.mode === 'structured'
                  ? (getLocalizedText(normalizedSizeChart.title, lang) || i18n.t('productDetail.sizeChartLabel'))
                  : i18n.t('productDetail.sizeChartLabel')}
              </h2>

              {normalizedSizeChart.mode === 'structured' && (
                <>
                  {getLocalizedText(normalizedSizeChart.instruction, lang) && (
                    <div className="size-chart-section">
                      <p className="size-chart-instruction">
                        {getLocalizedText(normalizedSizeChart.instruction, lang)}
                      </p>
                    </div>
                  )}

                  {normalizedSizeChart.columns.length > 0 && normalizedSizeChart.rows.length > 0 && (
                    <div className="size-chart-section">
                      <div className="size-chart-table-wrap">
                        <table className="size-chart-table">
                          <thead>
                            <tr>
                              {normalizedSizeChart.columns.map((col, index) => (
                                <th
                                  key={index}
                                  className={index === 0 ? 'size-chart-col-size' : undefined}
                                >
                                  {getLocalizedText(col, lang) || String(col)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {normalizedSizeChart.rows.map((row, rowIdx) => (
                              <tr key={rowIdx}>
                                {Array.isArray(row) && row.map((cell, cellIdx) => (
                                  <td
                                    key={cellIdx}
                                    className={cellIdx === 0 ? 'size-chart-col-size' : undefined}
                                  >
                                    {getLocalizedText(cell, lang) || String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const ts = normalizedSizeChart.typeSize;
                    const canShowInteractiveSvg =
                      (ts === 'upper_body' || ts === 'footwear' || ts === 'pants') &&
                      normalizedSizeChart.rows?.length > 0 &&
                      normalizedSizeChart.columns?.length >= 2;
                    const showGuideImages = normalizedSizeChart.guideImages.length > 0;
                    const diagramPhotoSrc =
                      normalizedSizeChart.guideImages?.[0]?.src || undefined;
                    if (!canShowInteractiveSvg && !showGuideImages) return null;
                    return (
                    <div className="size-chart-section">
                      <p className="size-chart-diagram-heading">
                        {i18n.t('productDetail.sizeChartDiagramHint')}
                      </p>
                      {canShowInteractiveSvg ? (
                        <div className="size-chart-images size-chart-images--interactive">
                          {ts === 'upper_body' && (
                            <SizeChartUpperBodyDiagram
                              columns={normalizedSizeChart.columns}
                              rows={normalizedSizeChart.rows}
                              lang={lang}
                              imageSrc={diagramPhotoSrc}
                            />
                          )}
                          {ts === 'footwear' && (
                            <SizeChartFootwearDiagram
                              columns={normalizedSizeChart.columns}
                              rows={normalizedSizeChart.rows}
                              lang={lang}
                              imageSrc={diagramPhotoSrc}
                            />
                          )}
                          {ts === 'pants' && (
                            <SizeChartPantsDiagram
                              columns={normalizedSizeChart.columns}
                              rows={normalizedSizeChart.rows}
                              lang={lang}
                              imageSrc={diagramPhotoSrc}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="size-chart-images">
                          {normalizedSizeChart.guideImages.map((img, index) => {
                            const imgTypeSize = img.typeSize ?? normalizedSizeChart.typeSize;
                            const typeAlt =
                              imgTypeSize &&
                              isValidTypeSize(imgTypeSize) &&
                              i18n.exists(typeSizeI18nKey(imgTypeSize))
                                ? i18n.t(typeSizeI18nKey(imgTypeSize))
                                : '';
                            const diagramAlt =
                              getLocalizedText(img.title, lang) ||
                              typeAlt ||
                              i18n.t('productDetail.sizeChartLabel');
                            return (
                            <figure
                              key={index}
                              className="size-chart-guide"
                              data-type-size={
                                imgTypeSize && isValidTypeSize(imgTypeSize)
                                  ? imgTypeSize
                                  : undefined
                              }
                            >
                              <img
                                src={normalizeImagePath(img.src)}
                                alt={diagramAlt}
                                onError={(e) => {
                                  e.target.src = normalizeImagePath('/img/no-image.png');
                                }}
                              />
                              {getLocalizedText(img.title, lang) && (
                                <figcaption>{getLocalizedText(img.title, lang)}</figcaption>
                              )}
                            </figure>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  <SizeChartGuidanceFooter />
                </>
              )}

              {normalizedSizeChart.mode === 'legacyImages' && (
                <div className="size-chart-images">
                  {normalizedSizeChart.images.map((img, index) => (
                    <img 
                      key={index}
                      src={normalizeImagePath(img.src)} 
                      alt={i18n.t('productDetail.sizeChartLabel')}
                      onError={(e) => {
                        e.target.src = normalizeImagePath('/img/no-image.png');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {productData.relatedGroups && 
         productData.relatedGroups.length > 0 && 
         productData.relatedGroups.some(group => 
           group && 
           group.productIds && 
           Array.isArray(group.productIds) && 
           group.productIds.length > 0
         ) && (
          <StylingIdea currentProduct={productData} skeleton={showDetailSkeleton} />
        )}

        <Recommended currentProduct={productData} skeleton={showDetailSkeleton} />
        <TavsiyaEtamiz currentProduct={productData} />

      </div>

      {/* Video Modal */}
      <VideoModal
        videoSrc={productData.video ? normalizeImagePath(productData.video) : null}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />

      {/* Image Modal */}
      <ImageModal
        images={allImages}
        initialIndex={currentImageIndex}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />

      {/* Comments Modal */}
      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        comments={allComments}
        productId={productData?.id}
      />
    </div>
  );
};

export default ProductDetail;
