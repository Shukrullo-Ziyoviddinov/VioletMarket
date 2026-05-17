const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");
const { normalizeEmail, isValidEmail } = require("../../utils/email");
const { signUserToken } = require("../../utils/jwt");
const { verifyOtp } = require("../login/otpService");

async function registerUser(payload) {
  const email = normalizeEmail(payload.email);
  if (!isValidEmail(email)) {
    throw new HttpError(400, "Email formati noto'g'ri", "INVALID_EMAIL");
  }

  const code = String(payload.code || "").trim();
  if (!code) {
    throw new HttpError(400, "Tasdiqlash kodi majburiy", "OTP_REQUIRED");
  }

  const firstName = String(payload.firstName || "").trim();
  const lastName = String(payload.lastName || "").trim();
  const phone = String(payload.phone || "").trim();

  if (!firstName) throw new HttpError(400, "Ism majburiy", "FIRST_NAME_REQUIRED");
  if (!lastName) throw new HttpError(400, "Familiya majburiy", "LAST_NAME_REQUIRED");
  if (!phone) throw new HttpError(400, "Telefon majburiy", "PHONE_REQUIRED");

  const existing = await User.findOne({ email });
  if (existing) {
    throw new HttpError(409, "Bu email allaqachon ro'yxatdan o'tgan", "EMAIL_EXISTS");
  }

  await verifyOtp(email, "register", code);

  const user = await User.create({
    email,
    firstName,
    lastName,
    phone,
    birthDate: String(payload.birthDate || ""),
    gender: payload.gender === "male" || payload.gender === "female" ? payload.gender : "",
    language: payload.language === "ru" ? "ru" : "uz",
  });

  const token = signUserToken(user._id);
  return { token, user: user.toPublicJSON() };
}

async function getProfileById(userId) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "Foydalanuvchi topilmadi", "USER_NOT_FOUND");
  return user.toPublicJSON();
}

async function updateProfile(userId, updates) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "Foydalanuvchi topilmadi", "USER_NOT_FOUND");

  if (updates.firstName !== undefined) user.firstName = String(updates.firstName).trim();
  if (updates.lastName !== undefined) user.lastName = String(updates.lastName).trim();
  if (updates.phone !== undefined) user.phone = String(updates.phone).trim();
  if (updates.birthDate !== undefined) user.birthDate = String(updates.birthDate);
  if (updates.gender !== undefined) {
    user.gender =
      updates.gender === "male" || updates.gender === "female" ? updates.gender : "";
  }
  if (updates.profileImage !== undefined) user.profileImage = String(updates.profileImage);
  if (updates.hasUploadedImage !== undefined) {
    user.hasUploadedImage = Boolean(updates.hasUploadedImage);
  }
  if (updates.language !== undefined) {
    user.language = updates.language === "ru" ? "ru" : "uz";
  }

  if (updates.email !== undefined) {
    const nextEmail = normalizeEmail(updates.email);
    if (!isValidEmail(nextEmail)) {
      throw new HttpError(400, "Email formati noto'g'ri", "INVALID_EMAIL");
    }
    if (nextEmail !== user.email) {
      const taken = await User.findOne({ email: nextEmail });
      if (taken) throw new HttpError(409, "Bu email band", "EMAIL_EXISTS");
      user.email = nextEmail;
    }
  }

  await user.save();
  return user.toPublicJSON();
}

module.exports = { registerUser, getProfileById, updateProfile };
