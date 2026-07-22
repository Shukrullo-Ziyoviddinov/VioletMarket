import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

export type DeliveryAssignmentStatus =
  | 'accepted'
  | 'en_route_to_seller'
  | 'arrived_at_seller'
  | 'picked_up'
  | 'en_route_to_customer'
  | 'arrived_at_customer'
  | 'delivered'
  | 'cancelled'
  | 'return_request_pending'
  | 'return_approved'
  | 'return_to_seller'
  | 'en_route_return_to_seller'
  | 'arrived_return_at_seller'
  | 'returned';

export type DeliveryAdvanceAction =
  | 'go_to_seller'
  | 'arrive_seller'
  | 'go_to_customer'
  | 'arrive_customer'
  | 'go_return_to_seller'
  | 'arrive_return_seller';

export type DeliveryPrimaryActionKind =
  | DeliveryAdvanceAction
  | 'pick_up'
  | 'deliver'
  | 'request_return'
  | 'confirm_return_reason'
  | 'complete_return'
  | 'waiting_admin'
  | 'none';

const SELLER_STATUSES = new Set<string>([
  'accepted',
  'en_route_to_seller',
  'arrived_at_seller',
]);

const CUSTOMER_STATUSES = new Set<string>([
  'picked_up',
  'en_route_to_customer',
  'arrived_at_customer',
  'return_request_pending',
  'return_approved',
]);

const RETURN_STATUSES = new Set<string>([
  'return_to_seller',
  'en_route_return_to_seller',
  'arrived_return_at_seller',
]);

export function getAssignmentStatus(
  order: Pick<DeliveryAcceptedOrder, 'status'> | string | null | undefined,
): string {
  if (typeof order === 'string') return order;
  return String(order?.status || 'accepted');
}

export function isReturnPhase(
  order: Pick<DeliveryAcceptedOrder, 'status' | 'pickupPhase'> | null | undefined,
) {
  if (!order) return false;
  if (order.pickupPhase === 'return') return true;
  return RETURN_STATUSES.has(getAssignmentStatus(order));
}

export function isSellerPhase(
  order: Pick<DeliveryAcceptedOrder, 'status' | 'pickupPhase'> | null | undefined,
) {
  if (!order) return true;
  if (isReturnPhase(order)) return false;
  if (order.pickupPhase === 'customer') return false;
  if (order.pickupPhase === 'seller') return true;
  const status = getAssignmentStatus(order);
  if (CUSTOMER_STATUSES.has(status) || status === 'delivered') return false;
  return SELLER_STATUSES.has(status) || status === 'accepted';
}

/** Ajdaniya so‘rov yuborish (admin kutishdan oldin) */
export function canShowReturnActions(
  order: Pick<DeliveryAcceptedOrder, 'status'> | null | undefined,
) {
  const status = getAssignmentStatus(order);
  return (
    status === 'picked_up' ||
    status === 'en_route_to_customer' ||
    status === 'arrived_at_customer'
  );
}

export function getStepBadgeLabel(
  order: Pick<DeliveryAcceptedOrder, 'status' | 'pickupPhase'> | null | undefined,
) {
  const status = getAssignmentStatus(order);
  switch (status) {
    case 'accepted':
      return 'Sotuvchiga borish';
    case 'en_route_to_seller':
      return 'Sotuvchiga yo‘lda';
    case 'arrived_at_seller':
      return 'Mahsulot olish';
    case 'picked_up':
      return 'Mijozga borish';
    case 'en_route_to_customer':
      return 'Mijozga yo‘lda';
    case 'arrived_at_customer':
      return 'Topshirish';
    case 'return_request_pending':
      return 'Admin javobi';
    case 'return_approved':
      return 'Qaytarish tasdiqlandi';
    case 'return_to_seller':
      return 'Sotuvchiga qaytarish';
    case 'en_route_return_to_seller':
      return 'Sotuvchiga yo‘lda';
    case 'arrived_return_at_seller':
      return 'Qaytarish';
    case 'returned':
      return 'Qaytarildi';
    default:
      if (isReturnPhase(order)) return 'Sotuvchiga qaytarish';
      return isSellerPhase(order) ? 'Sotuvchidan olish' : 'Mijozga yetkazish';
  }
}

