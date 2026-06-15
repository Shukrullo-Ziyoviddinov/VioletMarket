const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminProductTypeService");

const list = asyncHandler(async (_req, res) => {
  const data = await service.listProductTypes();
  res.json({ ok: true, data });
});

const create = asyncHandler(async (req, res) => {
  const row = await service.createProductType(req.body || {});
  res.status(201).json({ ok: true, data: row });
});

const update = asyncHandler(async (req, res) => {
  const row = await service.updateProductType(req.params.productTypeId, req.body || {});
  res.json({ ok: true, data: row });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteProductType(req.params.productTypeId);
  res.json({ ok: true });
});

module.exports = {
  list,
  create,
  update,
  remove,
};
