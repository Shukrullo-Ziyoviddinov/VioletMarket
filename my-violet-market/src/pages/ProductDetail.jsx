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
import './ProductDetail.css';

const PRODUCT_DETAIL_HISTORY_KEY = 'productDetailViewedProducts';

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

  // Carousel uchun state'lar
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const mainImageWrapperRef = useRef(null);
  const hasMovedDuringDragRef = useRef(false);
  const shareSheetStartYRef = useRef(0);
  const shareSheetCurrentYRef = useRef(0);

  // Mahsulot ma'lumotlarini yuklash va yangilash
  const loadProductData = useCallback(() => {
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
        setSelectedColor(latestProduct.colors?.[0] || null);
        setSelectedSize(latestProduct.colors?.[0]?.sizes?.[0] || null);
        setSelectedStorage(latestProduct.colors?.[0]?.storage?.[0] || null);
        setSelectedModel(latestProduct.colors?.[0]?.models?.[0] || null);
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
    if (authLoading || !authToken || !productData?.id) return;
    recordView(productData.id);
  }, [authLoading, authToken, productData?.id, recordView]);

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
    if (!selectedColor) return [];
    return [
      normalizeImagePath(selectedColor.mainImage),
      ...(selectedColor.thumbnails || []).map(normalizeImagePath)
    ];
  }, [selectedColor]);

  // Carousel funksiyalari - ImageBanner kabi (must be before early return)
  const nextImageSlide = useCallback(() => {
    if (allImages.length > 0) {
      setCurrentImageIndex(prev => (prev + 1) % allImages.length);
      setDragOffset(0);
    }
  }, [allImages.length]);

  const prevImageSlide = useCallback(() => {
    if (allImages.length > 0) {
      setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);
      setDragOffset(0);
    }
  }, [allImages.length]);

  // Drag boshlanishi
  const handleImageDragStart = useCallback((clientX) => {
    if (allImages.length <= 1) return;
    setIsDraggingImage(true);
    startXRef.current = clientX;
    currentXRef.current = clientX;
    dragStartTimeRef.current = Date.now();
    hasMovedDuringDragRef.current = false;
  }, [allImages.length]);

  // Drag harakati
  const handleImageDragMove = useCallback((clientX) => {
    if (!isDraggingImage || allImages.length <= 1) return;
    currentXRef.current = clientX;
    const diff = clientX - startXRef.current;
    
    // Agar 3px dan ko'p harakat bo'lsa, drag deb hisobla
    if (Math.abs(diff) > 3) {
      hasMovedDuringDragRef.current = true;
    }
    
    setDragOffset(diff);
  }, [isDraggingImage, allImages.length]);

  // Drag tugashi
  const handleImageDragEnd = useCallback(() => {
    if (!isDraggingImage || allImages.length <= 1) return;
    
    const diff = currentXRef.current - startXRef.current;
    const dragDuration = Date.now() - dragStartTimeRef.current;
    const velocity = Math.abs(diff) / Math.max(dragDuration, 1);
    
    const threshold = 50;
    const velocityThreshold = 0.3;
    
    if (Math.abs(diff) > threshold || velocity > velocityThreshold) {
      if (diff > 0) {
        prevImageSlide();
      } else {
        nextImageSlide();
      }
    } else {
      setDragOffset(0);
    }
    
    setIsDraggingImage(false);
    
    // Reset flag after a small delay to allow onClick to check it first
    setTimeout(() => {
      hasMovedDuringDragRef.current = false;
    }, 150);
  }, [isDraggingImage, allImages.length, prevImageSlide, nextImageSlide]);

  // Mouse drag handlers
  const handleImageMouseDown = useCallback((e) => {
    if (showDetailSkeleton || allImages.length <= 1) return;
    e.preventDefault();
    handleImageDragStart(e.pageX);
  }, [showDetailSkeleton, allImages.length, handleImageDragStart]);

  // Touch events
  const handleImageTouchStart = useCallback((e) => {
    if (showDetailSkeleton || allImages.length <= 1) return;
    handleImageDragStart(e.touches[0].clientX);
  }, [showDetailSkeleton, allImages.length, handleImageDragStart]);

  const handleImageTouchMove = useCallback((e) => {
    if (showDetailSkeleton || allImages.length <= 1) return;
    handleImageDragMove(e.touches[0].clientX);
  }, [showDetailSkeleton, allImages.length, handleImageDragMove]);

  const handleImageTouchEnd = useCallback(() => {
    if (showDetailSkeleton || allImages.length <= 1) return;
    handleImageDragEnd();
  }, [showDetailSkeleton, allImages.length, handleImageDragEnd]);

  // Document event listeners for drag
  useEffect(() => {
    if (!isDraggingImage) return;

    const handleDocumentMouseMove = (e) => {
      handleImageDragMove(e.pageX);
    };

    const handleDocumentMouseUp = () => {
      handleImageDragEnd();
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [isDraggingImage, handleImageDragMove, handleImageDragEnd]);

  // Current image o'zgarganda dragOffset'ni tozalash
  useEffect(() => {
    if (!isDraggingImage) {
      setDragOffset(0);
    }
  }, [currentImageIndex, isDraggingImage]);

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
                      getNumberPrice(selectedStorage) ?? 
                      getNumberPrice(selectedColor) ?? 
                      getNumberPrice(productData) ?? 0;

  const handleAddToCart = async () => {
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

  const handleColorChange = (color) => {
    if (!color) return;
    setSelectedColor(color);
    setSelectedSize(color.sizes?.[0] || null);
    setSelectedStorage(color.storage?.[0] || null);
    setSelectedModel(color.models?.[0] || null);
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


  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail-grid">
          <div className="product-images">
            <div 
              className={`main-image-wrapper ${allImages.length > 1 && !showDetailSkeleton ? 'main-image-draggable' : ''} ${isDraggingImage ? 'is-dragging' : ''}`}
              ref={mainImageWrapperRef}
              onMouseDown={handleImageMouseDown}
              onTouchStart={handleImageTouchStart}
              onTouchMove={handleImageTouchMove}
              onTouchEnd={handleImageTouchEnd}
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
                className={`main-image-container ${isDraggingImage ? 'is-dragging' : ''}`}
                style={{ '--drag-offset': `${dragOffset}px` }}
                aria-busy={showDetailSkeleton}
              >
                {showDetailSkeleton ? (
                  <SkeletonPulse
                    className="product-detail-main-image__skeleton"
                    aria-hidden
                  />
                ) : (
                  <img 
                    src={allImages[currentImageIndex] || '/img/no-image.png'} 
                    alt={getLocalizedText(productData.title, lang)}
                    className="main-image"
                    onClick={(e) => {
                      // Faqat haqiqiy click bo'lsa modal och (drag emas)
                      if (
                        !isDraggingImage && 
                        !hasMovedDuringDragRef.current &&
                        Math.abs(dragOffset) < 3 && 
                        allImages.length > 0
                      ) {
                        e.preventDefault();
                        setIsImageModalOpen(true);
                      }
                    }}
                    draggable={false}
                    onError={(e) => {
                      if (!imageErrors.has(currentImageIndex)) {
                        setImageErrors(prev => new Set([...prev, currentImageIndex]));
                        e.target.src = '/img/no-image.png';
                      }
                    }}
                  />
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
                  <span>VIDEO</span>
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
                  {productData.originalPrice && (
                    <span className="original-price">{productData.originalPrice}</span>
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
                <span className="star-icon-detail">⭐</span>
                <span className="rating-value-detail">{averageRating}</span>
              </div>
              <div 
                className="comments-display-detail"
                onClick={() => setIsCommentsModalOpen(true)}
              >
                <i className="bx bxs-message-rounded"></i>
                <span className="comments-count-detail">{commentCount} ta sharh</span>
              </div>
            </div>

            {productData.colors && productData.colors.length > 0 && (
              <div className="color-selection">
                <h3>{i18n.t('productDetail.colorLabel')} {selectedColor !== null ? getLocalizedText(selectedColor?.name, lang) : getLocalizedText(productData.colors[0]?.name, lang)}</h3>
                <div className="colors-container">
                  {showDetailSkeleton
                    ? Array.from({ length: Math.min(productData.colors.length, 8) }, (_, index) => (
                        <SkeletonPulse
                          key={`color-sk-${index}`}
                          className="color-option color-option--skeleton"
                          aria-hidden
                        />
                      ))
                    : productData.colors.map((color, index) => {
                        const currentColor = selectedColor !== null ? selectedColor : productData.colors[0];
                        const isSelected = currentColor && color && (
                          (currentColor.colorFilter && color.colorFilter && currentColor.colorFilter === color.colorFilter) ||
                          (currentColor.mainImage && color.mainImage && currentColor.mainImage === color.mainImage)
                        );
                        return (
                          <img
                            key={`color-${index}-${getLocalizedText(color.name, lang) || index}`}
                            src={normalizeImagePath(color.mainImage)}
                            alt={getLocalizedText(color.name, lang) || `Color ${index + 1}`}
                            className={`color-option ${isSelected ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleColorChange(color);
                            }}
                            onError={(e) => {
                              e.target.src = normalizeImagePath('/img/no-image.png');
                            }}
                          />
                        );
                      })}
                </div>
              </div>
            )}

            {selectedColor?.sizes && selectedColor.sizes.length > 0 && (
              <div className="size-selection">
                <h3>{i18n.t('productDetail.sizeLabel')} {selectedSize !== null ? selectedSize : (selectedColor.sizes[0] || '')}</h3>
                <div className="sizes-container">
                  {showDetailSkeleton
                    ? Array.from({ length: Math.min(selectedColor.sizes.length, 10) }, (_, index) => (
                        <SkeletonPulse
                          key={`size-sk-${index}`}
                          className={`size-option size-option--skeleton size-option--skeleton-${(index % 4) + 1}`}
                          aria-hidden
                        />
                      ))
                    : selectedColor.sizes.map((size, index) => {
                        const currentSize = selectedSize !== null ? selectedSize : selectedColor.sizes[0];
                        const isSelected = size === currentSize;
                        return (
                          <button
                            key={`size-${index}`}
                            className={`size-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedSize(size);
                            }}
                          >
                            {size}
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

            {selectedColor?.storage && selectedColor.storage.length > 0 && (
              <div className="storage-selection">
                <h3>{i18n.t('productDetail.storageLabel')} {
                  selectedStorage !== null
                    ? (typeof selectedStorage === 'object' && selectedStorage.size ? selectedStorage.size : (typeof selectedStorage === 'string' ? selectedStorage : ''))
                    : (selectedColor.storage[0] ? (typeof selectedColor.storage[0] === 'object' && selectedColor.storage[0].size ? selectedColor.storage[0].size : selectedColor.storage[0]) : '')
                }</h3>
                <div className="storage-container">
                  {showDetailSkeleton
                    ? Array.from({ length: Math.min(selectedColor.storage.length, 6) }, (_, index) => (
                        <SkeletonPulse
                          key={`storage-sk-${index}`}
                          className={`storage-option storage-option--skeleton storage-option--skeleton-${(index % 3) + 1}`}
                          aria-hidden
                        />
                      ))
                    : selectedColor.storage.map((storage, index) => {
                        const storageValue = typeof storage === 'object' && storage.size ? storage.size : storage;
                        const currentStorage = selectedStorage !== null ? selectedStorage : selectedColor.storage[0];
                        const currentStorageValue = currentStorage ? (typeof currentStorage === 'object' && currentStorage.size ? currentStorage.size : currentStorage) : null;
                        const isSelected = storageValue === currentStorageValue;
                        return (
                          <button
                            key={`storage-${index}`}
                            className={`storage-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedStorage(storage);
                            }}
                          >
                            {storageValue}
                          </button>
                        );
                      })}
                </div>
              </div>
            )}

            {selectedColor?.models && selectedColor.models.length > 0 && (
              <div className="model-selection">
                <h3>{i18n.t('productDetail.modelLabel')} {
                  selectedModel !== null
                    ? (typeof selectedModel === 'object' && selectedModel.name ? selectedModel.name : (typeof selectedModel === 'string' ? selectedModel : ''))
                    : (selectedColor.models[0] ? (typeof selectedColor.models[0] === 'object' && selectedColor.models[0].name ? selectedColor.models[0].name : selectedColor.models[0]) : '')
                }</h3>
                <div className="models-container">
                  {showDetailSkeleton
                    ? Array.from({ length: Math.min(selectedColor.models.length, 6) }, (_, index) => (
                        <SkeletonPulse
                          key={`model-sk-${index}`}
                          className={`model-option model-option--skeleton model-option--skeleton-${(index % 3) + 1}`}
                          aria-hidden
                        />
                      ))
                    : selectedColor.models.map((model, index) => {
                        const modelName = typeof model === 'object' && model.name ? model.name : model;
                        const currentModel = selectedModel !== null ? selectedModel : selectedColor.models[0];
                        const currentModelName = currentModel ? (typeof currentModel === 'object' && currentModel.name ? currentModel.name : currentModel) : null;
                        const isSelected = modelName === currentModelName;
                        return (
                          <button
                            key={`model-${index}`}
                            className={`model-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedModel(model);
                            }}
                          >
                            {modelName}
                          </button>
                        );
                      })}
                </div>
              </div>
            )}

            <div className='addo-btn__detail'>
              <button
                className="add-to-cart-btn-detail"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
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

