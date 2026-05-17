const flashSaleCountdownService = require("../../services/flashSaleCountdown/flashSaleCountdownService");
const { asyncHandler } = require("../../utils/asyncHandler");

const getForProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { durationHours } = req.query;
  const data = await flashSaleCountdownService.getForProduct(productId, durationHours);
  res.json({ ok: true, ...data });
});

const syncBatch = asyncHandler(async (req, res) => {
  const data = await flashSaleCountdownService.syncBatch(req.body?.items);
  res.json({ ok: true, ...data });
});

module.exports = {
  getForProduct,
  syncBatch,
};
