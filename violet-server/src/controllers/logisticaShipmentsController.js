const { asyncHandler } = require("../utils/asyncHandler");
const cargoShipmentLogisticaService = require("../services/cargoShipments/cargoShipmentLogisticaService");

const listPendingShipments = asyncHandler(async (req, res) => {
  const data = await cargoShipmentLogisticaService.listPendingShipmentsForLogistica(
    req.logisticaId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const listAcceptedShipments = asyncHandler(async (req, res) => {
  const data =
    await cargoShipmentLogisticaService.listAcceptedShipmentsForLogistica(
      req.logisticaId,
      req.query || {},
    );
  res.json({ ok: true, data });
});

const listUzWarehouseShipments = asyncHandler(async (req, res) => {
  const data =
    await cargoShipmentLogisticaService.listUzWarehouseShipmentsForLogistica(
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

const acceptShipment = asyncHandler(async (req, res) => {
  const data = await cargoShipmentLogisticaService.acceptShipmentForLogistica(
    req.logisticaId,
    req.params.shipmentId,
  );
  res.json({ ok: true, data });
});

const updateProcessStep = asyncHandler(async (req, res) => {
  const data =
    await cargoShipmentLogisticaService.updateShipmentProcessStepForLogistica(
      req.logisticaId,
      req.params.shipmentId,
      req.body?.processStep,
    );
  res.json({ ok: true, data });
});

const returnShipmentToSeller = asyncHandler(async (req, res) => {
  const data =
    await cargoShipmentLogisticaService.returnShipmentToSellerForLogistica(
      req.logisticaId,
      req.params.shipmentId,
    );
  res.json({ ok: true, data });
});

const markShipmentPaid = asyncHandler(async (req, res) => {
  const data = await cargoShipmentLogisticaService.markShipmentPaidForLogistica(
    req.logisticaId,
    req.params.shipmentId,
  );
  res.json({ ok: true, data });
});

module.exports = {
  listPendingShipments,
  listAcceptedShipments,
  listUzWarehouseShipments,
  getShipmentDetail,
  acceptShipment,
  updateProcessStep,
  returnShipmentToSeller,
  markShipmentPaid,
};
