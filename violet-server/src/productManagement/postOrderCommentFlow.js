const POST_ORDER_REVIEW_SOURCES = {
  CHECKOUT: "checkout",
  DELIVERY_ADMIN: "delivery-admin",
};

function mapCartItemToReviewSnapshot(item) {
  const row = item?.toObject ? item.toObject() : item;
  if (!row) return null;
  return {
    cartItemId: row._id != null ? String(row._id) : undefined,
    id: row.productId,
    productId: row.productId,
    title: row.title,
    price: row.price,
    originalPrice: row.originalPrice,
    image: row.image,
    quantity: row.quantity,
    color: row.color || "",
    size: row.size || "",
    storage: row.storage || "",
    model: row.model || "",
  };
}

function buildReviewCartSnapshot(cartItems) {
  return (Array.isArray(cartItems) ? cartItems : [])
    .map(mapCartItemToReviewSnapshot)
    .filter(Boolean);
}

/**
 * Buyurtmadan keyin mijozga izoh yozish oqimini ishga tushirish uchun server javobi.
 * Hozir checkout dan qaytadi; keyin yetkazib berish adminkasi ham shu formatdan foydalanadi.
 */
function buildPostOrderReviewPayload(cartItems, source = POST_ORDER_REVIEW_SOURCES.CHECKOUT) {
  const cartSnapshot = buildReviewCartSnapshot(cartItems);
  return {
    shouldShowReview: cartSnapshot.length > 0,
    source,
    cartSnapshot,
  };
}

function shouldTriggerPostOrderReview({ source } = {}) {
  return (
    source === POST_ORDER_REVIEW_SOURCES.CHECKOUT
    || source === POST_ORDER_REVIEW_SOURCES.DELIVERY_ADMIN
  );
}

module.exports = {
  POST_ORDER_REVIEW_SOURCES,
  buildReviewCartSnapshot,
  buildPostOrderReviewPayload,
  shouldTriggerPostOrderReview,
};
