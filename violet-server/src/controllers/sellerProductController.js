const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/sellerProduct/sellerProductFormService");

const getProductFormOptions = asyncHandler(async (req, res) => {
  const data = await service.getSellerProductFormOptions();
  res.json({ ok: true, data });
});

const getRelatedProductPickerOptions = asyncHandler(async (req, res) => {
  const options = await service.listSellerRelatedProductPickerOptions(req.sellerShopId);
  res.json({ ok: true, data: { options } });
});

module.exports = {
  getProductFormOptions,
  getRelatedProductPickerOptions,
};
