const { Order } = require("../../models/order");
const { SellerAccount } = require("../../models/sellerAccount");
const { CargoShipment } = require("../../models/cargoShipment");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
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
const {
  COURIER_IN_PROGRESS_STATUSES,
} = require("../../unitLifecycle/assignmentPoolRules");
const {
  buildCustomerTrackingGroupKey,
  resolveTrackingCargoServiceType,
} = require("../../utils/cargoServiceType");

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

function fulfillmentGroupKey(orderId, sellerId) {
  return `${Number(orderId) || 0}:${cleanSellerId(sellerId)}`;
}

function mapOrderItemBase(order, item, itemIndex, seller) {
  const orderedAt = order.paidAt || order.createdAt || null;
  const pipelineMode = resolveSellerPipelineMode(seller.sellerCountry);
  const sellerId = cleanSellerId(seller.id);
  const orderId = Number(order.id) || 0;
  const cargoServiceType = resolveTrackingCargoServiceType(
    pipelineMode,
    item.cargoServiceType,
  );
  const groupKey =
    buildCustomerTrackingGroupKey(
      orderId,
      sellerId,
      pipelineMode,
      cargoServiceType,
    ) || fulfillmentGroupKey(orderId, sellerId);

  return {
    id: `${orderId}-${itemIndex}`,
    orderId,
    itemIndex,
    orderCode: buildOrderCode(order.id),
    groupKey,
    cargoServiceType,
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
      id: sellerId,
      name: seller.name || { uz: "", ru: "" },
      country: String(seller.sellerCountry || "").trim().toLowerCase(),
    },
    pipelineMode,
    paymentMethod: String(order.paymentMethod || ""),
    orderedAt,
  };
}

