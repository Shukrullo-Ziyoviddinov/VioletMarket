const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/sellerProduct/sellerProductFormService");

const getProductFormOptions = asyncHandler(async (req, res) => {
  const data = await service.getSellerProductFormOptions();
  res.json({ ok: true, data });
});

module.exports = {
  getProductFormOptions,
};
