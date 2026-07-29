const { UserDeliveredOrder } = require("../../models/userDeliveredOrder");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");

function cleanSellerId(value) {
  return String(value || "").trim();
}

function buildTrackingCode(orderId, itemIndex, sellerCountry = "uzb") {
  const country = String(sellerCountry || "uzb")
    .trim()
    .toUpperCase()
    .slice(0, 3) || "UZB";
  return `${country}-${String(Number(orderId) || 0).padStart(6, "0")}-${String(
    itemIndex + 1,
  ).padStart(2, "0")}`;
}

function resolveDeliveredAt(order, item) {
  const history = Array.isArray(item?.trackingHistory) ? item.trackingHistory : [];
  const deliveredEntry = history.find(
    (entry) => String(entry?.status || "") === "delivered",
  );
  return deliveredEntry?.at || order?.updatedAt || order?.paidAt || order?.createdAt || new Date();
}

function isDelivered(order, item) {
  return (
    String(item?.trackingStatus || "") === "delivered" ||
    String(order?.status || "") === "delivered"
  );
}

async function archiveDeliveredOrderItems(userId, orders, sellerById) {
  const writes = [];

  for (const order of Array.isArray(orders) ? orders : []) {
    (Array.isArray(order.items) ? order.items : []).forEach((item, itemIndex) => {
      if (!isDelivered(order, item)) return;

      const sellerId = cleanSellerId(item.sellerId);
      const seller = sellerById.get(sellerId);
      if (!seller) return;

      const sellerCountry = String(seller.sellerCountry || "uzb")
        .trim()
        .toLowerCase() || "uzb";
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const price = Number(item.price) || 0;
      writes.push({
        updateOne: {
          filter: {
            userId,
            sourceOrderId: Number(order.id) || 0,
            sourceItemIndex: itemIndex,
          },
          update: {
            $setOnInsert: {
              userId,
              sourceOrderId: Number(order.id) || 0,
              sourceItemIndex: itemIndex,
              trackingCode: buildTrackingCode(order.id, itemIndex, sellerCountry),
              productId: Number(item.productId) || 0,
              sellerId,
              sellerCountry,
              title: item.title || "",
              imageUrl: resolvePublicAssetUrl(item.image || "/img/no-image.png"),
              price,
              quantity,
              lineTotal: Number(item.lineTotal) || price * quantity,
              color: String(item.color || "").trim(),
              size: String(item.size || "").trim(),
              storage: String(item.storage || "").trim(),
              model: String(item.model || "").trim(),
              deliveredAt: resolveDeliveredAt(order, item),
            },
          },
          upsert: true,
        },
      });
    });
  }

  if (writes.length) {
    await UserDeliveredOrder.bulkWrite(writes, { ordered: false });
  }
}

async function listDeliveredOrderItems(userId) {
  const rows = await UserDeliveredOrder.find({ userId })
    .sort({ deliveredAt: -1, createdAt: -1 })
    .lean();

  return rows.map((row) => ({
    id: String(row._id),
    orderId: Number(row.sourceOrderId) || 0,
    orderCode: `#${String(Number(row.sourceOrderId) || 0).padStart(4, "0")}`,
    trackingCode: String(row.trackingCode || ""),
    productId: Number(row.productId) || 0,
    title: row.title || { uz: "", ru: "" },
    imageUrl: String(row.imageUrl || ""),
    price: Number(row.price) || 0,
    quantity: Math.max(1, Number(row.quantity) || 1),
    lineTotal: Number(row.lineTotal) || 0,
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
    deliveredAt: row.deliveredAt || null,
  }));
}

module.exports = {
  buildTrackingCode,
  archiveDeliveredOrderItems,
  listDeliveredOrderItems,
};
