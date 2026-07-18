const express = require("express");
const controller = require("../../controllers/adminCourierController");

const router = express.Router();

router.get("/admin/couriers", controller.listCouriers);
router.post("/admin/couriers/:id/approve", controller.approveCourier);
router.post("/admin/couriers/:id/reject", controller.rejectCourier);
router.delete("/admin/couriers/:id", controller.deleteCourier);

module.exports = router;
