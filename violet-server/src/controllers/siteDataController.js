const siteContentService = require("../services/siteContentService");

function notFound(res, message = "Ma'lumot topilmadi — avval npm run seed qiling") {
  res.status(404).json({
    ok: false,
    message,
    code: "NOT_FOUND",
  });
}

async function categories(req, res) {
  const data = await siteContentService.getCategories();
  if (!data) return notFound(res);
  res.json(data);
}

async function navbar(req, res) {
  const data = await siteContentService.getNavbar();
  if (!data) return notFound(res);
  res.json(data);
}

async function homeBanner(req, res) {
  const data = await siteContentService.getHomeBanner();
  if (!data) return notFound(res);
  res.json(data);
}

async function footer(req, res) {
  const data = await siteContentService.getFooter();
  if (!data) return notFound(res);
  res.json(data);
}

async function cargo(req, res) {
  const data = await siteContentService.getCargo();
  if (!data) return notFound(res);
  res.json(data);
}

async function videoBanner(req, res) {
  const data = await siteContentService.getVideoBanner();
  if (!data) return notFound(res);
  res.json(data);
}

async function sellers(req, res) {
  const data = await siteContentService.getSellers();
  if (!data) return notFound(res);
  res.json(data);
}

async function defaultProductPolicy(req, res) {
  const data = await siteContentService.getDefaultProductPolicy();
  if (!data) return notFound(res);
  res.json(data);
}

async function uzWarehouse(req, res) {
  const data = await siteContentService.getUzWarehouse();
  if (!data) return notFound(res);
  res.json(data);
}

async function uzbProductDeliveryInfo(req, res) {
  const data = await siteContentService.getUzbProductDeliveryInfo();
  res.json(data || { deliveryInfo: null });
}

async function sellerById(req, res) {
  const data = await siteContentService.getSellers();
  if (!data?.sellers) return notFound(res);
  const { sellerId } = req.params;
  const seller = data.sellers.find((s) => String(s.id) === String(sellerId));
  if (!seller) {
    return notFound(res, "Sotuvchi topilmadi");
  }
  res.json(seller);
}

const { DEFAULT_TOP_SELLERS_LIMIT } = require("../topSellers");

async function topSellers(req, res) {
  const limit = Number(req.query.limit) || DEFAULT_TOP_SELLERS_LIMIT;
  const data = await siteContentService.getTopSellers(limit);
  res.json(data);
}

/** @deprecated Use topSellers */
const topSillers = topSellers;

module.exports = {
  categories,
  navbar,
  homeBanner,
  footer,
  cargo,
  videoBanner,
  sellers,
  sellerById,
  topSellers,
  topSillers,
  defaultProductPolicy,
  uzWarehouse,
  uzbProductDeliveryInfo,
};
