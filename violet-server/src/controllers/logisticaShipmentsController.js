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
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data =
    await cargoShipmentLogisticaService.returnShipmentToSellerForLogistica(
      req.logisticaId,
      req.params.shipmentId,
      body,
    );
  res.json({ ok: true, data });
});

const listCargoReturnsBoard = asyncHandler(async (req, res) => {
  const cargoReturnRequestService = require("../services/cargoShipments/cargoReturnRequestService");
  const data =
    await cargoReturnRequestService.listCargoReturnsBoardForLogistica(
      req.logisticaId,
      req.query || {},
    );
  res.json({ ok: true, data });
});

const listCargoHistory = asyncHandler(async (req, res) => {
  const cargoLogisticaHistoryService = require("../services/cargoShipments/cargoLogisticaHistoryService");
  const data = await cargoLogisticaHistoryService.listHistoryForLogistica(
    req.logisticaId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const getCargoHistoryBalance = asyncHandler(async (req, res) => {
  const cargoLogisticaBalanceService = require("../services/cargoShipments/cargoLogisticaBalanceService");
  const data = await cargoLogisticaBalanceService.getBalanceForLogistica(
    req.logisticaId,
    req.query || {},
  );
  res.json({ ok: true, data });
});

const confirmCargoReturn = asyncHandler(async (req, res) => {
  const cargoReturnRequestService = require("../services/cargoShipments/cargoReturnRequestService");
  const data = await cargoReturnRequestService.confirmCargoReturnByLogistica(
    req.logisticaId,
    req.params.requestId,
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

const arriveUzWarehouse = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data =
    await cargoShipmentLogisticaService.arriveShipmentAtUzWarehouseForLogistica(
      req.logisticaId,
      req.params.shipmentId,
      body,
    );
  res.json({ ok: true, data });
});

module.exports = {
  listPendingShipments,
  listAcceptedShipments,
  listUzWarehouseShipments,
  listCargoReturnsBoard,
  listCargoHistory,
  getCargoHistoryBalance,
  getShipmentDetail,
  acceptShipment,
  updateProcessStep,
  arriveUzWarehouse,
  returnShipmentToSeller,
  confirmCargoReturn,
  markShipmentPaid,
};
