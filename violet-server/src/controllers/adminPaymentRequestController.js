const { asyncHandler } = require("../utils/asyncHandler");
const adminPaymentRequestService = require("../services/adminPaymentRequests/adminPaymentRequestService");

const getPaymentRequestStats = asyncHandler(async (req, res) => {
  const data = await adminPaymentRequestService.buildPaymentRequestStats();
  res.json({ ok: true, data });
});

const getPaymentRequestSellerOptions = asyncHandler(async (req, res) => {
  const sellers = await adminPaymentRequestService.listPaymentRequestSellerOptions();
  res.json({ ok: true, data: { sellers } });
});

const listPaymentRequests = asyncHandler(async (req, res) => {
  const data = await adminPaymentRequestService.listPaymentRequests(req.query || {});
  res.json({ ok: true, data });
});

const getPaymentRequestDetail = asyncHandler(async (req, res) => {
  const data = await adminPaymentRequestService.getPaymentRequestDetail(req.params.paymentRequestId);
  res.json({ ok: true, data });
});

const approvePaymentRequest = asyncHandler(async (req, res) => {
  const data = await adminPaymentRequestService.approvePaymentRequest(req.params.paymentRequestId);
  res.json({ ok: true, data });
});

const rejectPaymentRequest = asyncHandler(async (req, res) => {
  const data = await adminPaymentRequestService.rejectPaymentRequest(req.params.paymentRequestId);
  res.json({ ok: true, data });
});

module.exports = {
  getPaymentRequestStats,
  getPaymentRequestSellerOptions,
  listPaymentRequests,
  getPaymentRequestDetail,
  approvePaymentRequest,
  rejectPaymentRequest,
};
