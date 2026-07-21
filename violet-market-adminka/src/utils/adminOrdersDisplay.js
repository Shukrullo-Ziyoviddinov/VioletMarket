const WEEKDAY_LABELS = {
  sunday: 'Yakshanba',
  monday: 'Dushanba',
  tuesday: 'Seshanba',
  wednesday: 'Chorshanba',
  thursday: 'Payshanba',
  friday: 'Juma',
  saturday: 'Shanba',
};

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function formatAdminOrderAmount(value) {
  const amount = Number(value) || 0;
  return `${new Intl.NumberFormat('uz-UZ').format(amount)} so'm`;
}

export function formatAdminOrderDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const weekdayKey = WEEKDAY_KEYS[date.getDay()];
  const weekday = WEEKDAY_LABELS[weekdayKey] || weekdayKey;

  return `${year}-${month}-${day} · ${weekday} · ${hours}:${minutes}`;
}

export function getAdminOrderBuyerName(buyer) {
  const firstName = String(buyer?.firstName || '').trim();
  const lastName = String(buyer?.lastName || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return fullName || '—';
}

export function getAdminOrderBuyerPhone(buyer) {
  const phone = String(buyer?.phone || '').trim();
  return phone || '—';
}

export function getAdminOrderProductTitle(order, language = 'uz') {
  const title = order?.title;
  if (!title || typeof title !== 'object') {
    return String(order?.productCode || order?.productId || '').trim() || '—';
  }

  const lang = String(language || 'uz').trim();
  if (lang === 'ru') return title.ru || title.uz || order?.productCode || '—';
  return title.uz || title.ru || order?.productCode || '—';
}

export function getAdminOrderPaymentTone(paymentMethod) {
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

export function getAdminOrderPaymentLabel(paymentMethod) {
  const tone = getAdminOrderPaymentTone(paymentMethod);
  if (tone === 'paid') return "To'langan";
  if (tone === 'cash') return 'Naqt';
  return "Noma'lum";
}

export function getAdminOrderSellerName(order) {
  const name = String(order?.seller?.name || '').trim();
  if (name) return name;
  const sellerId = String(order?.sellerId || order?.seller?.id || '').trim();
  return sellerId || 'Noma’lum siller';
}

export function getAdminOrderStatusLabel(trackingStatus) {
  const status = String(trackingStatus || '').trim();
  if (status === 'accepted') return 'Tasdiqlash kutilmoqda';
  if (status === 'seller_confirmed') return "Mahsulotni yig'ish";
  if (status === 'collected') return 'Kuryerga topshirish';
  if (status === 'handed_to_courier') return 'Kuryerga topshirilgan';
  if (status === 'no_answer') return 'Javob bermadi';
  return status || '—';
}

export function getAdminOrderStatusTone(trackingStatus) {
  const status = String(trackingStatus || '').trim();
  if (status === 'accepted') return 'pending';
  if (status === 'seller_confirmed') return 'collect';
  if (status === 'collected') return 'courier';
  if (status === 'handed_to_courier') return 'handed';
  if (status === 'no_answer') return 'no-answer';
  return 'unknown';
}
