const express = require("express");
const userOrderTrackingController = require("../../controllers/userOrderTrackingController");
const { authMiddleware } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/orders/my",
  authMiddleware,
  userOrderTrackingController.listMyOrders,
);

router.get(
  "/orders/my/uzb",
  authMiddleware,
  userOrderTrackingController.listMyUzbOrders,
);

router.get(
  "/orders/my/cargo-fee/:shipmentId",
  authMiddleware,
  userOrderTrackingController.getMyCargoFeePayment,
);

router.post(
  "/orders/my/cargo-fee/:shipmentId/pay",
  authMiddleware,
  userOrderTrackingController.payMyCargoFee,
);

module.exports = router;
