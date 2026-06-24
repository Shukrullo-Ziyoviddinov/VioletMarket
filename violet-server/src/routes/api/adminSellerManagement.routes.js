const express = require("express");
const controller = require("../../controllers/adminSellerManagementController");

const router = express.Router();

router.post("/admin/sellers/:shopId/pause", controller.pauseSeller);
router.post("/admin/sellers/:shopId/activate", controller.activateSeller);
router.delete("/admin/sellers/:shopId", controller.deleteSeller);

module.exports = router;
