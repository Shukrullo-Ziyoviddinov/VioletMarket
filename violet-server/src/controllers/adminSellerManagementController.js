const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminSellerManagement/adminSellerManagementService");

const pauseSeller = asyncHandler(async (req, res) => {
  const data = await service.pauseSeller(req.params.shopId);
  res.json({ ok: true, data });
});

const activateSeller = asyncHandler(async (req, res) => {
  const data = await service.activateSeller(req.params.shopId);
  res.json({ ok: true, data });
});

module.exports = {
  pauseSeller,
  activateSeller,
};
