const { Product } = require("../models");
const { SellerAccount } = require("../models/sellerAccount");
const { resolvePublicAssetUrl } = require("../utils/resolvePublicAssetUrl");

function keepNewestProductPerId(products) {
  const seen = new Set();
  const unique = [];

  for (const product of Array.isArray(products) ? products : []) {
    const key = String(product?.id ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }

  return unique;
}

function getTodayRange(referenceDate = new Date()) {
  const start = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function countAddedToday(products) {
  const { start, end } = getTodayRange();

  return products.filter((product) => {
    const createdAt = product._id?.getTimestamp?.();
    if (!createdAt) return false;
    return createdAt >= start && createdAt < end;
  }).length;
}

function mapSellerForAdmin(seller) {
  if (!seller) return null;

  const logo = seller.logo || "";

  return {
    id: seller.id,
    name: seller.name,
    logo,
    logoUrl: resolvePublicAssetUrl(logo),
  };
}

function mapProductCard(product, sellerMap) {
  const firstColor = Array.isArray(product.colors) ? product.colors[0] : null;
  const sellerId = String(product.sellerId || "").trim();
  const image = product.image || product.mainImage || firstColor?.mainImage || "";

  return {
    id: product.id,
    title: product.title,
    price: firstColor?.price || product.price || "",
    originalPrice: firstColor?.originalPrice || product.originalPrice || "",
    image,
    imageUrl: resolvePublicAssetUrl(image),
    sellerId: sellerId || null,
    seller: sellerId ? mapSellerForAdmin(sellerMap.get(sellerId)) : null,
  };
}

async function buildSellerMap() {
  const sellers = await SellerAccount.find()
    .select({ id: 1, name: 1, logo: 1 })
    .lean();

  return new Map(sellers.map((seller) => [seller.id, seller]));
}

async function listProductsForAdmin() {
  const [rows, sellerMap] = await Promise.all([
    Product.find()
      .select({
        id: 1,
        title: 1,
        price: 1,
        originalPrice: 1,
        image: 1,
        mainImage: 1,
        colors: 1,
        sellerId: 1,
      })
      .sort({ _id: -1 })
      .lean(),
    buildSellerMap(),
  ]);

  return keepNewestProductPerId(rows).map((product) => mapProductCard(product, sellerMap));
}

async function getProductStats() {
  const rows = await Product.find().select({ id: 1, _id: 1 }).sort({ _id: -1 }).lean();
  const unique = keepNewestProductPerId(rows);

  return {
    total: unique.length,
    addedToday: countAddedToday(unique),
  };
}

module.exports = {
  listProductsForAdmin,
  getProductStats,
};
