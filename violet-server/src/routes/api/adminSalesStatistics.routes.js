const express = require("express");
const controller = require("../../controllers/adminSalesStatisticsController");

const router = express.Router();

router.get("/admin/sales/dashboard-stats", controller.getSalesDashboardStats);

module.exports = router;
