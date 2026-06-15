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

module.exports = {
  list,
  stats,
};
