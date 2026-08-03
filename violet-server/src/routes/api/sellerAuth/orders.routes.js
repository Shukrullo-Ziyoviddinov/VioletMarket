const express = require("express");
const { sellerAuthMiddleware } = require("../../../middleware/sellerAuthMiddleware");
const sellerOrdersController = require("../../../controllers/sellerOrdersController");

const router = express.Router();

router.get(
  "/seller-auth/orders",
  sellerAuthMiddleware,
  sellerOrdersController.listOrders,
);
router.get(
  "/seller-auth/cargo-warehouse-contacts",
  sellerAuthMiddleware,
  sellerOrdersController.listCargoWarehouseContacts,
);
router.patch(
  "/seller-auth/orders/:orderId/items/:itemIndex/confirm",
  sellerAuthMiddleware,
  sellerOrdersController.confirmOrderItem,
);
router.patch(
  "/seller-auth/orders/:orderId/items/:itemIndex/collect",
  sellerAuthMiddleware,
  sellerOrdersController.collectOrderItem,
);
router.patch(
  "/seller-auth/orders/:orderId/items/:itemIndex/handoff",
  sellerAuthMiddleware,
  sellerOrdersController.handoffOrderItem,
);
router.patch(
  "/seller-auth/orders/:orderId/confirm-group",
  sellerAuthMiddleware,
  sellerOrdersController.confirmOrderGroup,
);
router.patch(
  "/seller-auth/orders/:orderId/collect-group",
  sellerAuthMiddleware,
  sellerOrdersController.collectOrderGroup,
);
router.patch(
  "/seller-auth/orders/:orderId/handoff-group",
  sellerAuthMiddleware,
  sellerOrdersController.handoffOrderGroup,
);
router.patch(
  "/seller-auth/orders/:orderId/items/:itemIndex/submit-to-cargo",
  sellerAuthMiddleware,
  sellerOrdersController.submitToCargo,
);
router.patch(
  "/seller-auth/orders/:orderId/submit-to-cargo-group",
  sellerAuthMiddleware,
  sellerOrdersController.submitToCargoGroup,
);
router.patch(
  "/seller-auth/orders/:orderId/items/:itemIndex/cancel",
  sellerAuthMiddleware,
  sellerOrdersController.cancelOrderItem,
);
router.patch(
  "/seller-auth/orders/:orderId/cancel-group",
  sellerAuthMiddleware,
  sellerOrdersController.cancelOrderGroup,
);
router.patch(
  "/seller-auth/orders/:orderId/items/:itemIndex/unavailable",
  sellerAuthMiddleware,
  sellerOrdersController.markUnavailableOrderItem,
);

module.exports = router;
