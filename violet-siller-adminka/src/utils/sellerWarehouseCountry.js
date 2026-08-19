const WAREHOUSE_COUNTRY_ALIASES = {
  xitoy: 'china',
  kitay: 'china',
  turkey: 'turkiya',
  koreya: 'korea',
  aqsh: 'usa',
  us: 'usa',
};

function canonicalWarehouseCode(value) {
  const key = String(value || '').trim().toLowerCase();
  if (!key) return '';
  return WAREHOUSE_COUNTRY_ALIASES[key] || key;
}

/** Ombor kodi = siller sellerCountry (shippingCountries ro'yxatidagi code). */
export function resolveSellerWarehouseCountryCode(sellerCountry, shippingCountries = []) {
  const canonical = canonicalWarehouseCode(sellerCountry);
  if (!canonical) return '';

  const match = (Array.isArray(shippingCountries) ? shippingCountries : []).find((row) => {
    const code = canonicalWarehouseCode(row?.code);
    return Boolean(code) && code === canonical;
  });

  return match ? String(match.code) : canonical;
}

export function sellerWarehouseCountryLabel(code, shippingCountries = [], lang = 'uz') {
  const key = canonicalWarehouseCode(code);
  const row = (Array.isArray(shippingCountries) ? shippingCountries : []).find(
    (item) => canonicalWarehouseCode(item?.code) === key,
  );
  if (!row) return String(code || '').toUpperCase();
  const name = row.name && typeof row.name === 'object' ? row.name : {};
  return String(name[lang] || name.uz || row.code || code).trim();
}
