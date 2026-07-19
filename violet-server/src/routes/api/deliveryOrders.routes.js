const express = require("express");
const { deliveryAuthMiddleware } = require("../../middleware/deliveryAuthMiddleware");
const deliveryOrdersController = require("../../controllers/deliveryOrdersController");

const router = express.Router();

router.get(
  "/delivery/orders/available",
  deliveryAuthMiddleware,
  deliveryOrdersController.listAvailableOrders,
);

router.get(
  "/delivery/orders/accepted",
  deliveryAuthMiddleware,
  deliveryOrdersController.listAcceptedOrders,
);

router.post(
  "/delivery/orders/accept",
  deliveryAuthMiddleware,
  deliveryOrdersController.acceptOrder,
);

module.exports = router;
