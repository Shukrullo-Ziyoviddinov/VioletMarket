const { Order } = require("../../models/order");
const {
  formatOrderCode,
  formatProductCode,
} = require("../../productManagement/sellerOrders");
const {
  normalizeOrderTrackingStatus,
} = require("../../productManagement/orderTracking");
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
    trackingStatus: normalizeOrderTrackingStatus(item?.trackingStatus),
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

  return {
    total: filtered.length,
    orders: filtered,
    region: courierRegion,
    locationUsed: Boolean(courierCoords),
  };
}

module.exports = {
  listAvailableDeliveryOrders,
  haversineKm,
};
