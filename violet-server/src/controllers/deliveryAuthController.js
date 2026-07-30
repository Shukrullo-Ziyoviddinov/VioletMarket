const { asyncHandler } = require("../utils/asyncHandler");
const deliveryAuthService = require("../services/deliveryAuth/deliveryAuthService");

const startEmailAuth = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.startEmailAuth(req.body || {});
  res.json({ ok: true, data });
});

const sendRegistrationCode = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.sendRegistrationCode(req.body || {});
  res.json({ ok: true, data });
});

const verifyLogin = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.verifyLogin(req.body || {});
  res.json({ ok: true, data });
});

const completeRegistration = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.completeRegistration(req.body || {});
  res.status(201).json({ ok: true, data });
});

const getApprovalStatus = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.getApprovalStatus(req.body || {});
  res.json({ ok: true, data });
});

const getProfile = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.getProfile(req.deliveryId);
  res.json({ ok: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.updateProfile(
    req.deliveryId,
    req.body || {},
  );
  res.json({ ok: true, data });
});

const updateProfilePhoto = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.updateProfilePhoto(
    req.deliveryId,
    req.body || {},
  );
  res.json({ ok: true, data });
});

const updateTransport = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.updateTransport(
    req.deliveryId,
    req.body || {},
  );
  res.json({ ok: true, data });
});

const updateRegion = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.updateRegion(
    req.deliveryId,
    req.body || {},
  );
  res.json({ ok: true, data });
});

const listRegions = asyncHandler(async (_req, res) => {
  const data = deliveryAuthService.listDeliveryRegions();
  res.json({ ok: true, data });
});

module.exports = {
  startEmailAuth,
  sendRegistrationCode,
  verifyLogin,
  completeRegistration,
  getApprovalStatus,
  getProfile,
  updateProfile,
  updateProfilePhoto,
  updateTransport,
  updateRegion,
  listRegions,
};
