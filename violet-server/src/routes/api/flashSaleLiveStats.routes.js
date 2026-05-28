const express = require("express");
const controller = require("../../controllers/flashSaleLiveStatsController");

const router = express.Router();

router.get("/flash-sale/live-stats", controller.getStats);

module.exports = router;
