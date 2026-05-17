const viewedAtService = require("../../services/viewedAt/viewedAtService");
const { asyncHandler } = require("../../utils/asyncHandler");

const listMine = asyncHandler(async (req, res) => {
  const data = await viewedAtService.listViewsForUser(req.userId);
  res.json({ ok: true, ...data });
});

const recordView = asyncHandler(async (req, res) => {
  const { productId } = req.body || {};
  const data = await viewedAtService.recordProductView(req.userId, productId);
  res.json({ ok: true, ...data });
});

module.exports = {
  listMine,
  recordView,
};
