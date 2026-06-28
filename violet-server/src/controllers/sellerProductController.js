const { asyncHandler } = require("../utils/asyncHandler");
const formService = require("../services/sellerProduct/sellerProductFormService");
const productService = require("../services/sellerProduct/sellerProductService");

const getProductFormOptions = asyncHandler(async (req, res) => {
  const data = await formService.getSellerProductFormOptions();
  res.json({ ok: true, data });
});

const getRelatedProductPickerOptions = asyncHandler(async (req, res) => {
  const options = await formService.listSellerRelatedProductPickerOptions(req.sellerShopId);
  res.json({ ok: true, data: { options } });
});

const listSellerProducts = asyncHandler(async (req, res) => {
  const products = await productService.listSellerProducts(req.sellerShopId);
  res.json({ ok: true, data: { products } });
});

const getSellerProduct = asyncHandler(async (req, res) => {
  const product = await productService.getSellerProductById(req.sellerShopId, req.params.productId);
  res.json({ ok: true, data: { product } });
});

const createSellerProduct = asyncHandler(async (req, res) => {
  const product = await productService.createSellerProduct(req.sellerShopId, req.body || {});
  res.status(201).json({ ok: true, data: { product } });
});

const updateSellerProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateSellerProduct(
    req.sellerShopId,
    req.params.productId,
    req.body || {},
  );
  res.json({ ok: true, data: { product } });
});

const deleteSellerProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteSellerProduct(req.sellerShopId, req.params.productId);
  res.json({ ok: true, data: result });
});

module.exports = {
  getProductFormOptions,
  getRelatedProductPickerOptions,
  listSellerProducts,
  getSellerProduct,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
};
