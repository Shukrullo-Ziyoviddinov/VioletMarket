const siteContentService = require("../services/siteContentService");

function notFound(res) {
  res.status(404).json({ error: "Ma'lumot topilmadi — avval npm run seed qiling" });
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

async function sellerById(req, res) {
  const data = await siteContentService.getSellers();
  if (!data?.sellers) return notFound(res);
  const { sellerId } = req.params;
  const seller = data.sellers.find((s) => String(s.id) === String(sellerId));
  if (!seller) {
    res.status(404).json({ error: "Sotuvchi topilmadi" });
    return;
  }
  res.json(seller);
}

module.exports = {
  categories,
  navbar,
  homeBanner,
  footer,
  cargo,
  videoBanner,
  sellers,
  sellerById,
  defaultProductPolicy,
  uzWarehouse,
};
