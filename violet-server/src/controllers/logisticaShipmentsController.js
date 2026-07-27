const { asyncHandler } = require("../utils/asyncHandler");
const cargoShipmentLogisticaService = require("../services/cargoShipments/cargoShipmentLogisticaService");

const listPendingShipments = asyncHandler(async (req, res) => {
  const data = await cargoShipmentLogisticaService.listPendingShipmentsForLogistica(
    req.logisticaId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const getShipmentDetail = asyncHandler(async (req, res) => {
  const data = await cargoShipmentLogisticaService.getShipmentDetailForLogistica(
    req.logisticaId,
    req.params.shipmentId,
  );
  res.json({ ok: true, data });
});

module.exports = {
  listPendingShipments,
  getShipmentDetail,
};
