/**
 * Buyurtmadan keyin izoh modalini (.test-order-modal-content) ko'rsatish oqimi.
 * Checkout da ochilmaydi. Kuryer Topshirdim → server pendingReview yaratadi →
 * client poll qilib modalni ochadi.
 */

import { fetchPendingReviews } from '../api/pendingReviewsApi';

export const POST_ORDER_REVIEW_PENDING_KEY = 'pendingTestOrderModal';
export const SHOWN_PENDING_REVIEW_MODAL_IDS_KEY = 'shownPendingReviewModalIds';

export const POST_ORDER_REVIEW_SOURCES = {
  CHECKOUT: 'checkout',
  DELIVERY_ADMIN: 'delivery-admin',
};

export function persistPendingPostOrderReview({ cartSnapshot }) {
  try {
    sessionStorage.setItem(
      POST_ORDER_REVIEW_PENDING_KEY,
      JSON.stringify({ cartSnapshot }),
    );
  } catch (storageError) {
    console.error('Pending post-order review state saqlanmadi:', storageError);
  }
}

export function clearPendingPostOrderReviewStorage() {
  try {
    sessionStorage.removeItem(POST_ORDER_REVIEW_PENDING_KEY);
  } catch (storageError) {
    console.error('Pending post-order review state o\'chirilmadi:', storageError);
  }
}

export function readPendingPostOrderReviewFromStorage() {
  try {
    const raw = sessionStorage.getItem(POST_ORDER_REVIEW_PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (storageError) {
    console.error('Pending post-order review state o\'qilmadi:', storageError);
    sessionStorage.removeItem(POST_ORDER_REVIEW_PENDING_KEY);
    return null;
  }
}

/**
 * Checkout yoki keyinchalik yetkazib berish adminkasidan chaqiriladi.
 */
export function startPostOrderReviewFlow({
  cartSnapshot,
  source = POST_ORDER_REVIEW_SOURCES.CHECKOUT,
  scheduleOpenOnHome,
  navigate,
}) {
  if (!Array.isArray(cartSnapshot) || cartSnapshot.length === 0) return;

  scheduleOpenOnHome({ cartSnapshot, source });
  persistPendingPostOrderReview({ cartSnapshot });
  navigate('/', { replace: true });
}

/**
 * Bosh sahifada kutayotgan izoh modalini ochish (App.jsx dan chaqiriladi).
 */
export function consumePendingPostOrderReviewOnHome({
  pathname,
  pendingOpenOnHome,
  openModal,
  clearPendingOpenOnHome,
}) {
  if (pathname !== '/') return;

  if (pendingOpenOnHome) {
    openModal({
      cartSnapshot: pendingOpenOnHome.cartSnapshot,
      onCloseExtra: pendingOpenOnHome.onCloseExtra,
    });
    clearPendingOpenOnHome();
    clearPendingPostOrderReviewStorage();
    return;
  }

  const parsed = readPendingPostOrderReviewFromStorage();
  if (!parsed) return;

  openModal({
    cartSnapshot: parsed?.cartSnapshot || null,
    onCloseExtra: null,
  });
  clearPendingPostOrderReviewStorage();
}

function readShownPendingReviewModalIds() {
  try {
    const raw = sessionStorage.getItem(SHOWN_PENDING_REVIEW_MODAL_IDS_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch {
    return new Set();
  }
}

function markPendingReviewModalIdsShown(ids) {
  try {
    const next = readShownPendingReviewModalIds();
    for (const id of ids) {
      if (id != null) next.add(String(id));
    }
    sessionStorage.setItem(
      SHOWN_PENDING_REVIEW_MODAL_IDS_KEY,
      JSON.stringify([...next]),
    );
  } catch (err) {
    console.error('shownPendingReviewModalIds saqlanmadi:', err);
  }
}

/** API pendingReviews → TestOrderModal cartSnapshot */
export function mapPendingReviewsToCartSnapshot(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const productId = Number(item?.productId);
      if (!Number.isFinite(productId)) return null;
      return {
        id: productId,
        productId,
        title: item.productTitle || { uz: 'Mahsulot', ru: 'Mahsulot' },
        image: item.productImage || '/img/no-image.png',
        price: item.price ?? '',
        pendingReviewId: item.id != null ? String(item.id) : null,
      };
    })
    .filter(Boolean);
}

/**
 * Topshirdimdan keyin serverda paydo bo‘lgan pending reviewlarni
 * .test-order-modal-content orqali ochish.
 */
export async function maybeOpenPendingReviewModalFromDelivery({
  token,
  isModalOpen,
  openModal,
}) {
  if (!token || isModalOpen || typeof openModal !== 'function') return false;

  let data;
  try {
    data = await fetchPendingReviews(token);
  } catch (err) {
    console.error('Pending reviews o‘qilmadi:', err);
    return false;
  }

  const items = Array.isArray(data?.items) ? data.items : [];
  if (!items.length) return false;

  const shown = readShownPendingReviewModalIds();
  const fresh = items.filter((row) => row?.id != null && !shown.has(String(row.id)));
  if (!fresh.length) return false;

  const cartSnapshot = mapPendingReviewsToCartSnapshot(items);
  if (!cartSnapshot.length) return false;

  markPendingReviewModalIdsShown(fresh.map((row) => row.id));
  openModal({ cartSnapshot, onCloseExtra: null });
  window.dispatchEvent(new Event('pendingReviewsUpdated'));
  return true;
}
