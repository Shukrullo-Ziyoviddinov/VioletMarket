/** Xitoy ombori — faqat `sellerCountry: "China"` */
export function isChinaWarehouseProduct(product, getSellerById) {
  const sellerId = String(product?.sellerId || '').trim();
  if (!sellerId || typeof getSellerById !== 'function') return false;
  const seller = getSellerById(sellerId);
  return String(seller?.sellerCountry || '').trim().toLowerCase() === 'china';
}

const COUNTRY_CODE_ALIASES = {
  xitoy: 'china',
  kitay: 'china',
  aqsh: 'usa',
  us: 'usa',
  koreya: 'korea',
};

/** Turli yozilgan davlat kodlarini bitta standart kodga o'tkazish */
export function normalizeCountryCode(value) {
  const key = String(value || '').toLowerCase().trim();
  if (!key) return '';
  return COUNTRY_CODE_ALIASES[key] || key;
}

/** Mahsulot/savat elementi `countries` maydonini normallashtirish */
export function normalizeProductCountries(productOrItem) {
  let raw = productOrItem?.countries;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        raw = JSON.parse(trimmed);
      } catch {
        raw = [trimmed];
      }
    } else {
      raw = [trimmed];
    }
  }

  if (!Array.isArray(raw)) return [];

  return raw
    .map((c) => normalizeCountryCode(c))
    .filter(Boolean);
}

/** O'zbekiston ombori — `countries` ichida `uzb` */
export function isUzWarehouseProduct(product, getSellerById) {
  const sellerId = String(product?.sellerId || '').trim();
  if (!sellerId || typeof getSellerById !== 'function') return false;
  const seller = getSellerById(sellerId);
  return String(seller?.sellerCountry || '').trim().toLowerCase() === 'uzb';
}

/** Faqat berilgan davlat ombori — `countries` faqat shu davlat */
export function isExclusiveCountryProduct(product, countryKey) {
  const normalized = normalizeProductCountries(product);
  const key = normalizeCountryCode(countryKey);
  return normalized.length > 0 && normalized.every((c) => c === key);
}

/** Faqat O'zbekiston ombori — `countries` faqat `uzb` (boshqa davlat yo'q) */
export function isUzOnlyWarehouseProduct(product) {
  return isExclusiveCountryProduct(product, 'uzb');
}
