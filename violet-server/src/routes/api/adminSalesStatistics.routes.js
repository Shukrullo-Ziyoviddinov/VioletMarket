const express = require("express");
const controller = require("../../controllers/adminSalesStatisticsController");

const router = express.Router();

router.get("/admin/sales/dashboard-stats", controller.getSalesDashboardStats);
router.get("/admin/sales/statistics", controller.getSalesStatistics);
router.get("/admin/sales/revenue-chart", controller.getSalesRevenueChart);
router.get("/admin/sales/top-sellers", controller.getTopSellersStatistics);
router.get("/admin/sales/top-selling-products", controller.getTopSellingProductsStatistics);
router.get("/admin/sales/seller-sold-products", controller.getSellerSoldProductsStatistics);
router.get("/admin/sales/seller-product-sale-dates", controller.getSellerProductSaleDates);
router.get("/admin/sales/product-selling-sellers", controller.getProductSellingSellersStatistics);
router.get("/admin/sales/category-statistics", controller.getCategorySalesStatistics);
router.get("/admin/sales/country-category-statistics", controller.getCountryCategorySalesStatistics);
router.get("/admin/sales/brand-category-statistics", controller.getBrandCategorySalesStatistics);

module.exports = router;
