export function masterCategoryLocaleKey(nameUz) {
  return String(nameUz || '')
    .trim()
    .toLowerCase()
    .replace(/[''`ʻ]/g, '')
    .replace(/\s+/g, '-');
}
