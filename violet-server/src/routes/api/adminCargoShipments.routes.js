const express = require("express");
const controller = require("../../controllers/adminCargoShipmentsController");

const router = express.Router();

router.get("/admin/cargo-shipments/countries", controller.listCountries);
router.get("/admin/cargo-shipments", controller.listShipments);
router.get("/admin/cargo-shipments/:shipmentId", controller.getShipmentDetail);
router.patch(
  "/admin/cargo-shipments/:shipmentId/process-step",
  controller.updateProcessStep,
);
router.post(
  "/admin/cargo-shipments/:shipmentId/uz-arrival",
  controller.arriveUzWarehouse,
);
router.post(
  "/admin/cargo-shipments/:shipmentId/mark-paid",
  controller.markPaid,
);

module.exports = router;
