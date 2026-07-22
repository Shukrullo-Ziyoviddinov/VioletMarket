const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const {
  toPublicAssignment,
  loadOrderPaymentMap,
  attachSellerPickup,
  ACTIVE_ASSIGNMENT_STATUSES,
} = require("./courierOrderAssignmentService");

/**
 * Kuryer bosh sahifasi — faol buyurtmalar (sotuvchidan olish + mijozga yetkazish).
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
  const orders = await attachSellerPickup(
    rows.map((row) => toPublicAssignment(row, paymentMap.get(Number(row.orderId)) || {})),
  );

  return {
    total: orders.length,
    orders,
  };
}

module.exports = {
  listAcceptedOrdersForCourier,
};
