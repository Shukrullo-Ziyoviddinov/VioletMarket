const express = require("express");
const controller = require("../../controllers/logisticaShipmentsController");
const {
  logisticaAuthMiddleware,
} = require("../../middleware/logisticaAuthMiddleware");

const router = express.Router();

/** Asosiy sahifa — pending so‘rovlar */
router.get(
  "/logistica-auth/shipments",
  logisticaAuthMiddleware,
  controller.listPendingShipments,
);

/** Detail */
router.get(
  "/logistica-auth/shipments/:shipmentId",
  logisticaAuthMiddleware,
  controller.getShipmentDetail,
);

module.exports = router;
