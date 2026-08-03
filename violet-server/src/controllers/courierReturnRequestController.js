const { asyncHandler } = require("../utils/asyncHandler");
const {
  createReturnRequestByCourier,
  listReturnRequestsForAdmin,
  approveReturnRequest,
  rejectReturnRequest,
  confirmApprovedReturnReasonByCourier,
  advanceReturnToSellerByCourier,
  completeReturnToSellerByCourier,
} = require("../unitLifecycle");

const createReturnRequest = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await createReturnRequestByCourier(req.deliveryId, body);
  res.json({ ok: true, data });
});

const confirmReturnReason = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await confirmApprovedReturnReasonByCourier(req.deliveryId, body);
  res.json({ ok: true, data });
});

const advanceReturnStep = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await advanceReturnToSellerByCourier(req.deliveryId, body);
  res.json({ ok: true, data });
});

const completeReturn = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await completeReturnToSellerByCourier(req.deliveryId, body);
  res.json({ ok: true, data });
});

const listAdminReturnRequests = asyncHandler(async (req, res) => {
  const data = await listReturnRequestsForAdmin(req.query || {});
  res.json({ ok: true, data });
});

const approveAdminReturnRequest = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await approveReturnRequest(req.params.id, body);
  res.json({ ok: true, data });
});

const rejectAdminReturnRequest = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data = await rejectReturnRequest(req.params.id, body);
  res.json({ ok: true, data });
});

module.exports = {
  createReturnRequest,
  confirmReturnReason,
  advanceReturnStep,
  completeReturn,
  listAdminReturnRequests,
  approveAdminReturnRequest,
  rejectAdminReturnRequest,
};
