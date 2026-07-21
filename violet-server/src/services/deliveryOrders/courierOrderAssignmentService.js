const { Order } = require("../../models/order");
const { User } = require("../../models/user");
const { DeliveryAccount } = require("../../models/deliveryAccount");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const { HttpError } = require("../../utils/httpError");
const {
  normalizeOrderTrackingStatus,
} = require("../../productManagement/orderTracking");
const {
  normalizeDeliveryAddress,
} = require("../../utils/normalizeDeliveryAddress");
const {
  recordSalesOnDelivery,
} = require("../../productManagement/recordSalesOnDelivery");
const { haversineKm } = require("../../utils/geoDistance");
const {
  getCourierPaymentSettings,
  resolveCourierPaymentForDistance,
} = require("../courierPayment/courierPaymentService");
const { isOrderPaid } = require("./courierReturnOrderService");

function parseCourierCoords(payload = {}) {
  const lat = Number(payload.courierLat ?? payload.lat);
  const lng = Number(payload.courierLng ?? payload.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

function resolveAssignmentDistanceKm(assignment, courierCoords) {
  const addressCoords = assignment?.deliveryAddress?.coords;
  if (courierCoords && Array.isArray(addressCoords) && addressCoords.length >= 2) {
    return haversineKm(courierCoords, addressCoords);
  }
  const stored = Number(assignment?.distanceKm);
  return Number.isFinite(stored) && stored >= 0 ? stored : null;
}

function formatProductCode(productId) {
  const id = Math.max(0, Math.floor(Number(productId) || 0));
  if (!id) return "";
  return `#${String(id).padStart(4, "0")}`;
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

function snapshotCustomer(user) {
  if (!user) {
    return { firstName: "", lastName: "", phone: "" };
  }
  return {
    firstName: String(user.firstName || "").trim(),
    lastName: String(user.lastName || "").trim(),
    phone: String(user.phone || "").trim(),
  };
}

function snapshotDeliveryAddress(raw) {
  const normalized = normalizeDeliveryAddress(raw);
  if (!normalized) {
    return {
      city: "",
      district: "",
      addressLine: "",
      placeType: "",
      entrance: "",
      floor: "",
      domofon: "",
      courierNote: "",
    };
  }
  return {
    city: normalized.city || "",
    district: normalized.district || "",
    addressLine: normalized.addressLine || "",
    placeType: normalized.placeType || "",
    entrance: normalized.entrance || "",
    floor: normalized.floor || "",
    domofon: normalized.domofon || "",
    courierNote: normalized.courierNote || "",
    ...(normalized.coords ? { coords: normalized.coords } : {}),
  };
}

function toPublicAssignment(doc, extras = {}) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  const address = row.deliveryAddress || {};
  const customer = row.customer || {};
  const isPaid =
    extras.isPaid != null ? Boolean(extras.isPaid) : Boolean(row.isPaid);
  return {
    id: String(row._id),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    unitIndex: Number(row.unitIndex) || 0,
    productId: Number(row.productId) || 0,
    productCode: String(row.productCode || ""),
    barcode: String(row.productCode || ""),
    sellerId: String(row.sellerId || ""),
    title: resolveTitle(row.title),
    amount: Math.max(0, Number(row.amount) || 0),
    deliveryFee: 0,
    productCount: 1,
    imageUrl: String(row.imageUrl || ""),
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
    deliveryId: String(row.deliveryId || ""),
    courier: {
      firstName: String(row.courier?.firstName || ""),
      lastName: String(row.courier?.lastName || ""),
      phone: String(row.courier?.phone || ""),
      email: String(row.courier?.email || ""),
    },
    customer: {
      firstName: String(customer.firstName || ""),
      lastName: String(customer.lastName || ""),
      phone: String(customer.phone || ""),
    },
    deliveryAddress: {
      city: String(address.city || ""),
      district: String(address.district || ""),
      addressLine: String(address.addressLine || ""),
      placeType: String(address.placeType || ""),
      entrance: String(address.entrance || ""),
      floor: String(address.floor || ""),
      domofon: String(address.domofon || ""),
      courierNote: String(address.courierNote || ""),
      coords: Array.isArray(address.coords) ? address.coords : null,
    },
    status: String(row.status || "accepted"),
    handedToCourierAt: row.handedToCourierAt || null,
    acceptedAt: row.acceptedAt || null,
    deliveredAt: row.deliveredAt || null,
    distanceKm:
      row.distanceKm == null || row.distanceKm === ""
        ? null
        : Math.max(0, Number(row.distanceKm) || 0),
    courierPayment: Math.max(0, Number(row.courierPayment) || 0),
    createdAt: row.createdAt || null,
    isPaid,
    paymentStatus: String(extras.paymentStatus || row.paymentStatus || ""),
    orderedAt: extras.orderedAt || row.orderedAt || null,
  };
}

async function loadOrderPaymentMap(orderIds = []) {
  const ids = [...new Set(orderIds.map((id) => Number(id)).filter((id) => id > 0))];
  if (!ids.length) return new Map();

  const orders = await Order.find({ id: { $in: ids } })
    .select("id status paidAt createdAt")
    .lean();

  const map = new Map();
  for (const order of orders) {
    map.set(Number(order.id), {
      isPaid: isOrderPaid(order),
      paymentStatus: String(order.status || ""),
      orderedAt: order.createdAt || null,
    });
  }
  return map;
}

/**
 * Kuryer "Qabul qilish" bosganda — alohida collectionga yoziladi.
 */
async function acceptOrderUnitByCourier(deliveryId, payload = {}) {
  const orderId = Number(payload.orderId);
  const itemIndex = Number(payload.itemIndex);
  const unitIndex = Math.max(0, Number(payload.unitIndex) || 0);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ORDER_ID");
  }
  if (!Number.isFinite(itemIndex) || itemIndex < 0) {
    throw new HttpError(400, "Mahsulot indeksi noto‘g‘ri", "INVALID_ITEM_INDEX");
  }

  const delivery = await DeliveryAccount.findById(deliveryId).lean();
  if (!delivery || String(delivery.status) !== "active") {
    throw new HttpError(403, "Kuryer hisobi faol emas", "DELIVERY_INACTIVE");
  }

  const existing = await CourierOrderAssignment.findOne({
    orderId,
    itemIndex,
    unitIndex,
  }).lean();
  if (existing) {
    if (String(existing.deliveryId) === String(deliveryId)) {
      return toPublicAssignment(existing);
    }
    throw new HttpError(
      409,
      "Bu mahsulotni boshqa kuryer allaqachon qabul qilgan",
      "ALREADY_ACCEPTED",
    );
  }

  const order = await Order.findOne({ id: orderId });
  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }

  const item = Array.isArray(order.items) ? order.items[itemIndex] : null;
  if (!item) {
    throw new HttpError(404, "Mahsulot topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const status = normalizeOrderTrackingStatus(item.trackingStatus);
  if (status !== "handed_to_courier") {
    throw new HttpError(
      409,
      "Mahsulot hali kuryerga topshirilmagan",
      "ORDER_TRACKING_STATUS_CONFLICT",
    );
  }

  const unitCount = Math.max(1, Number(item.quantity) || 1);
  if (unitIndex >= unitCount) {
    throw new HttpError(400, "Dona indeksi noto‘g‘ri", "INVALID_UNIT_INDEX");
  }

  const handedEntry = (Array.isArray(item.trackingHistory) ? item.trackingHistory : []).find(
    (entry) => String(entry?.status || "") === "handed_to_courier",
  );

  const productId = Number(item.productId) || 0;
  const amount = Math.max(0, Number(item.price) || 0);
  const acceptedAt = new Date();
  const deliveryAddress = snapshotDeliveryAddress(order.deliveryAddress);
  const courierCoords = parseCourierCoords(payload);
  const distanceKm = resolveAssignmentDistanceKm({ deliveryAddress }, courierCoords);
  const user = order.userId
    ? await User.findById(order.userId).select("firstName lastName phone").lean()
    : null;

  const created = await CourierOrderAssignment.create({
    orderId,
    itemIndex,
    unitIndex,
    productId,
    productCode: formatProductCode(productId),
    sellerId: String(item.sellerId || "").trim(),
    title: resolveTitle(item.title),
    amount,
    imageUrl: String(item.image || ""),
    color: String(item.color || ""),
    size: String(item.size || ""),
    storage: String(item.storage || ""),
    model: String(item.model || ""),
    deliveryId: delivery._id,
    courier: {
      firstName: String(delivery.firstName || "").trim(),
      lastName: String(delivery.lastName || "").trim(),
      phone: String(delivery.phone || "").trim(),
      email: String(delivery.email || "").trim(),
    },
    customer: snapshotCustomer(user),
    deliveryAddress,
    status: "accepted",
    handedToCourierAt: handedEntry?.at || null,
    acceptedAt,
    ...(distanceKm != null ? { distanceKm } : {}),
  });

  return toPublicAssignment(created);
}

/**
 * Kuryer "Topshirdim" — mijoz mahsulotni oldi.
 * Keyinchalik asosiy admindan ham shu holat tasdiqlanishi mumkin.
 */
async function deliverOrderUnitByCourier(deliveryId, payload = {}) {
  const assignmentId = String(payload.assignmentId || payload.id || "").trim();
  const orderId = Number(payload.orderId);
  const itemIndex = Number(payload.itemIndex);
  const unitIndex = Math.max(0, Number(payload.unitIndex) || 0);

  let assignment = null;
  if (assignmentId) {
    assignment = await CourierOrderAssignment.findById(assignmentId);
  } else if (Number.isFinite(orderId) && Number.isFinite(itemIndex)) {
    assignment = await CourierOrderAssignment.findOne({
      orderId,
      itemIndex,
      unitIndex,
    });
  }

  if (!assignment) {
    throw new HttpError(404, "Qabul qilingan buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }

  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }

  if (String(assignment.status) === "delivered") {
    return toPublicAssignment(assignment);
  }

  if (String(assignment.status) !== "accepted") {
    throw new HttpError(
      409,
      "Bu buyurtmani topshirish mumkin emas",
      "ASSIGNMENT_STATUS_CONFLICT",
    );
  }

  const deliveredAt = new Date();
  assignment.status = "delivered";
  assignment.deliveredAt = deliveredAt;

  const courierCoords = parseCourierCoords(payload);
  const distanceKm = resolveAssignmentDistanceKm(assignment, courierCoords);
  if (distanceKm != null) {
    assignment.distanceKm = distanceKm;
  }

  const paymentSettings = await getCourierPaymentSettings();
  const resolvedDistance = assignment.distanceKm;
  assignment.courierPayment = resolveCourierPaymentForDistance(
    resolvedDistance,
    paymentSettings.tiers,
  );
  assignment.courierPaymentUpdatedAt = deliveredAt;

  if (
    !assignment.customer?.phone &&
    !assignment.customer?.firstName &&
    !assignment.customer?.lastName
  ) {
    const orderForCustomer = await Order.findOne({ id: assignment.orderId })
      .select("userId")
      .lean();
    if (orderForCustomer?.userId) {
      const user = await User.findById(orderForCustomer.userId)
        .select("firstName lastName phone")
        .lean();
      assignment.customer = snapshotCustomer(user);
    }
  }

  await assignment.save();

  const order = await Order.findOne({ id: assignment.orderId });
  if (order) {
    const item = Array.isArray(order.items) ? order.items[assignment.itemIndex] : null;
    if (item) {
      const unitCount = Math.max(1, Number(item.quantity) || 1);
      const unitAssignments = await CourierOrderAssignment.find({
        orderId: assignment.orderId,
        itemIndex: assignment.itemIndex,
      })
        .select("unitIndex status")
        .lean();

      const deliveredUnits = new Set(
        unitAssignments
          .filter((row) => String(row.status) === "delivered")
          .map((row) => Number(row.unitIndex) || 0),
      );

      let allUnitsDelivered = true;
      for (let i = 0; i < unitCount; i += 1) {
        if (!deliveredUnits.has(i)) {
          allUnitsDelivered = false;
          break;
        }
      }

      const currentStatus = normalizeOrderTrackingStatus(item.trackingStatus);
      if (allUnitsDelivered && currentStatus !== "delivered") {
        item.trackingStatus = "delivered";
        if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
        item.trackingHistory.push({ status: "delivered", at: deliveredAt });
      }

      const allItemsDelivered = (Array.isArray(order.items) ? order.items : []).every(
        (row) => normalizeOrderTrackingStatus(row.trackingStatus) === "delivered",
      );
      if (allItemsDelivered && String(order.status) !== "delivered") {
        order.status = "delivered";
      }

      await order.save();

      // Sotuv/daromad — faqat topshirilganda (siller + asosiy admin)
      await recordSalesOnDelivery(order, deliveredAt);
    }
  }

  const paymentMap = await loadOrderPaymentMap([assignment.orderId]);
  const payment = paymentMap.get(Number(assignment.orderId)) || {};
  return toPublicAssignment(assignment, payment);
}

async function getAssignmentForCourier(deliveryId, assignmentId) {
  const id = String(assignmentId || "").trim();
  if (!id) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ASSIGNMENT_ID");
  }

  const assignment = await CourierOrderAssignment.findById(id);
  if (!assignment) {
    throw new HttpError(404, "Buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }
  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }

  if (
    !assignment.customer?.phone &&
    !assignment.customer?.firstName &&
    !assignment.customer?.lastName
  ) {
    const order = await Order.findOne({ id: assignment.orderId }).select("userId").lean();
    if (order?.userId) {
      const user = await User.findById(order.userId)
        .select("firstName lastName phone")
        .lean();
      assignment.customer = snapshotCustomer(user);
      await assignment.save();
    }
  }

  const paymentMap = await loadOrderPaymentMap([assignment.orderId]);
  const payment = paymentMap.get(Number(assignment.orderId)) || {};
  return toPublicAssignment(assignment, payment);
}

async function listAssignmentsByKeys(keys = []) {
  if (!Array.isArray(keys) || !keys.length) return [];

  const or = keys
    .map((key) => {
      const orderId = Number(key.orderId);
      const itemIndex = Number(key.itemIndex);
      const unitIndex = Math.max(0, Number(key.unitIndex) || 0);
      if (!Number.isFinite(orderId) || !Number.isFinite(itemIndex)) return null;
      return { orderId, itemIndex, unitIndex };
    })
    .filter(Boolean);

  if (!or.length) return [];

  const rows = await CourierOrderAssignment.find({ $or: or }).lean();
  return rows.map(toPublicAssignment);
}

function assignmentLookupKey(orderId, itemIndex, unitIndex) {
  return `${Number(orderId)}:${Number(itemIndex)}:${Number(unitIndex) || 0}`;
}

module.exports = {
  acceptOrderUnitByCourier,
  deliverOrderUnitByCourier,
  getAssignmentForCourier,
  listAssignmentsByKeys,
  assignmentLookupKey,
  toPublicAssignment,
  loadOrderPaymentMap,
  resolveAssignmentDistanceKm,
  parseCourierCoords,
};
