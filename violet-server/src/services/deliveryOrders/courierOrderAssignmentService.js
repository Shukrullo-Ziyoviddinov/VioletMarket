const { Order } = require("../../models/order");
const { DeliveryAccount } = require("../../models/deliveryAccount");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const { HttpError } = require("../../utils/httpError");
const {
  normalizeOrderTrackingStatus,
} = require("../../productManagement/orderTracking");

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

function toPublicAssignment(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(row._id),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    unitIndex: Number(row.unitIndex) || 0,
    productId: Number(row.productId) || 0,
    productCode: String(row.productCode || ""),
    sellerId: String(row.sellerId || ""),
    title: resolveTitle(row.title),
    amount: Math.max(0, Number(row.amount) || 0),
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
    status: String(row.status || "accepted"),
    handedToCourierAt: row.handedToCourierAt || null,
    acceptedAt: row.acceptedAt || null,
    createdAt: row.createdAt || null,
  };
}

/**
 * Kuryer "Qabul qilish" bosganda — alohida collectionga yoziladi.
 * (UI tugmasi keyingi qadamda ulanadi; API hozir tayyor.)
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
    status: "accepted",
    handedToCourierAt: handedEntry?.at || null,
    acceptedAt,
  });

  return toPublicAssignment(created);
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
  listAssignmentsByKeys,
  assignmentLookupKey,
  toPublicAssignment,
};
