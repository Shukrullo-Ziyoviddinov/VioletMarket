const { Order } = require("../../models/order");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const {
  formatOrderCode,
  formatProductCode,
} = require("../../productManagement/sellerOrders");
const {
  normalizeOrderTrackingStatus,
} = require("../../productManagement/orderTracking");
const {
  parseCityDistrictFromLine,
} = require("../../utils/normalizeDeliveryAddress");
const { isOrderPaid } = require("./courierReturnOrderService");
const {
  resolveStoredPaymentMethod,
} = require("../../productManagement/paymentMethods");

function toRad(value) {
  return (Number(value) * Math.PI) / 180;
}

function haversineKm(from, to) {
  if (!Array.isArray(from) || !Array.isArray(to) || from.length < 2 || to.length < 2) {
    return null;
  }
  const lat1 = Number(from[0]);
  const lon1 = Number(from[1]);
  const lat2 = Number(to[0]);
  const lon2 = Number(to[1]);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
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

function resolveAddressFields(order) {
  const address = order?.deliveryAddress || {};
  const addressLine = String(address.addressLine || "").trim();
  const parsed = parseCityDistrictFromLine(addressLine);
  const city =
    String(address.city || "").trim() || parsed.city || "Toshkent";
  const district =
    String(address.district || "").trim() ||
    parsed.district ||
    "Noma’lum tuman";
  return {
    city,
    district,
    addressLine,
    coords: Array.isArray(address.coords) ? address.coords : null,
  };
}

function buildAvailableOrderCard(order, item, itemIndex, unitIndex, courierCoords) {
  const orderId = Number(order?.id) || 0;
  const productId = Number(item?.productId) || 0;
  const address = resolveAddressFields(order);
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

function parseCourierCoords(query = {}) {
  const lat = Number(query.courierLat ?? query.lat);
  const lng = Number(query.courierLng ?? query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

async function listAvailableDeliveryOrders(query = {}) {
  const cityFilter = String(query.city || "").trim().toLowerCase();
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

  // Allaqachon qabul qilingan donalarni olib tashlash
  const accepted = await CourierOrderAssignment.find({
    status: {
      $in: [
        "accepted",
        "en_route_to_seller",
        "arrived_at_seller",
        "picked_up",
        "en_route_to_customer",
        "arrived_at_customer",
        "delivered",
      ],
    },
  })
    .select({ orderId: 1, itemIndex: 1, unitIndex: 1 })
    .lean();
  const acceptedKeys = new Set(
    accepted.map(
      (row) =>
        `${Number(row.orderId)}:${Number(row.itemIndex)}:${Number(row.unitIndex) || 0}`,
    ),
  );

  let filtered = cards.filter(
    (card) =>
      !acceptedKeys.has(
        `${Number(card.orderId)}:${Number(card.itemIndex)}:${Number(card.unitIndex) || 0}`,
      ),
  );

  if (cityFilter) {
    filtered = filtered.filter(
      (card) => String(card.city || "").trim().toLowerCase() === cityFilter,
    );
  }

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
    locationUsed: Boolean(courierCoords),
  };
}

module.exports = {
  listAvailableDeliveryOrders,
  haversineKm,
};
