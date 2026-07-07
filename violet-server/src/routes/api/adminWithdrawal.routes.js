const express = require("express");
const controller = require("../../controllers/adminWithdrawalController");

const router = express.Router();

router.get("/admin/withdrawals/stats", controller.getWithdrawalStats);
router.get("/admin/withdrawals/seller-options", controller.getWithdrawalSellerOptions);
router.get("/admin/withdrawals", controller.listWithdrawals);

module.exports = router;
