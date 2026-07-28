const express = require("express");
const controller = require("../../controllers/logisticaShipmentsController");
const {
  logisticaAuthMiddleware,
} = require("../../middleware/logisticaAuthMiddleware");

const router = express.Router();

router.get(
  "/logistica-auth/shipments",
  logisticaAuthMiddleware,
  controller.listPendingShipments,
);

router.get(
  "/logistica-auth/shipments/accepted",
  logisticaAuthMiddleware,
  controller.listAcceptedShipments,
);

router.get(
  "/logistica-auth/shipments/uzb-warehouse",
  logisticaAuthMiddleware,
  controller.listUzWarehouseShipments,
);

router.get(
  "/logistica-auth/shipments/:shipmentId",
  logisticaAuthMiddleware,
  controller.getShipmentDetail,
);

router.post(
  "/logistica-auth/shipments/:shipmentId/accept",
  logisticaAuthMiddleware,
  controller.acceptShipment,
);

router.patch(
  "/logistica-auth/shipments/:shipmentId/process-step",
  logisticaAuthMiddleware,
  controller.updateProcessStep,
);

router.post(
  "/logistica-auth/shipments/:shipmentId/return-to-seller",
  logisticaAuthMiddleware,
  controller.returnShipmentToSeller,
);

router.post(
  "/logistica-auth/shipments/:shipmentId/mark-paid",
  logisticaAuthMiddleware,
  controller.markShipmentPaid,
);

module.exports = router;
