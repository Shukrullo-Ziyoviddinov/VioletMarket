const { asyncHandler } = require("../utils/asyncHandler");
const adminHomeBannerService = require("../services/adminHomeBannerService");

const list = asyncHandler(async (req, res) => {
  const banners = await adminHomeBannerService.listBanners();
  res.json({ ok: true, data: { banners } });
});

const create = asyncHandler(async (req, res) => {
  const banner = await adminHomeBannerService.createBanner(req.body || {});
  res.status(201).json({ ok: true, data: banner });
});

const update = asyncHandler(async (req, res) => {
  const banner = await adminHomeBannerService.updateBanner(req.params.bannerId, req.body || {});
  res.json({ ok: true, data: banner });
});

const remove = asyncHandler(async (req, res) => {
  await adminHomeBannerService.deleteBanner(req.params.bannerId);
  res.json({ ok: true });
});

module.exports = {
  list,
  create,
  update,
  remove,
};
