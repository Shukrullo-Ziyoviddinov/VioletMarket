const express = require("express");
const controller = require("../../controllers/adminCourierController");

const router = express.Router();

router.get("/admin/couriers", controller.listCouriers);
router.get("/admin/courier-payment-tariffs", controller.getCourierPaymentSettings);
router.put("/admin/courier-payment-tariffs", controller.updateCourierPaymentSettings);
router.get("/admin/couriers/:id/accepted-orders", controller.listCourierAcceptedOrders);
router.patch(
  "/admin/courier-assignments/:assignmentId/payment",
  controller.updateCourierAssignmentPayment,
);
router.post("/admin/couriers/:id/approve", controller.approveCourier);
router.post("/admin/couriers/:id/reject", controller.rejectCourier);
router.delete("/admin/couriers/:id", controller.deleteCourier);

module.exports = router;
