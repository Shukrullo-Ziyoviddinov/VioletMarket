/** Xitoy ombori — faqat `sellerCountry: "China"` */
export function isChinaWarehouseProduct(product) {
  return String(product?.sellerCountry ?? '').trim().toLowerCase() === 'china';
}

/** O'zbekiston ombori — `countries` ichida `uzb` */
export function isUzWarehouseProduct(product) {
  const countries = product?.countries;
  if (!Array.isArray(countries)) return false;
  return countries.some((c) => String(c || '').toLowerCase().trim() === 'uzb');
}
