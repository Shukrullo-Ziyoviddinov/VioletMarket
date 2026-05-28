const { asyncHandler } = require("../utils/asyncHandler");
const { getLiveStats } = require("../services/flashSale/flashSaleLiveStatsService");

const getStats = asyncHandler(async (req, res) => {
  const data = await getLiveStats();
  res.json({ ok: true, data });
});

module.exports = {
  getStats,
};
