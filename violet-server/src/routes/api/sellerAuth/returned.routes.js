const express = require("express");
const { sellerAuthMiddleware } = require("../../../middleware/sellerAuthMiddleware");
const sellerOrdersController = require("../../../controllers/sellerOrdersController");
const sellerReturnedCategoryStatisticsController = require("../../../controllers/sellerReturnedCategoryStatisticsController");

const router = express.Router();

router.get(
  "/seller-auth/returned-orders",
  sellerAuthMiddleware,
  sellerOrdersController.listReturnedOrders,
);
router.get(
  "/seller-auth/returned-orders/category-statistics",
  sellerAuthMiddleware,
  sellerReturnedCategoryStatisticsController.getSellerCategoryReturnedStatistics,
);
router.get(
  "/seller-auth/returned-orders/country-category-statistics",
  sellerAuthMiddleware,
  sellerReturnedCategoryStatisticsController.getSellerCountryCategoryReturnedStatistics,
);
router.get(
  "/seller-auth/returned-orders/brand-category-statistics",
  sellerAuthMiddleware,
  sellerReturnedCategoryStatisticsController.getSellerBrandCategoryReturnedStatistics,
);

module.exports = router;
