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

module.exports = {
  listCountries,
  listShipments,
  getShipmentDetail,
  updateProcessStep,
};
