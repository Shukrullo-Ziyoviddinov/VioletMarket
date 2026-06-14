const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminUzbProductDeliveryInfoService");

const get = asyncHandler(async (_req, res) => {
  const data = await service.getInfo();
  res.json({ ok: true, data });
});

const upsert = asyncHandler(async (req, res) => {
  const data = await service.upsertInfo(req.body || {});
  res.json({ ok: true, data });
});

const remove = asyncHandler(async (_req, res) => {
  const data = await service.deleteInfo();
  res.json({ ok: true, data });
});

module.exports = {
  get,
  upsert,
  remove,
};
