const express = require("express");
const { sellerAuthMiddleware } = require("../../../middleware/sellerAuthMiddleware");
const sellerSalesStatisticsController = require("../../../controllers/sellerSalesStatisticsController");
const sellerEarningsController = require("../../../controllers/sellerEarningsController");
const sellerWithdrawalController = require("../../../controllers/sellerWithdrawalController");

const router = express.Router();

router.get(
  "/seller-auth/sales/statistics",
  sellerAuthMiddleware,
  sellerSalesStatisticsController.getSellerSalesStatistics,
);
router.get(
  "/seller-auth/sales/revenue-chart",
  sellerAuthMiddleware,
  sellerSalesStatisticsController.getSellerSalesRevenueChart,
);
router.get(
  "/seller-auth/sales/top-selling-products",
  sellerAuthMiddleware,
  sellerSalesStatisticsController.getSellerTopSellingProducts,
);
router.get(
  "/seller-auth/sales/category-statistics",
  sellerAuthMiddleware,
  sellerSalesStatisticsController.getSellerCategorySalesStatistics,
);
router.get(
  "/seller-auth/sales/country-category-statistics",
  sellerAuthMiddleware,
  sellerSalesStatisticsController.getSellerCountryCategorySalesStatistics,
);
router.get(
  "/seller-auth/sales/brand-category-statistics",
  sellerAuthMiddleware,
  sellerSalesStatisticsController.getSellerBrandCategorySalesStatistics,
);
router.get(
  "/seller-auth/earnings/summary",
  sellerAuthMiddleware,
  sellerEarningsController.getSellerEarningsSummary,
);
router.get(
  "/seller-auth/earnings/sold-items",
  sellerAuthMiddleware,
  sellerEarningsController.getSellerSoldItems,
);
router.post(
  "/seller-auth/earnings/withdrawal-requests",
  sellerAuthMiddleware,
  sellerEarningsController.submitSellerWithdrawalRequest,
);
router.get(
  "/seller-auth/withdrawals",
  sellerAuthMiddleware,
  sellerWithdrawalController.listSellerWithdrawals,
);

module.exports = router;