/** Timeline uchun eng sekin mahsulot (kamroq completed/current). */
function pickSlowestTrackingItem(items) {
  if (!items.length) return null;
  let best = items[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const item of items) {
    const steps = Array.isArray(item.steps) ? item.steps : [];
    const score = steps.reduce((sum, step) => {
      const state = String(step?.state || "");
      if (state === "completed") return sum + 2;
      if (state === "current") return sum + 1;
      return sum;
    }, 0);
    if (score < bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

/** Timeline uchun eng oldinga o‘tgan mahsulot. */
function pickFurthestTrackingItem(items) {
  if (!items.length) return null;
  let best = items[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const item of items) {
    const steps = Array.isArray(item.steps) ? item.steps : [];
    const score = steps.reduce((sum, step) => {
      const state = String(step?.state || "");
      if (state === "completed") return sum + 2;
      if (state === "current") return sum + 1;
      return sum;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

const LAST_MILE_TRACKING_STATUSES = new Set([
  "handed_to_courier",
  "delivered",
]);

/**
 * Cargo/logistica bosqichida — eng sekin (hammasi yetib kelgunicha).
 * Kuryer/delivered boshlangach — eng oldinga o‘tganini ko‘rsatamiz,
 * aks holda bitta sibling «Toshkent omborida»da qolsa, «Mahsulot kuryerda» yashirinadi.
 */
function pickTimelineSourceItem(items) {
  if (!items.length) return null;
  const hasLastMile = items.some((item) =>
    LAST_MILE_TRACKING_STATUSES.has(String(item?.trackingStatus || "")),
  );
  return hasLastMile
    ? pickFurthestTrackingItem(items)
    : pickSlowestTrackingItem(items);
}

/**
 * Mijoz tracking: orderId+sellerId+cargoServiceType → alohida kartochka (Standard/Express).
 * Cargo to‘lov: faqat fee-bearer shipment (paymentRequired) — bitta summa.
 * Har mahsulot: o‘z kg / (agar bo‘lsa) comment+photo — chalkashtirilmaydi.
 */
function groupInProgressTrackingItems(flatItems) {
  const buckets = new Map();
  for (const item of flatItems) {
    if (!item) continue;
    const key =
      String(item.groupKey || "").trim() ||
      fulfillmentGroupKey(item.orderId, item.seller?.id);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }

  const grouped = [];
  for (const items of buckets.values()) {
    const sorted = [...items].sort(
      (a, b) => (Number(a.itemIndex) || 0) - (Number(b.itemIndex) || 0),
    );
    const first = sorted[0];
    const timelineSource = pickTimelineSourceItem(sorted) || first;

    const feeBearer =
      sorted.find((row) => Boolean(row.cargoFeePayment?.paymentRequired)) ||
      sorted.find((row) => Boolean(row.cargoFeePayment?.ready)) ||
      null;

    const products = sorted.map((row) => {
      const fee = row.cargoFeePayment || null;
      return {
        id: row.id,
        itemIndex: Number(row.itemIndex) || 0,
        productId: row.productId,
        title: row.title,
        imageUrl: row.imageUrl,
        price: row.price,
        originalPrice: row.originalPrice,
        quantity: row.quantity,
        lineTotal: row.lineTotal,
        color: row.color,
        size: row.size,
        storage: row.storage,
        model: row.model,
        trackingStatus: row.trackingStatus,
        cargoShipmentId: row.cargoShipmentId || null,
        // Alohida kg — shu mahsulot shipmentidan
        weightKg: Math.max(0, Number(fee?.weightKg) || 0),
        // Comment/photo faqat shu shipmentda yozilgan bo‘lsa (bearer odatda)
        uzArrivalComment: String(fee?.uzArrivalComment || "").trim(),
        uzArrivalPhotoUrl: String(fee?.uzArrivalPhotoUrl || "").trim(),
      };
    });

    const quantity = products.reduce(
      (sum, row) => sum + Math.max(1, Number(row.quantity) || 1),
      0,
    );
    const lineTotal = products.reduce(
      (sum, row) => sum + (Number(row.lineTotal) || 0),
      0,
    );
    const totalWeightKg = Number(
      products
        .reduce((sum, row) => sum + Math.max(0, Number(row.weightKg) || 0), 0)
        .toFixed(3),
    );

    let cargoFeePayment = feeBearer?.cargoFeePayment || null;
    if (cargoFeePayment) {
      cargoFeePayment = {
        ...cargoFeePayment,
        // Guruh umumiy kg (to‘lov bloki); har mahsulot o‘z kg sini products[] da saqlaydi
        weightKg:
          totalWeightKg > 0
            ? totalWeightKg
            : Math.max(0, Number(cargoFeePayment.weightKg) || 0),
      };
    }

    grouped.push({
      id: `g-${first.orderId}-${first.seller.id}-${first.cargoServiceType || "all"}`,
      isGroup: products.length > 1,
      groupKey: first.groupKey,
      cargoServiceType: first.cargoServiceType || null,
      orderId: first.orderId,
      orderCode: first.orderCode,
      seller: first.seller,
      pipelineMode: first.pipelineMode,
      paymentMethod: first.paymentMethod,
      orderedAt: first.orderedAt,
      // UI single-product fallbacklar (birinchi mahsulot)
      productId: first.productId,
      title: first.title,
      imageUrl: first.imageUrl,
      price: first.price,
      originalPrice: first.originalPrice,
      quantity,
      lineTotal,
      color: first.color,
      size: first.size,
      storage: first.storage,
      model: first.model,
      trackingStatus: timelineSource.trackingStatus,
      steps: timelineSource.steps,
      products,
      cargoShipmentId: feeBearer?.cargoShipmentId || null,
      cargoFeePayment,
    });
  }

  grouped.sort((a, b) => {
    const ta = a.orderedAt ? new Date(a.orderedAt).getTime() : 0;
    const tb = b.orderedAt ? new Date(b.orderedAt).getTime() : 0;
    if (tb !== ta) return tb - ta;
    return (Number(b.orderId) || 0) - (Number(a.orderId) || 0);
  });

  return grouped;
}

function mapUzbOrderItem(order, item, itemIndex, seller, courierCtx = null) {
  const base = mapOrderItemBase(order, item, itemIndex, seller);
  const rawStatus =
    String(order.status || "") === "delivered"
      ? "delivered"
      : normalizeOrderTrackingStatus(item.trackingStatus);

  const courierAccepted = Boolean(courierCtx?.accepted);
  const visibleStatus =
    rawStatus === "delivered"
      ? "delivered"
      : courierAccepted
        ? "handed_to_courier"
        : rawStatus === "handed_to_courier"
          ? "collected"
          : rawStatus;

  const trackedItem = { ...item, trackingStatus: rawStatus };

  return {
    ...base,
    trackingStatus: visibleStatus,
    steps: buildUzbOrderTrackingSteps(
      trackedItem,
      base.orderedAt,
      courierCtx,
    ),
  };
}

function mapForeignOrderItem(
  order,
  item,
  itemIndex,
  seller,
  shipment,
  courierCtx = null,
) {
  const base = mapOrderItemBase(order, item, itemIndex, seller);
  const trackingStatus = resolveForeignCustomerTrackingStatus(
    item,
    shipment,
    courierCtx,
  );
  const cargoFeePayment = shipment ? toCargoFeePaymentView(shipment) : null;

  return {
    ...base,
    trackingStatus,
    steps: buildForeignCustomerOrderTrackingSteps(
      item,
      base.orderedAt,
      shipment,
      courierCtx,
    ),
    cargoShipmentId: shipment?._id ? String(shipment._id) : null,
    cargoFeePayment,
  };
}

function assignmentItemKey(orderId, itemIndex) {
  return `${Number(orderId) || 0}:${Number(itemIndex) || 0}`;
}

/**
 * Kuryer «Qabul qilish»dan keyin — active assignment (delivered emas).
 * Bir itemIndex uchun bitta eng eski acceptedAt.
 */
async function loadActiveCourierCtxByItem(orderIds = []) {
  const ids = [
    ...new Set(
      (Array.isArray(orderIds) ? orderIds : [])
        .map((id) => Number(id) || 0)
        .filter((id) => id > 0),
    ),
  ];
  if (!ids.length) return new Map();

  const rows = await CourierOrderAssignment.find({
    orderId: { $in: ids },
    status: { $in: COURIER_IN_PROGRESS_STATUSES },
  })
    .select({ orderId: 1, itemIndex: 1, acceptedAt: 1, status: 1 })
    .lean();

  const map = new Map();
  for (const row of rows) {
    const key = assignmentItemKey(row.orderId, row.itemIndex);
    const acceptedAt = row.acceptedAt || null;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { accepted: true, acceptedAt, status: row.status });
      continue;
    }
    const prevTime = prev.acceptedAt ? new Date(prev.acceptedAt).getTime() : Infinity;
    const nextTime = acceptedAt ? new Date(acceptedAt).getTime() : Infinity;
    if (nextTime < prevTime) {
      map.set(key, { accepted: true, acceptedAt, status: row.status });
    }
  }
  return map;
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

  const courierByItem = await loadActiveCourierCtxByItem(
    orders.map((order) => order.id),
  );

  const inProgressItems = [];
  for (const order of orders) {
    (Array.isArray(order.items) ? order.items : []).forEach((item, itemIndex) => {
      const seller = sellerById.get(cleanSellerId(item.sellerId));
      if (!seller || String(seller.sellerCountry || "").toLowerCase() !== UZB_SELLER_COUNTRY) {
        return;
      }
      if (isDeliveredOrderItem(order, item)) return;
      if (isTerminalOrderItem(item)) return;
      const courierCtx =
        courierByItem.get(assignmentItemKey(order.id, itemIndex)) || null;
      inProgressItems.push(
        mapUzbOrderItem(order, item, itemIndex, seller, courierCtx),
      );
    });
  }

  const deliveredItems = await listDeliveredOrderItems(userId);
  const grouped = groupInProgressTrackingItems(inProgressItems);

  return {
    items: grouped,
    inProgressItems: grouped,
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
  const courierByItem = await loadActiveCourierCtxByItem(
    orders.map((order) => order.id),
  );

  const inProgressItems = [];
  for (const order of orders) {
    (Array.isArray(order.items) ? order.items : []).forEach((item, itemIndex) => {
      const seller = sellerById.get(cleanSellerId(item.sellerId));
      if (!seller) return;
      if (isDeliveredOrderItem(order, item)) return;
      if (isTerminalOrderItem(item)) return;

      const courierCtx =
        courierByItem.get(assignmentItemKey(order.id, itemIndex)) || null;
      const pipelineMode = resolveSellerPipelineMode(seller.sellerCountry);
      if (pipelineMode === "foreign") {
        const shipment = shipmentByKey.get(
          shipmentKey(order.id, itemIndex, seller.id),
        ) || null;
        inProgressItems.push(
          mapForeignOrderItem(
            order,
            item,
            itemIndex,
            seller,
            shipment,
            courierCtx,
          ),
        );
        return;
      }

      inProgressItems.push(
        mapUzbOrderItem(order, item, itemIndex, seller, courierCtx),
      );
    });
  }

  const deliveredItems = await listDeliveredOrderItems(userId);
  const grouped = groupInProgressTrackingItems(inProgressItems);

  return {
    items: grouped,
    inProgressItems: grouped,
    deliveredItems,
  };
}

module.exports = {
  listMyUzbOrderTracking,
  listMyOrderTracking,
  groupInProgressTrackingItems,
  fulfillmentGroupKey,
};
