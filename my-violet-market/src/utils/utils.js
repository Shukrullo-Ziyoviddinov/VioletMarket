// Import statements
import { deliveryPrices, cargoRates } from '../data/cargo';

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
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'number') return opt.toString();
  if (typeof opt === 'object' && opt.name != null) {
    const name = opt.name;
    if (typeof name === 'object' && (name.uz != null || name.ru != null))
      return getLocalizedText(name, lang || 'uz');
    return typeof name === 'string' ? name : String(name);
  }
  if (typeof opt === 'object' && opt.size) return opt.size;
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

/**
 * Qidiruv uchun matnni normalizatsiya qilish: tire, apostrof -> bo'shliq, kichik harf.
 * Masalan: "trend-mahsulot" -> "trend mahsulot", "o'yinchoq" -> "o yinchoq"
 */
function normalizeForSearch(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[-''`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matndan so'z tokenlarini olish (min 3 belgi – katta saytlar logikasi).
 */
function getTokens(str) {
  return normalizeForSearch(str).split(/\s+/).filter((t) => t.length >= 3);
}

/**
 * Levenshtein masofasi – 1 xato (trand->trend, ombor->ombur) uchun.
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Ikki so'z o'xshashmi. Katta saytlar logikasi: kamida 3 ketma-ket harf mos bo'lishi kerak.
 * "kitob" va "to" – 2 harf, mos EMAS (ayollar to'plami chiqmasin).
 * "kitob" va "kitob" – to'liq mos. "kitop" va "kitob" – Levenshtein 1.
 */
function tokensMatch(qToken, tToken) {
  if (!qToken || !tToken) return false;
  if (qToken.length < 3 || tToken.length < 3) return false;
  if (tToken.includes(qToken) || qToken.includes(tToken)) return true;
  if (qToken.length <= 8 && tToken.length <= 8 && levenshteinDistance(qToken, tToken) <= 1) return true;
  return false;
}

/**
 * Matn text ichida bor-yo'qligini tekshirish (min 3 belgi – taluqsiz natijalarni kamaytirish).
 */
function textContainsRelevantSubstring(textNorm, qNorm) {
  if (!textNorm || !qNorm || qNorm.length < 3) return false;
  if (textNorm.includes(qNorm)) return true;
  for (let len = 3; len <= qNorm.length; len++) {
    const sub = qNorm.slice(0, len);
    if (textNorm.includes(sub)) return true;
  }
  return false;
}

/**
 * Qidiruv: title, productType, category bo'yicha moslik.
 * - To'g'ridan-to'g'ri substring (sava -> savatcha, kitob -> Diniy kitob)
 * - productType va category ham qidiriladi (kitob -> productType: kitob, category: Kitoblar)
 * - Tire/bo'shliq normalizatsiya
 * - O'xshash yozuv (kitop->kitob, trand->trend)
 * - 2 belgili substring O'CHIRILGAN – taluqsiz mahsulotlar chiqmasin
 */
function productMatchesSearchFlexible(product, searchQuery) {
  const q = (searchQuery || '').trim();
  if (!q) return false;

  const titleStr = getLocalizedText(product.title, 'uz') || getLocalizedText(product.title, 'ru') || (typeof product.title === 'string' ? product.title : '');
  const productTypeStr = (product.productType || '').toString();
  const categoryStr = (product.category || '').toString();

  const searchableText = [titleStr, productTypeStr, categoryStr].filter(Boolean).join(' ');
  const qNorm = normalizeForSearch(q);
  const searchNorm = normalizeForSearch(searchableText);
  if (!qNorm || !searchNorm) return false;

  if (searchNorm.includes(qNorm)) return true;
  if (qNorm.includes(searchNorm) && searchNorm.length >= 3) return true;

  if (textContainsRelevantSubstring(searchNorm, qNorm)) return true;

  const qTokens = getTokens(q);
  const searchTokens = getTokens(searchableText);

  for (const qt of qTokens) {
    for (const st of searchTokens) {
      if (tokensMatch(qt, st)) return true;
    }
  }

  return false;
}

/**
 * Qidiruv: product.title bo'yicha, ichida (substring) mos keladi.
 * Registrsiz: "k" -> kiyimlar; "sava" -> savatcha; "trend" -> trend-mahsulot.
 */
export const productMatchesSearchByTitle = (product, searchQuery) => {
  return productMatchesSearchFlexible(product, searchQuery);
};

/**
 * Qidiruv natijalari: to'liq mos + o'xshash (query yoki uning prefiksi title ichida).
 * Masalan "kiyimlar" -> kiyimlar, kiyim, kiyimchalar; "trand" -> trend; "sava" -> savatcha.
 */
export const productMatchesSearchByTitleWithSimilar = (product, searchQuery) => {
  return productMatchesSearchFlexible(product, searchQuery);
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

// Yetkazib berish narxini hisoblash
export const calculateDeliveryPrice = (totalProductPrice, selectedDeliveryType = 'toshkent') => {
  
  const deliveryType = selectedDeliveryType === 'toshkent'
    ? deliveryPrices.toshkent
    : deliveryPrices.viloyat;
  
  if (selectedDeliveryType === 'toshkent') {
    if (totalProductPrice < 20000) return deliveryType.pricetsh1; // 7000
    if (totalProductPrice < 50000) return deliveryType.pricetsh2; // 5000
    return deliveryType.pricetsh3; // 0 (Bepul)
  } else {
    if (totalProductPrice < 20000) return deliveryType.pricev1; // 20000
    if (totalProductPrice < 50000) return deliveryType.pricev2; // 15000
    if (totalProductPrice < 100000) return deliveryType.pricev3; // 13000
    if (totalProductPrice < 150000) return deliveryType.pricev4; // 10000
    return deliveryType.pricev5; // 0 (Bepul)
  }
};

// Kargo narxini hisoblash
export const calculateCargoPrice = (items, selectedCargoOptions = {}) => {
  
  const countryGroups = {};
  
  // Davlatlar bo'yicha guruhlash
  items.forEach(item => {
    if (item.countries && item.countries.length > 0) {
      item.countries.forEach(country => {
        const countryKey = country.toLowerCase();
        if (!countryGroups[countryKey]) {
          countryGroups[countryKey] = [];
        }
        countryGroups[countryKey].push(item);
      });
    }
  });
  
  let totalCargoPrice = 0;
  
  Object.keys(countryGroups).forEach(countryKey => {
    const cargoInfo = cargoRates[countryKey];
    if (!cargoInfo || countryKey === 'uzb') return; // UZB uchun kargo yo'q
    
    const items = countryGroups[countryKey];
    
    // Vaznni hisoblash
    const totalWeight = items.reduce((sum, item) => {
      return sum + ((item.weight || 300) * (item.quantity || 1));
    }, 0);
    const weightInKg = totalWeight / 1000; // gram -> kg
    
    // Tanlangan kargo turi
    const selectedType = selectedCargoOptions[countryKey] || 'standard';
    const rate = cargoInfo[selectedType];
    
    // Kargo narxi
    const cargoPrice = Math.ceil(weightInKg * rate * 100) / 100;
    totalCargoPrice += cargoPrice;
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
  if (!imagePath) return '/img/no-image.png';
  
  // Agar base64 yoki data URL bo'lsa, qaytarish
  if (imagePath.startsWith('data:')) return imagePath;
  
  // Agar http yoki https bo'lsa, qaytarish
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  
  // Agar / bilan boshlansa, qaytarish
  if (imagePath.startsWith('/')) return imagePath;
  
  // Agar "my-app/img/" bilan boshlansa, uni "/img/" ga o'zgartirish
  if (imagePath.startsWith('my-app/img/')) {
    return '/' + imagePath.replace('my-app/', '');
  }
  
  // Agar "my-app/" bilan boshlansa, uni "/" ga o'zgartirish
  if (imagePath.startsWith('my-app/')) {
    return '/' + imagePath.replace('my-app/', '');
  }
  
  // Boshqa holatlarda "/" qo'shish
  return '/' + imagePath;
};