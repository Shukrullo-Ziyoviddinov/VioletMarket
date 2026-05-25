const { asyncHandler } = require("../utils/asyncHandler");
const {
  getFlashSaleRules,
  updateFlashSaleRules,
} = require("../services/flashSale/flashSaleRuleConfigService");

const getConfig = asyncHandler(async (req, res) => {
  const data = await getFlashSaleRules();
  res.json({ ok: true, data });
});

const updateConfig = asyncHandler(async (req, res) => {
  const data = await updateFlashSaleRules(req.body || {});
  res.json({ ok: true, data });
});

module.exports = {
  getConfig,
  updateConfig,
};
