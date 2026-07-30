/**
 * Offline / UI fallback.
 * Manba: GET /api/delivery-auth/regions (violet-server deliveryRegions.js)
 * Ro‘yxat o‘zgarsa avvalo serverni yangilang — client modal API dan oladi.
 */
export const FALLBACK_DELIVERY_REGIONS = [
  'Toshkent',
  'Toshkent viloyati',
  'Andijon',
  'Buxoro',
  "Farg'ona",
  'Jizzax',
  'Namangan',
  'Navoiy',
  'Qashqadaryo',
  'Samarqand',
  'Sirdaryo',
  'Surxondaryo',
  'Xorazm',
  "Qoraqalpog'iston",
] as const;

/** @deprecated Use FALLBACK_DELIVERY_REGIONS — sync source is server API */
export const DELIVERY_REGIONS = FALLBACK_DELIVERY_REGIONS;

export type DeliveryRegion = string;

export function normalizeRegionKey(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[ʻ’'`]/g, "'")
    .replace(/\s+/g, ' ');
}

export function isDeliveryRegion(
  value: string,
  regions: readonly string[] = FALLBACK_DELIVERY_REGIONS,
): boolean {
  const key = normalizeRegionKey(value);
  if (!key) return false;
  return regions.some((region) => normalizeRegionKey(region) === key);
}

export function canonicalizeDeliveryRegion(
  value?: string | null,
  regions: readonly string[] = FALLBACK_DELIVERY_REGIONS,
) {
  const key = normalizeRegionKey(String(value || ''));
  if (!key) return '';
  const match = regions.find((region) => normalizeRegionKey(region) === key);
  return match || '';
}

export function resolveDeliveryRegionLabel(value?: string | null) {
  const region = String(value || '').trim();
  return region || 'Hali tanlanmagan';
}

export function pickInitialRegion(
  currentRegion: string | null | undefined,
  regions: readonly string[],
) {
  const current = canonicalizeDeliveryRegion(currentRegion, regions);
  if (current) return current;
  return '';
}
