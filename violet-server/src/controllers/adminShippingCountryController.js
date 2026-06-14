const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminShippingCountryService");

const list = asyncHandler(async (_req, res) => {
  const data = await service.listShippingCountries();
  res.json({ ok: true, data });
});

const create = asyncHandler(async (req, res) => {
  const row = await service.createShippingCountry(req.body || {});
  res.status(201).json({ ok: true, data: row });
});

const update = asyncHandler(async (req, res) => {
  const row = await service.updateShippingCountry(req.params.shippingCountryId, req.body || {});
  res.json({ ok: true, data: row });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteShippingCountry(req.params.shippingCountryId);
  res.json({ ok: true });
});

module.exports = {
  list,
  create,
  update,
  remove,
};
