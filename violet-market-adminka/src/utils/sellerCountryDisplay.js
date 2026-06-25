export function getSellerCountryCode(record) {
  const code = record?.sellerAccount?.sellerCountry ?? record?.sellerCountry ?? '';
  return String(code).trim().toLowerCase();
}

export function formatSellerCountry(code) {
  const normalized = String(code || '').trim().toLowerCase();
  return normalized || '—';
}

export function getSellerCountryTagColor(code) {
  if (code === 'china') return 'volcano';
  if (code === 'uzb') return 'green';
  return 'default';
}
