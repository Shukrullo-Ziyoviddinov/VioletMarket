export function formatPaymentRequestAmount(value) {
  const amount = Number(value) || 0;
  return `${new Intl.NumberFormat('uz-UZ').format(amount)} so'm`;
}

export function formatPaymentRequestDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function getPaymentRequestProductTitle(item) {
  const title = item?.title;
  if (!title || typeof title !== 'object') return item?.productCode || '';
  return title.uz || title.ru || item?.productCode || '';
}

export const PAYMENT_REQUEST_STATUS_LABELS = {
  in_process: 'Jarayonda',
  withdrawn: 'Yechilgan',
  rejected: 'Rad etilgan',
};
