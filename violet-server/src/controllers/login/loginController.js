const loginService = require("../../services/login/loginService");
const { asyncHandler } = require("../../utils/asyncHandler");

const sendLoginCode = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  const result = await loginService.sendLoginCode(email);
  res.json({ ok: true, ...result });
});

const sendRegisterCode = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  const result = await loginService.sendRegisterCode(email);
  res.json({ ok: true, ...result });
});

const verifyLoginCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body || {};
  const result = await loginService.verifyLoginCode(email, code);
  res.json({ ok: true, ...result });
});

module.exports = {
  sendLoginCode,
  sendRegisterCode,
  verifyLoginCode,
};
