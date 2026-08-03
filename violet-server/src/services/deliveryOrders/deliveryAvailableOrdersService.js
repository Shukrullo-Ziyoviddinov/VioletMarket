const { Order } = require("../../models/order");
const {
  formatOrderCode,
  formatProductCode,
} = require("../../productManagement/sellerOrders");
const {
  normalizeOrderTrackingStatus,
} = require("../../productManagement/orderTracking");
const {
  isClosedUnitStatus,
  resolveUnitTrackingStatus,
} = require("../../productManagement/orderItemUnitTracking");
const { haversineKm } = require("../../utils/geoDistance");
const { isOrderPaid } = require("./courierReturnOrderService");
const {
  resolveStoredPaymentMethod,
} = require("../../productManagement/paymentMethods");
const {
  loadTakenAssignmentUnitKeys,
  assignmentUnitKey,
} = require("../../unitLifecycle/assignmentPoolRules");
const {
  getActiveCourierWithRegion,
  resolveOrderAddressFields,
  resolveOrderDeliveryRegion,
} = require("./deliveryRegionPolicy");

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

function parseCourierCoords(query = {}) {
  const lat = Number(query.courierLat ?? query.lat);
  const lng = Number(query.courierLng ?? query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

function buildAvailableOrderCard(order, item, itemIndex, unitIndex, courierCoords) {
  const orderId = Number(order?.id) || 0;
  const productId = Number(item?.productId) || 0;
  const address = resolveOrderAddressFields(order);
  const fromCoords =
    Array.isArray(courierCoords) && courierCoords.length >= 2
      ? courierCoords
      : null;
  const distanceKm = fromCoords
    ? haversineKm(fromCoords, address.coords)
    : null;
  const handedEntry = (Array.isArray(item?.trackingHistory) ? item.trackingHistory : []).find(
    (entry) => String(entry?.status || "") === "handed_to_courier",
  );
  const unitPrice = Math.max(0, Number(item?.price) || 0);

  return {
    id: `${orderId}-${productId}-${itemIndex}-${unitIndex}`,
    orderId,
    itemIndex,
    unitIndex,
    orderCode: formatOrderCode(orderId),
    productId,
    productCode: formatProductCode(productId),
    barcode: formatProductCode(productId),
    title: resolveTitle(item?.title),
    region: address.region,
    city: address.city,
    district: address.district,
    distanceKm,
    productCount: 1,
    amount: unitPrice,
    isPaid: isOrderPaid(order),
    paymentMethod: resolveStoredPaymentMethod(order?.paymentMethod),
    paymentStatus: String(order?.status || ""),
    orderedAt: order?.paidAt || order?.createdAt || null,
    handedToCourierAt: handedEntry?.at || null,
    trackingStatus: resolveUnitTrackingStatus(item, unitIndex),
  };
}

async function listAvailableDeliveryOrders(deliveryId, query = {}) {
  const { region: courierRegion } =
    await getActiveCourierWithRegion(deliveryId);
  const districtFilter = String(query.district || "").trim().toLowerCase();
  const maxDistanceKm = Number(query.maxDistanceKm);
  const courierCoords = parseCourierCoords(query);

  const orders = await Order.find({
    "items.trackingStatus": "handed_to_courier",
  })
    .sort({ paidAt: -1, createdAt: -1 })
    .lean();

  const cards = [];

  for (const order of orders) {
    const orderRegion = resolveOrderDeliveryRegion(order);
    if (orderRegion !== courierRegion) continue;

    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item, itemIndex) => {
      if (normalizeOrderTrackingStatus(item?.trackingStatus) !== "handed_to_courier") {
        return;
      }
      const unitCount = Math.max(1, Number(item.quantity) || 1);
      for (let unitIndex = 0; unitIndex < unitCount; unitIndex += 1) {
        // Partial «mavjud emas» / bekor — yopiq dona kuryer pooliga chiqmasin
        if (isClosedUnitStatus(resolveUnitTrackingStatus(item, unitIndex))) {
          continue;
        }
        cards.push(
          buildAvailableOrderCard(order, item, itemIndex, unitIndex, courierCoords),
        );
      }
    });
  }

  // Band donalar — assignmentPoolRules (accept bilan bir xil)
  const takenKeys = await loadTakenAssignmentUnitKeys();

  let filtered = cards.filter(
    (card) =>
      !takenKeys.has(
        assignmentUnitKey(card.orderId, card.itemIndex, card.unitIndex),
      ),
  );

  if (districtFilter && districtFilter !== "barchasi") {
    filtered = filtered.filter(
      (card) => String(card.district || "").trim().toLowerCase() === districtFilter,
    );
  }

  if (Number.isFinite(maxDistanceKm) && maxDistanceKm > 0) {
    filtered = filtered.filter((card) => {
      if (card.distanceKm == null) return false;
      return Number(card.distanceKm) <= maxDistanceKm;
    });
  }

  filtered.sort((a, b) => {
    if (
      courierCoords &&
      a.distanceKm != null &&
      b.distanceKm != null &&
      a.distanceKm !== b.distanceKm
    ) {
      return a.distanceKm - b.distanceKm;
    }
    const aTime = new Date(a.handedToCourierAt || a.orderedAt || 0).getTime();
    const bTime = new Date(b.handedToCourierAt || b.orderedAt || 0).getTime();
    return bTime - aTime;
  });

  const grouped = groupAvailableCardsByOrderId(filtered);

  return {
    total: grouped.length,
    unitTotal: filtered.length,
    orders: grouped,
    region: courierRegion,
    locationUsed: Boolean(courierCoords),
  };
}

