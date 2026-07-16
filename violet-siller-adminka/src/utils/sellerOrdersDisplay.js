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

export function getSellerOrderPaymentLabel(paymentMethod, t) {
  const method = String(paymentMethod || '').trim().toLowerCase();
  if (method === 'payme') return t('orders.payment.payme');
  if (method === 'click') return t('orders.payment.click');
  if (method === 'on_delivery') return t('orders.payment.cash');
  return t('orders.payment.unknown');
}

export function getSellerOrderProductCodesLabel(order) {
  const codes = Array.isArray(order?.productCodes)
    ? order.productCodes.filter(Boolean)
    : [];
  if (codes.length > 0) return codes.join(', ');
  return order?.orderCode || '—';
}
