const { asyncHandler } = require("../utils/asyncHandler");
const adminUzWarehouseService = require("../services/adminUzWarehouseService");

const get = asyncHandler(async (req, res) => {
  const data = await adminUzWarehouseService.getWarehouseBanners();
  res.json({ ok: true, data });
});

const upsert = asyncHandler(async (req, res) => {
  const data = await adminUzWarehouseService.upsertWarehouseBanners(req.body || {});
  res.json({ ok: true, data });
});

const remove = asyncHandler(async (req, res) => {
  const data = await adminUzWarehouseService.deleteWarehouseBanner(req.params.slotKey);
  res.json({ ok: true, data });
});

module.exports = {
  get,
  upsert,
  remove,
};
