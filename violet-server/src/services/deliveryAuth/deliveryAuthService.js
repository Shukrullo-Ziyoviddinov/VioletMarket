const { DeliveryAccount } = require("../../models/deliveryAccount");
const { HttpError } = require("../../utils/httpError");
const { signDeliveryToken } = require("../../utils/deliveryJwt");
const {
  createAndSendDeliveryOtp,
  verifyDeliveryOtp,
} = require("./deliveryOtpService");
const {
  deleteManagedDeliveryPhoto,
  saveDeliveryProfilePhoto,
} = require("./deliveryPhotoStorage");

const LOGIN_PURPOSE = "delivery-login";
const REGISTER_PURPOSE = "delivery-register";

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Email manzil noto'g'ri", "VALIDATION_ERROR");
  }
  return email;
}

function normalizeName(value, label) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) {
    throw new HttpError(
      400,
      `${label} 2–60 ta belgidan iborat bo'lishi kerak`,
      "VALIDATION_ERROR",
    );
  }
  return name;
}

function normalizePhone(value) {
  const phone = String(value || "").trim();
  if (!/^\+?[0-9 ()-]{7,20}$/.test(phone)) {
    throw new HttpError(400, "Telefon raqami noto'g'ri", "VALIDATION_ERROR");
  }
  return phone;
}

async function startEmailAuth(payload) {
  const email = normalizeEmail(payload.email);
  const account = await DeliveryAccount.findOne({ email });

  if (!account) {
    return { mode: "register", email };
  }
  if (account.status !== "active") {
    throw new HttpError(403, "Delivery akkaunt bloklangan", "ACCOUNT_BLOCKED");
  }

  const otp = await createAndSendDeliveryOtp(email, LOGIN_PURPOSE);
  return { mode: "login", email, ...otp };
}

async function sendRegistrationCode(payload) {
  const email = normalizeEmail(payload.email);
  const existing = await DeliveryAccount.exists({ email });
  if (existing) {
    throw new HttpError(
      409,
      "Bu email bilan delivery akkaunt mavjud",
      "ACCOUNT_EXISTS",
    );
  }

  const otp = await createAndSendDeliveryOtp(email, REGISTER_PURPOSE);
  return { email, ...otp };
}

async function verifyLogin(payload) {
  const email = normalizeEmail(payload.email);
  const account = await DeliveryAccount.findOne({ email });
  if (!account) {
    throw new HttpError(404, "Delivery akkaunt topilmadi", "ACCOUNT_NOT_FOUND");
  }
  if (account.status !== "active") {
    throw new HttpError(403, "Delivery akkaunt bloklangan", "ACCOUNT_BLOCKED");
  }

  await verifyDeliveryOtp(email, LOGIN_PURPOSE, payload.code);

  return {
    token: signDeliveryToken(account._id),
    delivery: account.toPublicJSON(),
  };
}

async function completeRegistration(payload) {
  try {
    const email = normalizeEmail(payload.email);
    const firstName = normalizeName(payload.firstName, "Ism");
    const lastName = normalizeName(payload.lastName, "Familiya");
    const phone = normalizePhone(payload.phone);

    if (await DeliveryAccount.exists({ email })) {
      throw new HttpError(
        409,
        "Bu email bilan delivery akkaunt mavjud",
        "ACCOUNT_EXISTS",
      );
    }

    await verifyDeliveryOtp(email, REGISTER_PURPOSE, payload.code);

    const account = await DeliveryAccount.create({
      email,
      firstName,
      lastName,
      phone,
    });

    return {
      token: signDeliveryToken(account._id),
      delivery: account.toPublicJSON(),
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(
        409,
        "Bu email bilan delivery akkaunt mavjud",
        "ACCOUNT_EXISTS",
      );
    }
    throw error;
  }
}

async function getProfile(deliveryId) {
  const account = await DeliveryAccount.findById(deliveryId);
  if (!account) {
    throw new HttpError(404, "Delivery akkaunt topilmadi", "ACCOUNT_NOT_FOUND");
  }
  if (account.status !== "active") {
    throw new HttpError(403, "Delivery akkaunt bloklangan", "ACCOUNT_BLOCKED");
  }
  return account.toPublicJSON();
}

async function updateProfile(deliveryId, payload) {
  const account = await DeliveryAccount.findById(deliveryId);
  if (!account) {
    throw new HttpError(404, "Delivery akkaunt topilmadi", "ACCOUNT_NOT_FOUND");
  }

  const email = normalizeEmail(payload.email);
  const firstName = normalizeName(payload.firstName, "Ism");
  const lastName = normalizeName(payload.lastName, "Familiya");
  const phone = normalizePhone(payload.phone);

  const emailOwner = await DeliveryAccount.exists({
    email,
    _id: { $ne: account._id },
  });
  if (emailOwner) {
    throw new HttpError(
      409,
      "Bu Gmail boshqa delivery akkauntida ishlatilgan",
      "ACCOUNT_EXISTS",
    );
  }

  account.email = email;
  account.firstName = firstName;
  account.lastName = lastName;
  account.phone = phone;

  try {
    await account.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(
        409,
        "Bu Gmail boshqa delivery akkauntida ishlatilgan",
        "ACCOUNT_EXISTS",
      );
    }
    throw error;
  }

  return account.toPublicJSON();
}

async function updateProfilePhoto(deliveryId, payload) {
  const account = await DeliveryAccount.findById(deliveryId);
  if (!account) {
    throw new HttpError(404, "Delivery akkaunt topilmadi", "ACCOUNT_NOT_FOUND");
  }
  if (account.status !== "active") {
    throw new HttpError(403, "Delivery akkaunt bloklangan", "ACCOUNT_BLOCKED");
  }

  const previousImage = account.profileImage;
  const savedPhoto = saveDeliveryProfilePhoto(payload.imageBase64);

  account.profileImage = savedPhoto.publicPath;
  try {
    await account.save();
  } catch (error) {
    deleteManagedDeliveryPhoto(savedPhoto.publicPath);
    throw error;
  }

  if (previousImage && previousImage !== savedPhoto.publicPath) {
    deleteManagedDeliveryPhoto(previousImage);
  }

  return account.toPublicJSON();
}

module.exports = {
  startEmailAuth,
  sendRegistrationCode,
  verifyLogin,
  completeRegistration,
  getProfile,
  updateProfile,
  updateProfilePhoto,
};
