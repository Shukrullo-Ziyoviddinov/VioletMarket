const express = require("express");
const { deliveryAuthMiddleware } = require("../../middleware/deliveryAuthMiddleware");
const deliveryOrdersController = require("../../controllers/deliveryOrdersController");

const router = express.Router();

router.get(
  "/delivery/orders/available",
  deliveryAuthMiddleware,
  deliveryOrdersController.listAvailableOrders,
);

module.exports = router;
