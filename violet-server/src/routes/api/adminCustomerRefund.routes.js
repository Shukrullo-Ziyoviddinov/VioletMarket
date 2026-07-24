const express = require("express");
const controller = require("../../controllers/customerRefundController");

const router = express.Router();

router.get("/admin/customer-refunds", controller.listCustomerRefundRequests);
router.post("/admin/customer-refunds/:id/confirm", controller.confirmCustomerRefund);

module.exports = router;
