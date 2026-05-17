const { Product } = require("../../models/product");
const { HttpError } = require("../../utils/httpError");
const { getRelatedByTypeAndCountry } = require("../../utils/recommendationAlgorithm");

async function loadAllProducts() {
  return Product.find().lean();
}

async function findProductById(rawId) {
  const productId = Number(rawId);
  if (!Number.isFinite(productId)) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  const product = await Product.findOne({ id: productId }).lean();
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
