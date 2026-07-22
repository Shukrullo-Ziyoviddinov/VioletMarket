/**
 * Kuryer assignment status — asosiy admin UI.
 */

export const COURIER_ASSIGNMENT_STATUS_LABELS = {
  accepted: 'Sotuvchiga borish',
  en_route_to_seller: 'Sotuvchiga yo‘lda',
  arrived_at_seller: 'Mahsulot olish',
  picked_up: 'Mijozga borish',
  en_route_to_customer: 'Mijozga yo‘lda',
  arrived_at_customer: 'Topshirish',
  delivered: 'Topshirilgan',
  cancelled: 'Qaytarilgan',
};

export const COURIER_ASSIGNMENT_PROGRESS_STEPS = [
  { key: 'accepted', label: 'Qabul' },
  { key: 'en_route_to_seller', label: 'Sotuvchiga' },
  { key: 'arrived_at_seller', label: 'Keldi' },
  { key: 'picked_up', label: 'Oldi' },
  { key: 'en_route_to_customer', label: 'Mijozga' },
  { key: 'arrived_at_customer', label: 'Yetdi' },
  { key: 'delivered', label: 'Topshirdi' },
];

const STATUS_STEP_INDEX = {
  accepted: 0,
  en_route_to_seller: 1,
  arrived_at_seller: 2,
  picked_up: 3,
  en_route_to_customer: 4,
  arrived_at_customer: 5,
  delivered: 6,
  cancelled: -1,
};

export function normalizeCourierAssignmentStatus(status) {
  const value = String(status || 'accepted').trim();
  return Object.prototype.hasOwnProperty.call(STATUS_STEP_INDEX, value)
    ? value
    : 'accepted';
}

export function getCourierAssignmentStatusLabel(status) {
  const normalized = normalizeCourierAssignmentStatus(status);
  return (
    COURIER_ASSIGNMENT_STATUS_LABELS[normalized] ||
    COURIER_ASSIGNMENT_STATUS_LABELS.accepted
  );
}

export function getCourierAssignmentStatusTone(status) {
  const normalized = normalizeCourierAssignmentStatus(status);
  if (normalized === 'delivered') return 'delivered';
  if (normalized === 'cancelled') return 'cancelled';
  if (
    normalized === 'picked_up' ||
    normalized === 'en_route_to_customer' ||
    normalized === 'arrived_at_customer'
  ) {
    return 'customer';
  }
  return 'seller';
}

export function getCourierAssignmentProgress(status) {
  const normalized = normalizeCourierAssignmentStatus(status);
  const currentIndex = STATUS_STEP_INDEX[normalized];
  return {
    status: normalized,
    currentIndex,
    steps: COURIER_ASSIGNMENT_PROGRESS_STEPS.map((step, index) => ({
      ...step,
      done: currentIndex >= 0 && index <= currentIndex,
      current: currentIndex >= 0 && index === currentIndex,
    })),
  };
}
