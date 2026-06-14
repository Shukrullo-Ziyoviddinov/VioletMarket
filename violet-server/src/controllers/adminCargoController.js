const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminCargoService");

const list = asyncHandler(async (req, res) => {
  const data = await service.listCargoAdminData();
  res.json({ ok: true, data });
});

const createCargoRate = asyncHandler(async (req, res) => {
  const row = await service.createCargoRate(req.body || {});
  res.status(201).json({ ok: true, data: row });
});

const updateCargoRate = asyncHandler(async (req, res) => {
  const row = await service.updateCargoRate(req.params.key, req.body || {});
  res.json({ ok: true, data: row });
});

const removeCargoRate = asyncHandler(async (req, res) => {
  await service.deleteCargoRate(req.params.key);
  res.json({ ok: true });
});

const createDeliveryPrice = asyncHandler(async (req, res) => {
  const row = await service.createDeliveryPrice(req.body || {});
  res.status(201).json({ ok: true, data: row });
});

const updateDeliveryPrice = asyncHandler(async (req, res) => {
  const row = await service.updateDeliveryPrice(req.params.key, req.body || {});
  res.json({ ok: true, data: row });
});

const removeDeliveryPrice = asyncHandler(async (req, res) => {
  await service.deleteDeliveryPrice(req.params.key);
  res.json({ ok: true });
});

module.exports = {
  list,
  createCargoRate,
  updateCargoRate,
  removeCargoRate,
  createDeliveryPrice,
  updateDeliveryPrice,
  removeDeliveryPrice,
};
