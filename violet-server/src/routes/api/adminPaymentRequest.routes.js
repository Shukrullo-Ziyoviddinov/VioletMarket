const express = require("express");
const controller = require("../../controllers/adminPaymentRequestController");

const router = express.Router();

router.get("/admin/payment-requests/stats", controller.getPaymentRequestStats);
router.get("/admin/payment-requests/rejected-products", controller.listRejectedProducts);
router.get("/admin/payment-requests/seller-options", controller.getPaymentRequestSellerOptions);
router.get("/admin/payment-requests", controller.listPaymentRequests);
router.get("/admin/payment-requests/:paymentRequestId", controller.getPaymentRequestDetail);
router.post("/admin/payment-requests/:paymentRequestId/approve", controller.approvePaymentRequest);
router.post("/admin/payment-requests/:paymentRequestId/reject", controller.rejectPaymentRequest);

module.exports = router;
