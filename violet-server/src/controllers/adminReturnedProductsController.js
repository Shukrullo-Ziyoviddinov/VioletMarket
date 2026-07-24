const { asyncHandler } = require("../utils/asyncHandler");
const {
  listAdminReturnedProducts,
} = require("../services/adminReturnedProducts/adminReturnedProductsService");

const listReturnedProducts = asyncHandler(async (req, res) => {
  const data = await listAdminReturnedProducts(req.query || {});
  res.json({ ok: true, data });
});

module.exports = {
  listReturnedProducts,
};
