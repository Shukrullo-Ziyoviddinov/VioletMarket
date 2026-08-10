const { asyncHandler } = require("../utils/asyncHandler");
const {
  listAdminCustomerRefundRequests,
  markCustomerRefundRefunded,
} = require("../services/customerRefund/customerRefundService");

const listCustomerRefundRequests = asyncHandler(async (req, res) => {
  const data = await listAdminCustomerRefundRequests(req.query || {});
  res.json({ ok: true, data });
});

const confirmCustomerRefund = asyncHandler(async (req, res) => {
  const adminId = String(req.adminId || req.user?.id || req.headers["x-admin-id"] || "");
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await markCustomerRefundRefunded(req.params.id, adminId, body);
  res.json({ ok: true, data });
});

module.exports = {
  listCustomerRefundRequests,
  confirmCustomerRefund,
};
