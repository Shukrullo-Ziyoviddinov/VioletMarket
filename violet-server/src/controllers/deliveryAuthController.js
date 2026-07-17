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

const getProfile = asyncHandler(async (req, res) => {
  const data = await deliveryAuthService.getProfile(req.deliveryId);
  res.json({ ok: true, data });
});

module.exports = {
  startEmailAuth,
  sendRegistrationCode,
  verifyLogin,
  completeRegistration,
  getProfile,
};