/**
 * Bir buyurtma = bir yetkazish guruhi (bir mijoz / bir manzil).
 * Ichida units[] — accept/return dona bo‘yicha qoladi.
 */
function groupAvailableCardsByOrderId(cards = []) {
  const map = new Map();

  for (const card of cards) {
    const orderId = Number(card.orderId) || 0;
    if (!map.has(orderId)) {
      map.set(orderId, {
        id: `order-${orderId}`,
        orderId,
        orderCode: card.orderCode,
        region: card.region,
        city: card.city,
        district: card.district,
        distanceKm: card.distanceKm,
        isPaid: card.isPaid,
        paymentMethod: card.paymentMethod,
        paymentStatus: card.paymentStatus,
        orderedAt: card.orderedAt,
        trackingStatus: card.trackingStatus,
        units: [],
      });
    }

    map.get(orderId).units.push({
      id: card.id,
      itemIndex: card.itemIndex,
      unitIndex: card.unitIndex,
      productId: card.productId,
      productCode: card.productCode,
      barcode: card.barcode,
      title: card.title,
      amount: card.amount,
      handedToCourierAt: card.handedToCourierAt,
      trackingStatus: card.trackingStatus,
    });
  }

  return Array.from(map.values()).map((group) => {
    const units = group.units;
    const productCodes = [
      ...new Set(units.map((unit) => String(unit.productCode || "").trim()).filter(Boolean)),
    ];
    const amount = units.reduce((sum, unit) => sum + (Number(unit.amount) || 0), 0);
    const handedTimes = units
      .map((unit) => unit.handedToCourierAt)
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
    const first = units[0] || {};

    return {
      ...group,
      isGroup: units.length > 1,
      productCount: units.length,
      amount,
      productCodes,
      barcode:
        productCodes.length <= 1
          ? productCodes[0] || first.barcode || ""
          : productCodes.join(", "),
      productCode:
        productCodes.length <= 1
          ? productCodes[0] || first.productCode || ""
          : productCodes.join(", "),
      productId: first.productId || 0,
      title: first.title || { uz: "", ru: "" },
      itemIndex: first.itemIndex || 0,
      unitIndex: first.unitIndex || 0,
      handedToCourierAt: handedTimes.length
        ? new Date(handedTimes[0]).toISOString()
        : group.orderedAt,
      acceptUnits: units.map((unit) => ({
        itemIndex: unit.itemIndex,
        unitIndex: unit.unitIndex,
      })),
    };
  });
}

module.exports = {
  listAvailableDeliveryOrders,
  groupAvailableCardsByOrderId,
  haversineKm,
};
