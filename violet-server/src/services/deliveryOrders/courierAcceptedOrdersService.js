const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const {
  toPublicAssignment,
  loadOrderPaymentMap,
  attachSellerPickup,
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
    // accepted (default/eski client) = ikkala faol bosqich
    filter.status = { $in: ["accepted", "picked_up"] };
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
