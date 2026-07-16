const { asyncHandler } = require("../utils/asyncHandler");
const { listSellerOrders } = require("../productManagement/sellerOrders");

const listOrders = asyncHandler(async (req, res) => {
  const data = await listSellerOrders(req.sellerShopId, req.query || {});
  res.json({ ok: true, data });
});

module.exports = {
  listOrders,
};
