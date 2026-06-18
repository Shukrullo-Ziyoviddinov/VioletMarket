const express = require("express");
const controller = require("../../controllers/adminCustomerStatisticsController");

const router = express.Router();

router.get("/admin/customers/dashboard-stats", controller.getCustomerDashboardStats);
router.get("/admin/customers/statistics", controller.getCustomerStatistics);

module.exports = router;
