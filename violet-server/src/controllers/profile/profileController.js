const profileService = require("../../services/profile/profileService");
const { asyncHandler } = require("../../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const result = await profileService.registerUser(req.body || {});
  res.status(201).json({ ok: true, ...result });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await profileService.getProfileById(req.userId);
  res.json({ ok: true, user });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await profileService.updateProfile(req.userId, req.body || {});
  res.json({ ok: true, user });
});

module.exports = {
  register,
  getMe,
  updateMe,
};
