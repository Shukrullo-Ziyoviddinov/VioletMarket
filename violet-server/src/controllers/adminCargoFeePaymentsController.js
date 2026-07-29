const { asyncHandler } = require("../utils/asyncHandler");
const adminCargoFeePaymentsService = require("../services/adminCargoFeePayments/adminCargoFeePaymentsService");

const listPayments = asyncHandler(async (req, res) => {
  const data = await adminCargoFeePaymentsService.listAdminCargoFeePayments(
    req.query || {},
  );
  res.json({ ok: true, data });
});

const getPaymentDetail = asyncHandler(async (req, res) => {
  const data = await adminCargoFeePaymentsService.getAdminCargoFeePaymentDetail(
    req.params.shipmentId,
  );
  res.json({ ok: true, data });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const data = await adminCargoFeePaymentsService.confirmAdminCargoFeePayment(
    req.params.shipmentId,
  );
  res.json({ ok: true, data });
});

module.exports = {
  listPayments,
  getPaymentDetail,
  confirmPayment,
};
