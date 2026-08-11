const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminProductApproval/adminProductApprovalService");

const listPending = asyncHandler(async (_req, res) => {
  const data = await service.listPendingProductsForAdmin();
  res.json({ ok: true, data });
});

const approve = asyncHandler(async (req, res) => {
  const data = await service.approvePendingProduct(
    req.params.id,
    req.body?.cargoExpressPolicy,
  );
  res.json({ ok: true, data });
});

const reject = asyncHandler(async (req, res) => {
  const data = await service.rejectPendingProduct(req.params.id, req.body?.reason);
  res.json({ ok: true, data });
});

module.exports = {
  listPending,
  approve,
  reject,
};
