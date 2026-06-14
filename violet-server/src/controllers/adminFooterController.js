const { asyncHandler } = require("../utils/asyncHandler");
const service = require("../services/adminFooterService");

const list = asyncHandler(async (req, res) => {
  const data = await service.listFooterData();
  res.json({ ok: true, data: { footerData: data } });
});

const createAboutSection = asyncHandler(async (req, res) => {
  const row = await service.createAboutSection(req.body || {});
  res.status(201).json({ ok: true, data: row });
});

const updateAboutSection = asyncHandler(async (req, res) => {
  const row = await service.updateAboutSection(req.params.sectionId, req.body || {});
  res.json({ ok: true, data: row });
});

const removeAboutSection = asyncHandler(async (req, res) => {
  await service.deleteAboutSection(req.params.sectionId);
  res.json({ ok: true });
});

const createSocial = asyncHandler(async (req, res) => {
  const row = await service.createSocial(req.body || {});
  res.status(201).json({ ok: true, data: row });
});

const updateSocial = asyncHandler(async (req, res) => {
  const row = await service.updateSocial(req.params.socialId, req.body || {});
  res.json({ ok: true, data: row });
});

const removeSocial = asyncHandler(async (req, res) => {
  await service.deleteSocial(req.params.socialId);
  res.json({ ok: true });
});

const createAppStore = asyncHandler(async (req, res) => {
  const row = await service.createAppStore(req.body || {});
  res.status(201).json({ ok: true, data: row });
});

const updateAppStore = asyncHandler(async (req, res) => {
  const row = await service.updateAppStore(req.params.appStoreId, req.body || {});
  res.json({ ok: true, data: row });
});

const removeAppStore = asyncHandler(async (req, res) => {
  await service.deleteAppStore(req.params.appStoreId);
  res.json({ ok: true });
});

module.exports = {
  list,
  createAboutSection,
  updateAboutSection,
  removeAboutSection,
  createSocial,
  updateSocial,
  removeSocial,
  createAppStore,
  updateAppStore,
  removeAppStore,
};
