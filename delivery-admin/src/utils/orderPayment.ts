export function formatOrderMoney(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

function normalizePaymentMethod(raw?: string | null) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
}

/**
 * Online (payme/click) = to‘langan.
 * Naqd (on_delivery / cash / naqd) = to‘lanmagan.
 * Server `isPaid` asosiy manba; paymentMethod — zaxira.
 */
export function resolveOrderPaid(input?: {
  isPaid?: boolean;
  paymentStatus?: string;
  paymentMethod?: string;
} | null) {
  if (!input) return false;

  const method = normalizePaymentMethod(input.paymentMethod);
  if (
    method === 'on_delivery' ||
    method === 'cash' ||
    method === 'naqt' ||
    method === 'naqd'
  ) {
    return false;
  }
  if (method === 'payme' || method === 'click') {
    return true;
  }

  if (input.isPaid != null) return Boolean(input.isPaid);

  const status = String(input.paymentStatus || '').trim().toLowerCase();
  return status === 'paid' || status === 'delivered';
}
