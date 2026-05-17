const recommendationService = require("../../services/recommendation/recommendationService");
const { asyncHandler } = require("../../utils/asyncHandler");

/** O'xshash mahsulotlar — Recommended komponenti */
const related = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const data = await recommendationService.getRelatedProducts(productId);
  res.json({ ok: true, ...data });
});

module.exports = {
  related,
};
