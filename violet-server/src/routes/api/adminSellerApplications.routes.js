const express = require("express");
const controller = require("../../controllers/adminSellerApplicationController");

const router = express.Router();

router.get("/admin/seller-applications", controller.listApplications);
router.post("/admin/seller-applications/:id/approve", controller.approveApplication);
router.post("/admin/seller-applications/:id/reject", controller.rejectApplication);

module.exports = router;
