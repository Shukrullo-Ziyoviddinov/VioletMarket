const express = require("express");
const controller = require("../../controllers/adminCargoFeePaymentsController");

const router = express.Router();

router.get("/admin/cargo-fee-payments", controller.listPayments);
router.get(
  "/admin/cargo-fee-payments/:shipmentId",
  controller.getPaymentDetail,
);
router.post(
  "/admin/cargo-fee-payments/:shipmentId/confirm",
  controller.confirmPayment,
);

module.exports = router;
