const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const {
  toPublicAssignment,
} = require("./courierOrderAssignmentService");

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

/**
 * Kuryer Tarix — o‘zi topshirgan buyurtmalar.
 */
async function listDeliveredHistoryForCourier(deliveryId) {
  const rows = await CourierOrderAssignment.find({
    deliveryId,
    status: "delivered",
  })
    .sort({ deliveredAt: -1, acceptedAt: -1 })
    .lean();

  const orders = rows.map(toPublicAssignment);
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  let todayCount = 0;
  let weekCount = 0;
  let totalIncome = 0;

  for (const row of rows) {
    const income = Math.max(0, Number(row.courierPayment) || 0);
    totalIncome += income;
    const at = row.deliveredAt ? new Date(row.deliveredAt) : null;
    if (!at || Number.isNaN(at.getTime())) continue;
    if (at >= todayStart) todayCount += 1;
    if (at >= weekStart) weekCount += 1;
  }

  return {
    total: orders.length,
    stats: {
      totalDelivered: orders.length,
      todayCount,
      weekCount,
      totalIncome,
    },
    orders,
  };
}

module.exports = {
  listDeliveredHistoryForCourier,
};
