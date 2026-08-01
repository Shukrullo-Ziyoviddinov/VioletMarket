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
  "/delivery/orders/accept-group",
  deliveryAuthMiddleware,
  deliveryOrdersController.acceptOrderGroup,
);

router.post(
  "/delivery/orders/pickup",
  deliveryAuthMiddleware,
  deliveryOrdersController.pickUpOrder,
);

router.post(
  "/delivery/orders/advance",
  deliveryAuthMiddleware,
  deliveryOrdersController.advanceOrderStep,
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

router.post(
  "/delivery/orders/return/confirm-reason",
  deliveryAuthMiddleware,
  deliveryOrdersController.confirmReturnReason,
);

router.post(
  "/delivery/orders/return/advance",
  deliveryAuthMiddleware,
  deliveryOrdersController.advanceReturnStep,
);

router.post(
  "/delivery/orders/return/complete",
  deliveryAuthMiddleware,
  deliveryOrdersController.completeReturn,
);

module.exports = router;
