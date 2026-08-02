const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const {
  toPublicAssignment,
  loadOrderPaymentMap,
  attachSellerPickup,
  ACTIVE_ASSIGNMENT_STATUSES,
} = require("./courierOrderAssignmentService");
const {
  getCourierAssignmentProgress,
} = require("../../utils/courierAssignmentStatus");

function unitSummary(order) {
  return {
    id: String(order.id || ""),
    itemIndex: Number(order.itemIndex) || 0,
    unitIndex: Number(order.unitIndex) || 0,
    productId: Number(order.productId) || 0,
    productCode: String(order.productCode || ""),
    barcode: String(order.barcode || order.productCode || ""),
    title: order.title || { uz: "", ru: "" },
    amount: Math.max(0, Number(order.amount) || 0),
    imageUrl: String(order.imageUrl || ""),
    color: String(order.color || ""),
    size: String(order.size || ""),
    storage: String(order.storage || ""),
    model: String(order.model || ""),
    status: String(order.status || "accepted"),
    sellerId: String(order.sellerId || ""),
    pickupKind: order.pickupKind || "seller",
    sellerPickup: order.sellerPickup || null,
  };
}

function statusRank(status) {
  const progress = getCourierAssignmentProgress(status);
  return Number(progress?.currentIndex) || 0;
}

/**
 * Bir mijoz / bir orderId — bitta kartochka.
 * Primary = eng orqada qolgan (kam progress) unit — badge/action shunga mos.
 */
function groupAcceptedOrdersByOrderId(orders = []) {
  const list = Array.isArray(orders) ? orders : [];
  const map = new Map();

  for (const order of list) {
    if (!order) continue;
    const orderId = Number(order.orderId) || 0;
    if (!map.has(orderId)) {
      map.set(orderId, []);
    }
    map.get(orderId).push(order);
  }

  return Array.from(map.values()).map((units) => {
    const sorted = [...units].sort(
      (a, b) => statusRank(a.status) - statusRank(b.status),
    );
    const primary = sorted[0] || units[0];
    const productCodes = [
      ...new Set(
        units
          .map((unit) => String(unit.productCode || unit.barcode || "").trim())
          .filter(Boolean),
      ),
    ];
    const amount = units.reduce(
      (sum, unit) => sum + (Math.max(0, Number(unit.amount) || 0)),
      0,
    );
    const unitRows = units.map(unitSummary);

    return {
      ...primary,
      isGroup: units.length > 1,
      productCount: units.length,
      amount,
      productCodes,
      barcode:
        productCodes.length <= 1
          ? productCodes[0] || primary.barcode || primary.productCode || ""
          : productCodes.join(", "),
      productCode:
        productCodes.length <= 1
          ? productCodes[0] || primary.productCode || ""
          : productCodes.join(", "),
      units: unitRows,
      siblingIds: unitRows.map((unit) => unit.id).filter(Boolean),
    };
  });
}

/**
 * Kuryer bosh sahifasi — faol buyurtmalar (sotuvchidan olish + mijozga yetkazish).
 * Bir orderId = bir kartochka (qabuldagi available grouping bilan bir xil).
 */
async function listAcceptedOrdersForCourier(deliveryId, query = {}) {
  const statusFilter = String(query.status || "active").trim().toLowerCase();
  const filter = {
    deliveryId,
  };

  if (!statusFilter || statusFilter === "active" || statusFilter === "accepted") {
    filter.status = { $in: ACTIVE_ASSIGNMENT_STATUSES };
  } else if (statusFilter !== "all") {
    filter.status = statusFilter;
  }

  const rows = await CourierOrderAssignment.find(filter)
    .sort({ acceptedAt: -1, createdAt: -1 })
    .lean();

  const paymentMap = await loadOrderPaymentMap(rows.map((row) => row.orderId));
  const flat = await attachSellerPickup(
    rows.map((row) => toPublicAssignment(row, paymentMap.get(Number(row.orderId)) || {})),
  );
  const orders = groupAcceptedOrdersByOrderId(flat);

  return {
    total: orders.length,
    unitTotal: flat.length,
    orders,
  };
}

module.exports = {
  listAcceptedOrdersForCourier,
  groupAcceptedOrdersByOrderId,
};
