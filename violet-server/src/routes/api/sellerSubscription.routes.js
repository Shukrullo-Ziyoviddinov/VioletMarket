const express = require("express");
const sellerSubscriptionController = require("../../controllers/sellerSubscription/sellerSubscriptionController");
const { authMiddleware } = require("../../middleware/authMiddleware");
const { optionalAuthMiddleware } = require("../../middleware/optionalAuthMiddleware");

const router = express.Router();

router.get(
  "/seller-subscriptions/seller/:sellerId",
  optionalAuthMiddleware,
  sellerSubscriptionController.getSellerStatus,
);
router.get(
  "/seller-subscriptions/me",
  authMiddleware,
  sellerSubscriptionController.getMySubscriptions,
);
router.post(
  "/seller-subscriptions/toggle",
  authMiddleware,
  sellerSubscriptionController.toggle,
);

module.exports = router;
