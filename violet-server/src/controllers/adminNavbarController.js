const { asyncHandler } = require("../utils/asyncHandler");
const adminNavbarService = require("../services/adminNavbarService");

const list = asyncHandler(async (req, res) => {
  const sections = await adminNavbarService.listSections();
  res.json({ ok: true, data: { sections } });
});

const createSection = asyncHandler(async (req, res) => {
  const section = await adminNavbarService.createSection(req.body || {});
  res.status(201).json({ ok: true, data: section });
});

const updateSection = asyncHandler(async (req, res) => {
  const section = await adminNavbarService.updateSection(req.params.sectionId, req.body || {});
  res.json({ ok: true, data: section });
});

const deleteSection = asyncHandler(async (req, res) => {
  await adminNavbarService.deleteSection(req.params.sectionId);
  res.json({ ok: true });
});

const createItem = asyncHandler(async (req, res) => {
  const section = await adminNavbarService.createItem(req.params.sectionId, req.body || {});
  res.status(201).json({ ok: true, data: section });
});

const updateItem = asyncHandler(async (req, res) => {
  const section = await adminNavbarService.updateItem(
    req.params.sectionId,
    req.params.itemId,
    req.body || {},
  );
  res.json({ ok: true, data: section });
});

const deleteItem = asyncHandler(async (req, res) => {
  const section = await adminNavbarService.deleteItem(req.params.sectionId, req.params.itemId);
  res.json({ ok: true, data: section });
});

module.exports = {
  list,
  createSection,
  updateSection,
  deleteSection,
  createItem,
  updateItem,
  deleteItem,
};
