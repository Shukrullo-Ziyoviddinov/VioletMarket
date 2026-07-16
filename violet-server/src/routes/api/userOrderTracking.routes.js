const express = require("express");
const userOrderTrackingController = require("../../controllers/userOrderTrackingController");
const { authMiddleware } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/orders/my/uzb",
  authMiddleware,
  userOrderTrackingController.listMyUzbOrders,
);

module.exports = router;
