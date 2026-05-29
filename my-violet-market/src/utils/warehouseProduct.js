/** Xitoy ombori — faqat `sellerCountry: "China"` */
export function isChinaWarehouseProduct(product) {
  return String(product?.sellerCountry ?? '').trim().toLowerCase() === 'china';
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
    .map((c) => String(c || '').toLowerCase().trim())
    .filter(Boolean);
}

/** O'zbekiston ombori — `countries` ichida `uzb` */
export function isUzWarehouseProduct(product) {
  return normalizeProductCountries(product).includes('uzb');
}

/** Faqat berilgan davlat ombori — `countries` faqat shu davlat */
export function isExclusiveCountryProduct(product, countryKey) {
  const normalized = normalizeProductCountries(product);
  const key = String(countryKey || '').toLowerCase().trim();
  return normalized.length > 0 && normalized.every((c) => c === key);
}

/** Faqat O'zbekiston ombori — `countries` faqat `uzb` (boshqa davlat yo'q) */
export function isUzOnlyWarehouseProduct(product) {
  return isExclusiveCountryProduct(product, 'uzb');
}