export function getPrimaryAction(
  order: Pick<DeliveryAcceptedOrder, 'status' | 'approvedReturnReasonType'> | null | undefined,
): {
  kind: DeliveryPrimaryActionKind;
  label: string;
  confirmTitle?: string;
  confirmMessage?: string;
} {
  const status = getAssignmentStatus(order);
  switch (status) {
    case 'accepted':
      return { kind: 'go_to_seller', label: 'Sotuvchiga borish' };
    case 'en_route_to_seller':
      return { kind: 'arrive_seller', label: 'Sotuvchiga keldim' };
    case 'arrived_at_seller':
      return {
        kind: 'pick_up',
        label: 'Mahsulotni oldim',
        confirmTitle: 'Mahsulotni olish',
        confirmMessage: 'Chindan ham mahsulot olinganligini tasdiqlaysizmi?',
      };
    case 'picked_up':
      return { kind: 'go_to_customer', label: 'Mijozga borish' };
    case 'en_route_to_customer':
      return { kind: 'arrive_customer', label: 'Mijozga keldim' };
    case 'arrived_at_customer':
      return {
        kind: 'deliver',
        label: 'Topshirdim',
        confirmTitle: 'Mijozga topshirish',
        confirmMessage:
          'Chindan ham mahsulotni mijozga topshirganingizni tasdiqlaysizmi?',
      };
    case 'return_request_pending':
      return { kind: 'waiting_admin', label: 'Admin javobini kutmoqda' };
    case 'return_approved':
      return { kind: 'confirm_return_reason', label: 'Qaytarishni tasdiqlash' };
    case 'return_to_seller':
      return { kind: 'go_return_to_seller', label: 'Sotuvchiga borish' };
    case 'en_route_return_to_seller':
      return { kind: 'arrive_return_seller', label: 'Sotuvchiga keldim' };
    case 'arrived_return_at_seller':
      return {
        kind: 'complete_return',
        label: 'Qaytardim',
        confirmTitle: 'Sotuvchiga qaytarish',
        confirmMessage: 'Mahsulotni sotuvchiga qaytarganingizni tasdiqlaysizmi?',
      };
    default:
      return { kind: 'none', label: '' };
  }
}

/** Sotuvchi tomoni 3 nuqta + mijoz tomoni 3 nuqta (0..3 completed each). */
export function getStepProgress(
  order: Pick<DeliveryAcceptedOrder, 'status'> | null | undefined,
) {
  const status = getAssignmentStatus(order);
  switch (status) {
    case 'accepted':
      return { sellerDone: 0, customerDone: 0 };
    case 'en_route_to_seller':
      return { sellerDone: 1, customerDone: 0 };
    case 'arrived_at_seller':
      return { sellerDone: 2, customerDone: 0 };
    case 'picked_up':
      return { sellerDone: 3, customerDone: 0 };
    case 'en_route_to_customer':
      return { sellerDone: 3, customerDone: 1 };
    case 'arrived_at_customer':
    case 'return_request_pending':
    case 'return_approved':
      return { sellerDone: 3, customerDone: 2 };
    case 'delivered':
      return { sellerDone: 3, customerDone: 3 };
    case 'return_to_seller':
      return { sellerDone: 1, customerDone: 0 };
    case 'en_route_return_to_seller':
      return { sellerDone: 2, customerDone: 0 };
    case 'arrived_return_at_seller':
    case 'returned':
      return { sellerDone: 3, customerDone: 0 };
    default:
      return { sellerDone: 0, customerDone: 0 };
  }
}

export function shouldOpenRouteOnAdvance(kind: DeliveryPrimaryActionKind) {
  return (
    kind === 'go_to_seller' ||
    kind === 'go_to_customer' ||
    kind === 'go_return_to_seller'
  );
}
