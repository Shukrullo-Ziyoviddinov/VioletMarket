const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminProductService");

const list = asyncHandler(async (_req, res) => {
  const products = await service.listProductsForAdmin();
  res.json({ ok: true, data: { products } });
});

const stats = asyncHandler(async (_req, res) => {
  const statsData = await service.getProductStats();
  res.json({ ok: true, data: statsData });
});

const picker = asyncHandler(async (req, res) => {
  const options = await service.listProductPickerOptions(req.query.forProductId);
  res.json({ ok: true, data: { options } });
});

const getById = asyncHandler(async (req, res) => {
  const product = await service.getProductForEdit(req.params.id);
  res.json({ ok: true, data: { product } });
});

const update = asyncHandler(async (req, res) => {
  const product = await service.updateProductForAdmin(req.params.id, req.body || {});
  res.json({ ok: true, data: { product } });
});

const remove = asyncHandler(async (req, res) => {
  const result = await service.deleteProductForAdmin(req.params.id);
  res.json({ ok: true, data: result });
});

module.exports = {
  list,
  stats,
  picker,
  getById,
  update,
  remove,
};
