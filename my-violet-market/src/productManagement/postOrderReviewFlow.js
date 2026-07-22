/**
 * Buyurtmadan keyin izoh modalini (.test-order-modal-content) ko'rsatish oqimi.
 * Hozir checkout pay tugmasidan chaqirilmaydi; Topshirdim dan keyin
 * pendingReviews orqali profilga tushadi. Bu fayl eski oqim / kelajak UI uchun.
 */

export const POST_ORDER_REVIEW_PENDING_KEY = 'pendingTestOrderModal';

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
