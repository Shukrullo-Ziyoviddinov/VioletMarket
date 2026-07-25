/**
 * Kuryer assignment status — asosiy admin UI.
 * Server: violet-server/src/utils/courierAssignmentStatus.js bilan mos.
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
  return_request_pending: 'Qaytarish so‘rovi',
  return_approved: 'Qaytarish tasdiqlandi',
  return_to_seller: 'Sotuvchiga qaytarish',
  en_route_return_to_seller: 'Sotuvchiga qaytarish yo‘lda',
  arrived_return_at_seller: 'Sotuvchiga qaytarish',
  returned: 'Qaytarildi',
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

const RETURN_FLOW_STATUSES = new Set([
  'return_request_pending',
  'return_approved',
  'return_to_seller',
  'en_route_return_to_seller',
  'arrived_return_at_seller',
  'returned',
  'cancelled',
]);

const COMPLETE_STATUSES = new Set(['delivered', 'returned', 'cancelled']);

const STATUS_STEP_INDEX = {
  accepted: 0,
  en_route_to_seller: 1,
  arrived_at_seller: 2,
  picked_up: 3,
  en_route_to_customer: 4,
  arrived_at_customer: 5,
  delivered: 6,
  return_request_pending: 5,
  return_approved: 5,
  return_to_seller: 6,
  en_route_return_to_seller: 6,
  arrived_return_at_seller: 6,
  returned: 6,
  cancelled: 6,
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
  if (RETURN_FLOW_STATUSES.has(normalized)) return 'returned';
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
  const isComplete = COMPLETE_STATUSES.has(normalized);
  const isReturnedFlow = RETURN_FLOW_STATUSES.has(normalized);
  const lastLabel = isReturnedFlow ? 'Qaytarilgan' : 'Topshirdi';

  return {
    status: normalized,
    currentIndex,
    variant: isReturnedFlow ? 'returned' : 'delivery',
    steps: COURIER_ASSIGNMENT_PROGRESS_STEPS.map((step, index) => ({
      ...step,
      label:
        index === COURIER_ASSIGNMENT_PROGRESS_STEPS.length - 1
          ? lastLabel
          : step.label,
      done: currentIndex >= 0 && index <= currentIndex,
      current: !isComplete && currentIndex >= 0 && index === currentIndex,
    })),
  };
}
