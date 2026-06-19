const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminFlashCategory/adminFlashCategoryService");

const listCategoryOptions = asyncHandler(async (_req, res) => {
  const options = await service.listCategoryOptions();
  res.json({ ok: true, data: { options } });
});

const listSellers = asyncHandler(async (_req, res) => {
  const sellers = await service.listSellers();
  res.json({ ok: true, data: { sellers } });
});

const listSellerProducts = asyncHandler(async (req, res) => {
  const products = await service.listSellerProducts(req.params.sellerId);
  res.json({ ok: true, data: { products } });
});

const listFlashProducts = asyncHandler(async (_req, res) => {
  const products = await service.listFlashProducts();
  res.json({ ok: true, data: { products } });
});

const assignFlashProduct = asyncHandler(async (req, res) => {
  const product = await service.assignFlashProduct(req.body || {});
  res.json({ ok: true, data: { product } });
});

const removeFlashProduct = asyncHandler(async (req, res) => {
  const result = await service.removeFlashProduct(req.params.productId);
  res.json({ ok: true, data: result });
});

module.exports = {
  listCategoryOptions,
  listSellers,
  listSellerProducts,
  listFlashProducts,
  assignFlashProduct,
  removeFlashProduct,
};
