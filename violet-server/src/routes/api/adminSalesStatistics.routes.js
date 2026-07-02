const express = require("express");
const controller = require("../../controllers/adminSalesStatisticsController");

const router = express.Router();

router.get("/admin/sales/dashboard-stats", controller.getSalesDashboardStats);
router.get("/admin/sales/statistics", controller.getSalesStatistics);
router.get("/admin/sales/revenue-chart", controller.getSalesRevenueChart);

module.exports = router;
