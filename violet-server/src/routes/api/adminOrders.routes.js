const express = require("express");
const controller = require("../../controllers/adminOrdersController");

const router = express.Router();

router.get("/admin/orders", controller.listOrders);
router.get("/admin/orders/counts", controller.getOrderCounts);
router.patch(
  "/admin/orders/:orderId/items/:itemIndex/confirm",
  controller.confirmOrderItem,
);
router.patch(
  "/admin/orders/:orderId/items/:itemIndex/collect",
  controller.collectOrderItem,
);
router.patch(
  "/admin/orders/:orderId/items/:itemIndex/handoff",
  controller.handoffOrderItem,
);
router.patch(
  "/admin/orders/:orderId/items/:itemIndex/cancel",
  controller.cancelOrderItem,
);
router.post(
  "/admin/orders/no-answer/:returnedOrderId/re-handoff",
  controller.reHandoffNoAnswer,
);
router.post(
  "/admin/orders/no-answer/:returnedOrderId/reactivate",
  controller.reactivateNoAnswer,
);
router.post(
  "/admin/orders/no-answer/:returnedOrderId/deliver",
  controller.deliverNoAnswer,
);

module.exports = router;
