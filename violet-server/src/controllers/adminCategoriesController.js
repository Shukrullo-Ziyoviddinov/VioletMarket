const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminCategoriesService");

const list = asyncHandler(async (req, res) => {
  const data = await service.listCategories();
  res.json({ ok: true, data });
});

const createCountry = asyncHandler(async (req, res) => {
  const country = await service.createCountryCategory(req.body || {});
  res.status(201).json({ ok: true, data: country });
});

const updateCountry = asyncHandler(async (req, res) => {
  const country = await service.updateCountryCategory(req.params.countryId, req.body || {});
  res.json({ ok: true, data: country });
});

const removeCountry = asyncHandler(async (req, res) => {
  await service.deleteCountryCategory(req.params.countryId);
  res.json({ ok: true });
});

const createBrand = asyncHandler(async (req, res) => {
  const brand = await service.createBrandCategory(req.body || {});
  res.status(201).json({ ok: true, data: brand });
});

const updateBrand = asyncHandler(async (req, res) => {
  const brand = await service.updateBrandCategory(req.params.brandId, req.body || {});
  res.json({ ok: true, data: brand });
});

const removeBrand = asyncHandler(async (req, res) => {
  await service.deleteBrandCategory(req.params.brandId);
  res.json({ ok: true });
});

module.exports = {
  list,
  createCountry,
  updateCountry,
  removeCountry,
  createBrand,
  updateBrand,
  removeBrand,
};
