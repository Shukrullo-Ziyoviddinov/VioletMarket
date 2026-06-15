const { Product } = require("../models");

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

function mapProductCard(product) {
  const firstColor = Array.isArray(product.colors) ? product.colors[0] : null;

  return {
    id: product.id,
    title: product.title,
    price: firstColor?.price || product.price || "",
    originalPrice: firstColor?.originalPrice || product.originalPrice || "",
    image: product.image || product.mainImage || firstColor?.mainImage || "",
  };
}

async function listProductsForAdmin() {
  const rows = await Product.find()
    .select({
      id: 1,
      title: 1,
      price: 1,
      originalPrice: 1,
      image: 1,
      mainImage: 1,
      colors: 1,
    })
    .sort({ _id: -1 })
    .lean();

  return keepNewestProductPerId(rows).map(mapProductCard);
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
