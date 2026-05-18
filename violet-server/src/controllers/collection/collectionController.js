const collectionService = require("../../services/collection/collectionService");
const { asyncHandler } = require("../../utils/asyncHandler");

const getProducts = asyncHandler(async (req, res) => {
  const data = await collectionService.getCollectionProducts(
    req.params.categoryName,
    req.query,
  );
  res.json({ ok: true, ...data });
});

module.exports = {
  getProducts,
};
