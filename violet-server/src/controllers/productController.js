const productService = require("../services/productService");

async function list(req, res) {
  const products = await productService.findAll();
  res.json(products);
}

async function getById(req, res) {
  const product = await productService.findByProductId(req.params.id);
  if (!product) {
    res.status(404).json({ error: "Mahsulot topilmadi" });
    return;
  }
  res.json(product);
}

module.exports = {
  list,
  getById,
};
