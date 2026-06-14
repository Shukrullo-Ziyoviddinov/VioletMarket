const { asyncHandler } = require("../utils/asyncHandler");
const adminVideoBannerService = require("../services/adminVideoBannerService");

const list = asyncHandler(async (req, res) => {
  const banners = await adminVideoBannerService.listBanners();
  res.json({ ok: true, data: { banners } });
});

const create = asyncHandler(async (req, res) => {
  const banner = await adminVideoBannerService.createBanner(req.body || {});
  res.status(201).json({ ok: true, data: banner });
});

const update = asyncHandler(async (req, res) => {
  const banner = await adminVideoBannerService.updateBanner(req.params.bannerId, req.body || {});
  res.json({ ok: true, data: banner });
});

const remove = asyncHandler(async (req, res) => {
  await adminVideoBannerService.deleteBanner(req.params.bannerId);
  res.json({ ok: true });
});

module.exports = {
  list,
  create,
  update,
  remove,
};
