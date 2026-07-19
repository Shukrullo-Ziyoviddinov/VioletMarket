const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const {
  toPublicAssignment,
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

  const orders = rows.map(toPublicAssignment);

  return {
    total: orders.length,
    orders,
  };
}

module.exports = {
  listAcceptedOrdersForCourier,
};
