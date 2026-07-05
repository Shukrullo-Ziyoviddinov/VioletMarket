export const SELLER_EARNINGS_SOLD_PRODUCT_STATUS = {
  AVAILABLE: 'available',
  IN_PROCESS: 'in_process',
  WITHDRAWN: 'withdrawn',
  REJECTED: 'rejected',
};

export function formatSellerEarningsSoldProductDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function formatSellerEarningsAmount(value) {
  const amount = Number(value) || 0;
  return `${new Intl.NumberFormat('uz-UZ').format(amount)} so'm`;
}

export function getSoldProductTitle(row, language = 'uz') {
  const title = row?.title;
  if (!title || typeof title !== 'object') {
    return String(row?.productCode || row?.productId || '').trim();
  }

  const lang = ['uz', 'en', 'zh'].includes(String(language || '').trim())
    ? String(language).trim()
    : 'uz';

  if (lang === 'ru') return title.ru || title.uz || '';
  if (lang === 'en' || lang === 'zh') return title.uz || title.ru || '';
  return title.uz || title.ru || '';
}
