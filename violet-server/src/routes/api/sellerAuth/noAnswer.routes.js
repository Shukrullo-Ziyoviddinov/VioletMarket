const express = require("express");
const { sellerAuthMiddleware } = require("../../../middleware/sellerAuthMiddleware");
const sellerOrdersController = require("../../../controllers/sellerOrdersController");

const router = express.Router();

router.post(
  "/seller-auth/orders/no-answer/:returnedOrderId/re-handoff",
  sellerAuthMiddleware,
  sellerOrdersController.reHandoffNoAnswer,
);
router.post(
  "/seller-auth/orders/no-answer/:returnedOrderId/reactivate",
  sellerAuthMiddleware,
  sellerOrdersController.reactivateNoAnswer,
);
router.post(
  "/seller-auth/orders/no-answer/:returnedOrderId/deliver",
  sellerAuthMiddleware,
  sellerOrdersController.deliverNoAnswer,
);

module.exports = router;
