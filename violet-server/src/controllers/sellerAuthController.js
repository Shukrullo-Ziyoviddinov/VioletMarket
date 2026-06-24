const { asyncHandler } = require("../utils/asyncHandler");
const sellerAuthService = require("../services/sellerAuth/sellerAuthService");

const startRegistration = asyncHandler(async (req, res) => {
  const data = await sellerAuthService.startRegistration(req.body || {});
  res.json({ ok: true, data });
});

const verifyRegistrationEmail = asyncHandler(async (req, res) => {
  const data = await sellerAuthService.verifyRegistrationEmail(req.body || {});
  res.json({ ok: true, data });
});

const submitApplication = asyncHandler(async (req, res) => {
  const data = await sellerAuthService.submitApplication(req, req.body || {});
  res.json({ ok: true, data });
});

const getApplicationStatus = asyncHandler(async (req, res) => {
  const data = await sellerAuthService.getApplicationStatus(req, {
    email: req.query?.email,
  });
  res.json({ ok: true, data });
});

const loginSeller = asyncHandler(async (req, res) => {
  const data = await sellerAuthService.loginSeller(req.body || {});
  res.json({ ok: true, data });
});

const getCabinetProfile = asyncHandler(async (req, res) => {
  const data = await sellerAuthService.getSellerCabinetProfile(req.sellerShopId);
  res.json({ ok: true, data });
});

const updateMarketProfile = asyncHandler(async (req, res) => {
  const data = await sellerAuthService.updateSellerMarketProfile(req.sellerShopId, req.body || {});
  res.json({ ok: true, data });
});

module.exports = {
  startRegistration,
  verifyRegistrationEmail,
  submitApplication,
  getApplicationStatus,
  loginSeller,
  getCabinetProfile,
  updateMarketProfile,
};
