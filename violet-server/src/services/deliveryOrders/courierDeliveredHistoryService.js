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

function completedAt(row) {
  const raw = row.deliveredAt || row.returnedAt || null;
  if (!raw) return null;
  const at = new Date(raw);
  return Number.isNaN(at.getTime()) ? null : at;
}

/**
 * Kuryer Tarix — topshirgan yoki sotuvchiga qaytargan buyurtmalar.
 */
async function listDeliveredHistoryForCourier(deliveryId) {
  const rows = await CourierOrderAssignment.find({
    deliveryId,
    status: { $in: ["delivered", "returned"] },
  }).lean();

  rows.sort((a, b) => {
    const aAt = completedAt(a)?.getTime() || 0;
    const bAt = completedAt(b)?.getTime() || 0;
    return bAt - aAt;
  });

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
    const at = completedAt(row);
    if (!at) continue;
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
