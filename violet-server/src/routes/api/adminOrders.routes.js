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

module.exports = router;
