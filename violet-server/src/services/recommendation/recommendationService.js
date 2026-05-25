const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const { getRelatedByTypeAndCountry } = require("../../utils/recommendationAlgorithm");

function keepNewestProductPerId(products) {
  const sortedByNewest = [...(Array.isArray(products) ? products : [])].sort((a, b) =>
    String(b?._id || "").localeCompare(String(a?._id || "")),
  );
  const seen = new Set();
  const unique = [];

  for (const product of sortedByNewest) {
    const key = String(product?.id ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }

  return unique;
}

async function loadAllProducts() {
  return keepNewestProductPerId(await Product.find().lean());
}

async function findProductById(rawId) {
  const productId = Number(rawId);
  if (!Number.isFinite(productId)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  const product = await Product.findOne({ id: productId }).sort({ _id: -1 }).lean();
  if (!product) {
    throw new HttpError(404, "Mahsulot topilmadi", "PRODUCT_NOT_FOUND");
  }
  return product;
}

/** O'xshash mahsulotlar — productType + productCountry (limit yo'q) */
async function getRelatedProducts(rawProductId) {
  const current = await findProductById(rawProductId);
  const all = await loadAllProducts();
  const products = getRelatedByTypeAndCountry(current, all);
  return { products };
}

module.exports = {
  getRelatedProducts,
};
