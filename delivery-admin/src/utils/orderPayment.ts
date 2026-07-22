export function formatOrderMoney(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

export function resolveOrderPaid(input?: {
  isPaid?: boolean;
  paymentStatus?: string;
} | null) {
  if (!input) return false;
  if (input.isPaid != null) return Boolean(input.isPaid);
  const status = String(input.paymentStatus || '').trim().toLowerCase();
  return status === 'paid' || status === 'delivered';
}
