const express = require("express");
const controller = require("../../controllers/courierReturnRequestController");

const router = express.Router();

router.get("/admin/return-requests", controller.listAdminReturnRequests);
router.post("/admin/return-requests/:id/approve", controller.approveAdminReturnRequest);
router.post("/admin/return-requests/:id/reject", controller.rejectAdminReturnRequest);

module.exports = router;
