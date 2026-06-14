const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminProductPolicyService");

const list = asyncHandler(async (_req, res) => {
  const blocks = await service.listProductPolicyBlocks();
  res.json({ ok: true, data: { blocks } });
});

const create = asyncHandler(async (req, res) => {
  const row = await service.createProductPolicyBlock(req.body || {});
  res.status(201).json({ ok: true, data: row });
});

const update = asyncHandler(async (req, res) => {
  const row = await service.updateProductPolicyBlock(req.params.order, req.body || {});
  res.json({ ok: true, data: row });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteProductPolicyBlock(req.params.order);
  res.json({ ok: true });
});

module.exports = {
  list,
  create,
  update,
  remove,
};
