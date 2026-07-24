const { asyncHandler } = require("../utils/asyncHandler");
const {
  buildSellerCategoryReturnedStatistics,
} = require("../services/sellerReturned/sellerCategoryReturnedStatisticsService");
const {
  buildSellerCountryCategoryReturnedStatistics,
} = require("../services/sellerReturned/sellerCountryCategoryReturnedStatisticsService");
const {
  buildSellerBrandCategoryReturnedStatistics,
} = require("../services/sellerReturned/sellerBrandCategoryReturnedStatisticsService");

const getSellerCategoryReturnedStatistics = asyncHandler(async (req, res) => {
  const data = await buildSellerCategoryReturnedStatistics(
    req.sellerShopId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const getSellerCountryCategoryReturnedStatistics = asyncHandler(async (req, res) => {
  const data = await buildSellerCountryCategoryReturnedStatistics(
    req.sellerShopId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const getSellerBrandCategoryReturnedStatistics = asyncHandler(async (req, res) => {
  const data = await buildSellerBrandCategoryReturnedStatistics(
    req.sellerShopId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

module.exports = {
  getSellerCategoryReturnedStatistics,
  getSellerCountryCategoryReturnedStatistics,
  getSellerBrandCategoryReturnedStatistics,
};
