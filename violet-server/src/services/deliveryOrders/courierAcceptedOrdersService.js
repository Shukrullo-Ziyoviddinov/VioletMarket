const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const {
  toPublicAssignment,
  loadOrderPaymentMap,
} = require("./courierOrderAssignmentService");

/**
 * Kuryer bosh sahifasi — qabul qilingan buyurtmalar.
 */
async function listAcceptedOrdersForCourier(deliveryId, query = {}) {
  const statusFilter = String(query.status || "accepted").trim().toLowerCase();
  const filter = {
    deliveryId,
  };

  if (statusFilter && statusFilter !== "all") {
    filter.status = statusFilter;
  }

  const rows = await CourierOrderAssignment.find(filter)
    .sort({ acceptedAt: -1, createdAt: -1 })
    .lean();

  const paymentMap = await loadOrderPaymentMap(rows.map((row) => row.orderId));
  const orders = rows.map((row) =>
    toPublicAssignment(row, paymentMap.get(Number(row.orderId)) || {}),
  );

  return {
    total: orders.length,
    orders,
  };
}

module.exports = {
  listAcceptedOrdersForCourier,
};
