const { Order } = require("../../models/order");
const { SellerAccount } = require("../../models/sellerAccount");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const {
  UZB_SELLER_COUNTRY,
  buildUzbOrderTrackingSteps,
  normalizeOrderTrackingStatus,
} = require("../../productManagement/orderTracking");
const {
  archiveDeliveredOrderItems,
  listDeliveredOrderItems,
} = require("./deliveredOrderArchiveService");

function cleanSellerId(value) {
  return String(value || "").trim();
}

function resolveTitle(title) {
  if (title && typeof title === "object") {
    return {
      uz: String(title.uz || "").trim(),
      ru: String(title.ru || "").trim(),
    };
  }
  const text = String(title || "").trim();
  return { uz: text, ru: text };
}

function buildOrderCode(orderId) {
  return `#${String(Number(orderId) || 0).padStart(4, "0")}`;
}

function mapUzbOrderItem(order, item, itemIndex, seller) {
  const orderedAt = order.paidAt || order.createdAt || null;
  const trackingStatus =
    String(order.status || "") === "delivered"
      ? "delivered"
      : normalizeOrderTrackingStatus(item.trackingStatus);
  const trackedItem = { ...item, trackingStatus };

  return {
    id: `${Number(order.id) || 0}-${itemIndex}`,
    orderId: Number(order.id) || 0,
    orderCode: buildOrderCode(order.id),
    productId: Number(item.productId) || 0,
    title: resolveTitle(item.title),
    imageUrl: resolvePublicAssetUrl(item.image || "/img/no-image.png"),
    price: Number(item.price) || 0,
    originalPrice: Number(item.originalPrice) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
    lineTotal:
      Number(item.lineTotal) ||
      (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
    color: String(item.color || "").trim(),
    size: String(item.size || "").trim(),
    storage: String(item.storage || "").trim(),
    model: String(item.model || "").trim(),
    seller: {
      id: cleanSellerId(seller.id),
      name: seller.name || { uz: "", ru: "" },
      country: String(seller.sellerCountry || "").trim().toLowerCase(),
    },
    paymentMethod: String(order.paymentMethod || ""),
    orderedAt,
    trackingStatus,
    steps: buildUzbOrderTrackingSteps(trackedItem, orderedAt),
  };
}

function isDeliveredOrderItem(order, item) {
  return (
    String(order?.status || "") === "delivered" ||
    String(item?.trackingStatus || "") === "delivered"
  );
}

async function listMyUzbOrderTracking(userId) {
  const sellers = await SellerAccount.find({ sellerCountry: UZB_SELLER_COUNTRY })
    .select({ id: 1, name: 1, sellerCountry: 1 })
    .lean();
  const sellerIds = sellers.map((seller) => cleanSellerId(seller.id)).filter(Boolean);

  if (!sellerIds.length) {
    return { items: [], inProgressItems: [], deliveredItems: [] };
  }

  const orders = await Order.find({
    userId,
    "items.sellerId": { $in: sellerIds },
  })
    .sort({ createdAt: -1, id: -1 })
    .lean();
  const sellerById = new Map(sellers.map((seller) => [cleanSellerId(seller.id), seller]));

  await archiveDeliveredOrderItems(userId, orders, sellerById);

  const inProgressItems = [];
  for (const order of orders) {
    (Array.isArray(order.items) ? order.items : []).forEach((item, itemIndex) => {
      const seller = sellerById.get(cleanSellerId(item.sellerId));
      if (!seller || String(seller.sellerCountry || "").toLowerCase() !== UZB_SELLER_COUNTRY) {
        return;
      }
      if (isDeliveredOrderItem(order, item)) return;
      inProgressItems.push(mapUzbOrderItem(order, item, itemIndex, seller));
    });
  }

  const deliveredItems = await listDeliveredOrderItems(userId);

  return {
    items: inProgressItems,
    inProgressItems,
    deliveredItems,
  };
}

module.exports = {
  listMyUzbOrderTracking,
};
