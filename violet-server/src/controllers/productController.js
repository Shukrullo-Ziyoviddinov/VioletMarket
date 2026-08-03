const productService = require("../services/productService");

async function list(req, res) {
  const products = await productService.findAll();
  res.json(products);
}

async function getById(req, res) {
  const product = await productService.findByProductId(req.params.id);
  if (!product) {
    res.status(404).json({
      ok: false,
      message: "Mahsulot topilmadi",
      code: "NOT_FOUND",
    });
    return;
  }
  res.json(product);
}

async function create(req, res) {
  const created = await productService.createProduct(req.body);
  res.status(201).json(created);
}

module.exports = {
  list,
  getById,
  create,
};
