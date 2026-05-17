const tavsiyaEtamizService = require("../../services/tavsiyaEtamiz/tavsiyaEtamizService");
const { asyncHandler } = require("../../utils/asyncHandler");

const forProductDetail = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { limit } = req.query;
  const data = await tavsiyaEtamizService.getForProductDetail(
    req.userId || null,
    productId,
    limit,
  );
  res.json({ ok: true, ...data });
});

const byHistory = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const data = await tavsiyaEtamizService.getByViewingHistory(req.userId, limit);
  res.json({ ok: true, ...data });
});

module.exports = {
  forProductDetail,
  byHistory,
};
