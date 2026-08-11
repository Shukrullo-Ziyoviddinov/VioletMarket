import { getApiBaseUrl } from '../config/api';
import {
  calcForeignCountryCargoPrice,
  groupCartItemsByCountry,
} from './cargoGrouping';

const FALLBACK_IMAGE_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
      <rect width="320" height="240" fill="#f3eef9"/>
      <rect x="36" y="28" width="248" height="184" rx="14" fill="#ffffff" stroke="#e3d7f2"/>
      <circle cx="112" cy="104" r="26" fill="#d8c7ef"/>
      <path d="M72 178l52-50 34 32 26-24 64 42H72z" fill="#c6b1e7"/>
      <text x="160" y="204" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#7b649e">
        Image not available
      </text>
    </svg>`
  );

export const getPortalContainer = () =>
  document.getElementById('modal-root') || document.body;

// Narx formatlash
export const formatPrice = (price) => {
  if (!price) return "0 UZS";
  const numPrice = typeof price === 'string' ? parseFloat(price.replace(/\s/g, '')) : price;
  return new Intl.NumberFormat('uz-UZ').format(numPrice) + " UZS";
};

// Kargo narxini formatlash
export const formatCargoPrice = (price) => {
  return '$' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

// Label olish (string, number yoki object dan). name { uz, ru } bo'lsa lang bo'yicha qaytaradi.
export const getLabelFromOption = (opt, lang) => {
  if (!opt) return '';
  if (typeof opt === 'string') return String(opt).trim();
  if (typeof opt === 'number') return opt.toString();
  if (typeof opt === 'object' && opt.name != null) {
    const name = opt.name;
    if (typeof name === 'object' && (name.uz != null || name.ru != null)) {
      return String(getLocalizedText(name, lang || 'uz') || '').trim();
    }
    return typeof name === 'string' ? name.trim() : String(name).trim();
  }
  // CartModal color: name bo‘lmasa colorFilter ishlatiladi
  if (typeof opt === 'object' && opt.colorFilter != null) {
    return String(opt.colorFilter).trim();
  }
  if (typeof opt === 'object' && opt.size != null) {
    return String(opt.size).trim();
  }
  if (typeof opt === 'object' && opt.label != null) {
    return String(opt.label).trim();
  }
  return '';
};

// Narxni raqamga aylantirish (UZS, so'm, $ va bo'shliqlarni olib tashlaydi)
export const getNumberPrice = (val) => {
  if (!val) return null;
  if (typeof val === 'number') return val;
  let str = '';
  if (typeof val === 'object' && val.price) str = String(val.price);
  else if (typeof val === 'string') str = val;
  else return null;
  const priceStr = str.replace(/\s/g, '').replace(/UZS/gi, '').replace(/so'm/gi, '').replace(/\$/g, '').replace(/,/g, '').trim();
  const num = parseFloat(priceStr);
  return isNaN(num) ? null : num;
};

// Mahsulotdan narxni raqam sifatida olish (product.price yoki birinchi rang narxi)
export const getProductPriceNumber = (product) => {
  if (!product) return null;
  const fromProduct = getNumberPrice(product.price);
  if (fromProduct != null) return fromProduct;
  const firstColor = product.colors?.[0];
  if (firstColor?.price) return getNumberPrice(firstColor.price);
  if (firstColor?.originalPrice) return getNumberPrice(firstColor.originalPrice);
  return getNumberPrice(product.originalPrice) || null;
};

// OriginalPrice olish
export const getOriginalPrice = (val) => {
  if (!val) return null;
  if (typeof val === 'object' && val.originalPrice) {
    return getNumberPrice(val.originalPrice);
  }
  return null;
};

function extractNumberCandidates(text) {
  const parts = String(text || '').match(/\d[\d\s,.]*/g) || [];
  return parts
    .map((part) => Number(String(part).replace(/[^\d]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function parseTierBounds(labelValue) {
  const texts = [];
  if (typeof labelValue === 'string') {
    texts.push(labelValue);
  } else if (labelValue && typeof labelValue === 'object') {
    if (typeof labelValue.uz === 'string') texts.push(labelValue.uz);
    if (typeof labelValue.ru === 'string') texts.push(labelValue.ru);
  }

  let best = { lower: null, upper: null, score: -1 };
  texts.forEach((rawText) => {
    const text = String(rawText || '').toLowerCase();
    const nums = extractNumberCandidates(text);
    if (!nums.length) return;

    let lower = null;
    let upper = null;
    if (nums.length >= 2) {
      lower = Math.min(...nums);
      upper = Math.max(...nums);
    } else {
      const n = nums[0];
      const hasUpperHint = /(gacha|до|up to|maximum|максимум|max)/i.test(text);
      const hasLowerHint = /(dan|от|from|>=|plus|\+)/i.test(text);
      if (hasLowerHint && !hasUpperHint) {
        lower = n;
      } else if (hasUpperHint && !hasLowerHint) {
        upper = n;
      } else {
        upper = n;
      }
    }

    const score = (lower != null ? 1 : 0) + (upper != null ? 1 : 0);
    if (score > best.score) {
      best = { lower, upper, score };
    }
  });

  return {
    lower: best.lower,
    upper: best.upper,
  };
}

export function getDeliveryTiers(regionData, regionKey = 'toshkent') {
  const data = regionData && typeof regionData === 'object' ? regionData : {};
  const isViloyat = String(regionKey || '').toLowerCase() === 'viloyat';
  const labelPrefix = isViloyat ? 'namePricev' : 'namePricetsh';
  const pricePrefix = isViloyat ? 'pricev' : 'pricetsh';

  const indexSet = new Set();
  Object.keys(data).forEach((key) => {
    const labelMatch = key.match(new RegExp(`^${labelPrefix}(\\d+)$`));
    if (labelMatch) indexSet.add(Number(labelMatch[1]));
    const priceMatch = key.match(new RegExp(`^${pricePrefix}(\\d+)$`));
    if (priceMatch) indexSet.add(Number(priceMatch[1]));
  });

  const indexes = Array.from(indexSet)
    .filter((i) => Number.isFinite(i) && i > 0)
    .sort((a, b) => a - b);

  return indexes.map((index) => {
    const label = data[`${labelPrefix}${index}`];
    const rawPrice = data[`${pricePrefix}${index}`];
    const numericPrice = Number(rawPrice);
    const bounds = parseTierBounds(label);
    return {
      index,
      label,
      price: Number.isFinite(numericPrice) ? numericPrice : 0,
      lower: bounds.lower,
      upper: bounds.upper,
    };
  });
}

// Yetkazib berish narxini hisoblash (deliveryPrices — API / AppData dan)
export const calculateDeliveryPrice = (totalProductPrice, selectedDeliveryType = 'toshkent', deliveryPrices) => {
  if (!deliveryPrices?.toshkent || !deliveryPrices?.viloyat) return 0;

  const deliveryType = selectedDeliveryType === 'toshkent'
    ? deliveryPrices.toshkent
    : deliveryPrices.viloyat;
  const tiers = getDeliveryTiers(deliveryType, selectedDeliveryType);
  if (!tiers.length) return 0;

  let bestLowerTier = null;
  for (const tier of tiers) {
    if (tier.lower != null && totalProductPrice >= tier.lower) {
      if (!bestLowerTier || tier.lower > bestLowerTier.lower) {
        bestLowerTier = tier;
      }
    }

    if (
      tier.upper != null &&
      totalProductPrice < tier.upper &&
      (tier.lower == null || totalProductPrice >= tier.lower)
    ) {
      return tier.price;
    }
  }

  if (bestLowerTier) return bestLowerTier.price;
  return tiers[tiers.length - 1]?.price || 0;
};

// Kargo narxini hisoblash (cargoRates — API / AppData dan)
// Har bir mamlakat alohida; mamlakat ichida standard_only / unrestricted ajratiladi.
export const calculateCargoPrice = (items, selectedCargoOptions = {}, cargoRates) => {
  if (!cargoRates || typeof cargoRates !== 'object') return 0;

  const countryGroups = groupCartItemsByCountry(items);
  let totalCargoPrice = 0;

  Object.keys(countryGroups).forEach((countryKey) => {
    const cargoInfo = cargoRates[countryKey];
    if (!cargoInfo || countryKey === 'uzb') return;

    totalCargoPrice += calcForeignCountryCargoPrice(
      countryKey,
      countryGroups[countryKey],
      selectedCargoOptions,
      cargoInfo,
    );
  });

  return totalCargoPrice;
};

// Yulduz ko'rinishini yaratish
export const generateStarDisplay = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let starsHTML = '';
  
  // To'ldirilgan yulduzlar
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '★';
  }
  
  // Yarim yulduz
  if (hasHalfStar) {
    starsHTML += '☆';
  }
  
  // Bo'sh yulduzlar
  const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < remainingStars; i++) {
    starsHTML += '☆';
  }
  
  return starsHTML;
};

// O'rtacha bahoni hisoblash
export const calculateRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return sum / ratings.length;
};

/**
 * Til bo'yicha matn olish (product.title, description, relatedGroups[].title, colors[].name).
 * Agar obj { uz, ru } bo'lsa — lang bo'yicha qaytaradi, string bo'lsa — o'zini.
 */
export const getLocalizedText = (obj, lang = 'uz') => {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object' && (obj.uz != null || obj.ru != null)) {
    return obj[lang] ?? obj.uz ?? obj.ru ?? '';
  }
  return '';
};

// Rasm yo'lini normalizatsiya qilish
export const normalizeImagePath = (imagePath) => {
  if (!imagePath) return FALLBACK_IMAGE_DATA_URL;
  const rawPath = String(imagePath).trim();
  if (!rawPath) return FALLBACK_IMAGE_DATA_URL;
  const normalizedSlashes = rawPath.replace(/\\/g, '/');
  
  // Agar base64 yoki data URL bo'lsa, qaytarish
  if (normalizedSlashes.startsWith('data:')) return normalizedSlashes;
  
  // Agar http yoki https bo'lsa, qaytarish
  if (normalizedSlashes.startsWith('http://') || normalizedSlashes.startsWith('https://')) return normalizedSlashes;

  // Kodda ko'p joyda ishlatiladigan fallback path (fayl bo'lmasa ham bu SVG ishlaydi)
  if (normalizedSlashes === '/img/no-image.png' || normalizedSlashes === 'img/no-image.png') {
    return FALLBACK_IMAGE_DATA_URL;
  }

  const isUploadPath =
    normalizedSlashes.startsWith('/uploads/') ||
    normalizedSlashes.startsWith('uploads/') ||
    normalizedSlashes.startsWith('/public/uploads/') ||
    normalizedSlashes.startsWith('public/uploads/') ||
    normalizedSlashes.includes('/uploads/');
  
  // Admin orqali yuklangan rasmlar backend domenidan ochilishi kerak
  if (isUploadPath) {
    const uploadStartIndex = normalizedSlashes.indexOf('/uploads/');
    const uploadRelative =
      uploadStartIndex >= 0
        ? normalizedSlashes.slice(uploadStartIndex)
        : normalizedSlashes
            .replace(/^\/?public\//, '/')
            .replace(/^\/?uploads\//, '/uploads/');
    const normalizedUploadPath = uploadRelative.startsWith('/')
      ? uploadRelative
      : `/${uploadRelative}`;
    return `${getApiBaseUrl()}${normalizedUploadPath}`;
  }

  // Ba'zi yozuvlarda faqat upload fayl nomi qolishi mumkin (admin-*.png va h.k.)
  if (/^(admin-|upload-|image-).+\.[a-z0-9]+$/i.test(normalizedSlashes)) {
    return `${getApiBaseUrl()}/uploads/${normalizedSlashes}`;
  }

  // Agar / bilan boshlansa, qaytarish
  if (normalizedSlashes.startsWith('/')) return normalizedSlashes;
  
  // Agar "my-app/img/" bilan boshlansa, uni "/img/" ga o'zgartirish
  if (normalizedSlashes.startsWith('my-app/img/')) {
    return '/' + normalizedSlashes.replace('my-app/', '');
  }
  
  // Agar "my-app/" bilan boshlansa, uni "/" ga o'zgartirish
  if (normalizedSlashes.startsWith('my-app/')) {
    return '/' + normalizedSlashes.replace('my-app/', '');
  }
  
  // Boshqa holatlarda "/" qo'shish
  return '/' + normalizedSlashes;
};