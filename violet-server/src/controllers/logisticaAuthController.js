const { asyncHandler } = require("../utils/asyncHandler");
const logisticaAuthService = require("../services/logisticaAuth/logisticaAuthService");

const sendRegistrationCode = asyncHandler(async (req, res) => {
  const data = await logisticaAuthService.sendRegistrationCode(req.body || {});
  res.json({ ok: true, data });
});

const completeRegistration = asyncHandler(async (req, res) => {
  const data = await logisticaAuthService.completeRegistration(req.body || {});
  res.status(201).json({ ok: true, data });
});

const sendLoginCode = asyncHandler(async (req, res) => {
  const data = await logisticaAuthService.sendLoginCode(req.body || {});
  res.json({ ok: true, data });
});

const verifyLogin = asyncHandler(async (req, res) => {
  const data = await logisticaAuthService.verifyLogin(req.body || {});
  res.json({ ok: true, data });
});

const getApprovalStatus = asyncHandler(async (req, res) => {
  const data = await logisticaAuthService.getApprovalStatus(req.body || {});
  res.json({ ok: true, data });
});

const getProfile = asyncHandler(async (req, res) => {
  const data = await logisticaAuthService.getProfile(req.logisticaId);
  res.json({ ok: true, data });
});

const updateProfileDetails = asyncHandler(async (req, res) => {
  const data = await logisticaAuthService.updateProfileDetails(
    req.logisticaId,
    req.body || {},
  );
  res.json({ ok: true, data });
});

module.exports = {
  sendRegistrationCode,
  completeRegistration,
  sendLoginCode,
  verifyLogin,
  getApprovalStatus,
  getProfile,
  updateProfileDetails,
};
