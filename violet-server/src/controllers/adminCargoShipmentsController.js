const { asyncHandler } = require("../utils/asyncHandler");
const adminCargoShipmentsService = require("../services/adminCargoShipments/adminCargoShipmentsService");

const listCountries = asyncHandler(async (_req, res) => {
  const data = await adminCargoShipmentsService.listAdminCargoShipmentCountries();
  res.json({ ok: true, data });
});

const listShipments = asyncHandler(async (req, res) => {
  const data = await adminCargoShipmentsService.listAdminCargoShipments(req.query || {});
  res.json({ ok: true, data });
});

const getShipmentDetail = asyncHandler(async (req, res) => {
  const data = await adminCargoShipmentsService.getAdminCargoShipmentDetail(
    req.params.shipmentId,
  );
  res.json({ ok: true, data });
});

const updateProcessStep = asyncHandler(async (req, res) => {
  const data =
    await adminCargoShipmentsService.updateAdminCargoShipmentProcessStep(
      req.params.shipmentId,
      req.body?.processStep,
    );
  res.json({ ok: true, data });
});

const arriveUzWarehouse = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const data =
    await adminCargoShipmentsService.arriveAdminCargoShipmentUzWarehouse(
      req.params.shipmentId,
      body,
    );
  res.json({ ok: true, data });
});

const markPaid = asyncHandler(async (req, res) => {
  const data = await adminCargoShipmentsService.markAdminCargoShipmentPaid(
    req.params.shipmentId,
  );
  res.json({ ok: true, data });
});

module.exports = {
  listCountries,
  listShipments,
  getShipmentDetail,
  updateProcessStep,
  arriveUzWarehouse,
  markPaid,
};
