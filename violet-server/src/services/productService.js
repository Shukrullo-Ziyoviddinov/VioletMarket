const { Product } = require("../models");

async function findAll() {
  return Product.find().lean();
}

async function findByProductId(id) {
  const num = Number(id);
  if (!Number.isFinite(num)) return null;
  /** Bir xil `id` nechta bo‘lsa — eng eski `_id` bo‘yicha bittasi */
  const rows = await Product.find({ id: num }).sort({ _id: 1 }).limit(1).lean();
  return rows[0] || null;
}

module.exports = {
  findAll,
  findByProductId,
};
