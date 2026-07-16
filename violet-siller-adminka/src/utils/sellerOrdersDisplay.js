const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function formatSellerOrderAmount(value) {
  const amount = Number(value) || 0;
  return `${new Intl.NumberFormat('uz-UZ').format(amount)} so'm`;
}

export function formatSellerOrderDateTime(value, t) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const weekdayKey = WEEKDAY_KEYS[date.getDay()];
  const weekday = t ? t(`orders.weekdays.${weekdayKey}`) : weekdayKey;

  return `${year}-${month}-${day} · ${weekday} · ${hours}:${minutes}`;
}

export function getSellerOrderBuyerName(buyer) {
  const firstName = String(buyer?.firstName || '').trim();
  const lastName = String(buyer?.lastName || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return fullName || '—';
}

export function getSellerOrderBuyerPhone(buyer) {
  const phone = String(buyer?.phone || '').trim();
  return phone || '—';
}

export function getSellerOrderProductTitle(order, language = 'uz') {
  const title = order?.title;
  if (!title || typeof title !== 'object') {
    return String(order?.productCode || order?.productId || '').trim() || '—';
  }

  const lang = String(language || 'uz').trim();
  if (lang === 'ru') return title.ru || title.uz || order?.productCode || '—';
  return title.uz || title.ru || order?.productCode || '—';
}

export function getSellerOrderPaymentTone(paymentMethod) {
  const method = String(paymentMethod || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');

  if (method === 'payme' || method === 'click') return 'paid';
  if (method === 'on_delivery' || method === 'cash' || method === 'naqt' || method === 'naqd') {
    return 'cash';
  }
  return 'unknown';
}

export function getSellerOrderPaymentLabel(paymentMethod, t) {
  const tone = getSellerOrderPaymentTone(paymentMethod);
  if (tone === 'paid') return t('orders.payment.paid');
  if (tone === 'cash') return t('orders.payment.cash');
  return t('orders.payment.unknown');
}
