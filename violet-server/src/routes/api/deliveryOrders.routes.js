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

router.get(
  "/delivery/orders/accepted/:id",
  deliveryAuthMiddleware,
  deliveryOrdersController.getAcceptedOrder,
);

router.get(
  "/delivery/orders/history",
  deliveryAuthMiddleware,
  deliveryOrdersController.listDeliveredHistory,
);

router.post(
  "/delivery/orders/accept",
  deliveryAuthMiddleware,
  deliveryOrdersController.acceptOrder,
);

router.post(
  "/delivery/orders/deliver",
  deliveryAuthMiddleware,
  deliveryOrdersController.deliverOrder,
);

router.post(
  "/delivery/orders/return",
  deliveryAuthMiddleware,
  deliveryOrdersController.returnOrder,
);

module.exports = router;
