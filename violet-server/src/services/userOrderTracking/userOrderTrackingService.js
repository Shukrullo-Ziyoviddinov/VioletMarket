const { Order } = require("../../models/order");
const { SellerAccount } = require("../../models/sellerAccount");
const { CargoShipment } = require("../../models/cargoShipment");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const {
  UZB_SELLER_COUNTRY,
  buildUzbOrderTrackingSteps,
  normalizeOrderTrackingStatus,
  TERMINAL_TRACKING_STATUSES,
  resolveSellerPipelineMode,
} = require("../../productManagement/orderTracking");
const {
  buildForeignCustomerOrderTrackingSteps,
  resolveForeignCustomerTrackingStatus,
} = require("../../productManagement/foreignCustomerOrderTracking");
const {
  toCargoFeePaymentView,
} = require("../../productManagement/foreignCargoFeePayment");
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

function shipmentKey(orderId, itemIndex, sellerId) {
  return `${Number(orderId) || 0}:${Number(itemIndex) || 0}:${cleanSellerId(sellerId)}`;
}

function isDeliveredOrderItem(order, item) {
  return (
    String(order?.status || "") === "delivered" ||
    String(item?.trackingStatus || "") === "delivered"
  );
}

function isTerminalOrderItem(item) {
  const status = normalizeOrderTrackingStatus(item?.trackingStatus);
  return TERMINAL_TRACKING_STATUSES.includes(status);
}

function mapOrderItemBase(order, item, itemIndex, seller) {
  const orderedAt = order.paidAt || order.createdAt || null;
  const pipelineMode = resolveSellerPipelineMode(seller.sellerCountry);

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
    pipelineMode,
    paymentMethod: String(order.paymentMethod || ""),
    orderedAt,
  };
}

function mapUzbOrderItem(order, item, itemIndex, seller) {
  const base = mapOrderItemBase(order, item, itemIndex, seller);
  const trackingStatus =
    String(order.status || "") === "delivered"
      ? "delivered"
      : normalizeOrderTrackingStatus(item.trackingStatus);
  const trackedItem = { ...item, trackingStatus };

  return {
    ...base,
    trackingStatus,
    steps: buildUzbOrderTrackingSteps(trackedItem, base.orderedAt),
  };
}

function mapForeignOrderItem(order, item, itemIndex, seller, shipment) {
  const base = mapOrderItemBase(order, item, itemIndex, seller);
  const trackingStatus = resolveForeignCustomerTrackingStatus(item, shipment);
  const cargoFeePayment = shipment ? toCargoFeePaymentView(shipment) : null;

  return {
    ...base,
    trackingStatus,
    steps: buildForeignCustomerOrderTrackingSteps(item, base.orderedAt, shipment),
    cargoShipmentId: shipment?._id ? String(shipment._id) : null,
    cargoFeePayment,
  };
}

async function loadShipmentsByKeys(pairs) {
  if (!pairs.length) return new Map();

  const orderIds = [...new Set(pairs.map((row) => row.orderId))];
  const rows = await CargoShipment.find({
    orderId: { $in: orderIds },
    status: { $nin: ["cancelled"] },
  })
    .select({
      orderId: 1,
      itemIndex: 1,
      sellerId: 1,
      processStep: 1,
      uzArrivedAt: 1,
      weightKg: 1,
      cargoDeliveryFee: 1,
      uzArrivalPhotoUrl: 1,
      uzArrivalComment: 1,
      customerCargoFeePaidAt: 1,
      customerCargoFeePaymentMethod: 1,
      adminCargoFeeConfirmedAt: 1,
      cargoFeePaymentRequired: 1,
      paidAt: 1,
      status: 1,
      submittedAt: 1,
      acceptedAt: 1,
      updatedAt: 1,
    })
    .lean();

  const map = new Map();
  for (const row of rows) {
    map.set(
      shipmentKey(row.orderId, row.itemIndex, row.sellerId),
      row,
    );
  }
  return map;
}

/**
 * Faqat UZB sillerlar — eski endpoint.
 */
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
      if (isTerminalOrderItem(item)) return;
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

/**
 * Barcha sillerlar — local + foreign pipeline.
 */
async function listMyOrderTracking(userId) {
  const orders = await Order.find({ userId })
    .sort({ createdAt: -1, id: -1 })
    .lean();

  const sellerIds = [
    ...new Set(
      orders.flatMap((order) =>
        (Array.isArray(order.items) ? order.items : [])
          .map((item) => cleanSellerId(item.sellerId))
          .filter(Boolean),
      ),
    ),
  ];

  if (!sellerIds.length) {
    return { items: [], inProgressItems: [], deliveredItems: [] };
  }

  const sellers = await SellerAccount.find({ id: { $in: sellerIds } })
    .select({ id: 1, name: 1, sellerCountry: 1 })
    .lean();
  const sellerById = new Map(sellers.map((seller) => [cleanSellerId(seller.id), seller]));

  await archiveDeliveredOrderItems(userId, orders, sellerById);

  const foreignPairs = [];
  for (const order of orders) {
    (Array.isArray(order.items) ? order.items : []).forEach((item, itemIndex) => {
      const seller = sellerById.get(cleanSellerId(item.sellerId));
      if (!seller) return;
      if (resolveSellerPipelineMode(seller.sellerCountry) !== "foreign") return;
      if (isDeliveredOrderItem(order, item) || isTerminalOrderItem(item)) return;
      foreignPairs.push({
        orderId: Number(order.id) || 0,
        itemIndex,
        sellerId: cleanSellerId(seller.id),
      });
    });
  }

  const shipmentByKey = await loadShipmentsByKeys(foreignPairs);

  const inProgressItems = [];
  for (const order of orders) {
    (Array.isArray(order.items) ? order.items : []).forEach((item, itemIndex) => {
      const seller = sellerById.get(cleanSellerId(item.sellerId));
      if (!seller) return;
      if (isDeliveredOrderItem(order, item)) return;
      if (isTerminalOrderItem(item)) return;

      const pipelineMode = resolveSellerPipelineMode(seller.sellerCountry);
      if (pipelineMode === "foreign") {
        const shipment = shipmentByKey.get(
          shipmentKey(order.id, itemIndex, seller.id),
        ) || null;
        inProgressItems.push(
          mapForeignOrderItem(order, item, itemIndex, seller, shipment),
        );
        return;
      }

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
  listMyOrderTracking,
};
