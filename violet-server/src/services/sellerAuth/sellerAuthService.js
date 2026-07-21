const { SellerRegistration, toPublicJSON } = require("../../models/sellerRegistration");
const { SellerAccount } = require("../../models/sellerAccount");
const { HttpError } = require("../../utils/httpError");
const { normalizeEmail, isValidEmail } = require("../../utils/email");
const { hashPassword, verifyPassword } = require("../../utils/password");
const { assertValidShopId } = require("../../utils/shopId");
const { normalizeSellerAccountStatus } = require("../../utils/sellerAccountStatus");
const {
  assertValidSellerCountry,
  listSellerCountryOptions,
} = require("../../utils/sellerCountry");
const {
  signSellerRegistrationToken,
  verifySellerRegistrationToken,
  signSellerToken,
} = require("../../utils/sellerJwt");
const { createAndSendOtp, verifyOtp } = require("../login/otpService");

const OTP_PURPOSE = "seller-register";

function assertValidEmail(email) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new HttpError(400, "Email formati noto'g'ri", "INVALID_EMAIL");
  }
  return normalized;
}

function assertValidName(value, fieldLabel) {
  const trimmed = String(value || "").trim();
  if (trimmed.length < 2) {
    throw new HttpError(400, `${fieldLabel} kamida 2 ta belgidan iborat bo'lishi kerak`, "INVALID_NAME");
  }
  return trimmed;
}

function assertValidPassword(password) {
  const value = String(password || "");
  if (value.length < 6) {
    throw new HttpError(400, "Parol kamida 6 ta belgidan iborat bo'lishi kerak", "INVALID_PASSWORD");
  }
  return value;
}

function getRegistrationTokenFromRequest(req) {
  const header = String(req.headers.authorization || "");
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return String(req.body?.registrationToken || "").trim();
}

async function startRegistration({ firstName, lastName, email, sellerCountry }) {
  const normalizedEmail = assertValidEmail(email);
  const safeFirstName = assertValidName(firstName, "Ism");
  const safeLastName = assertValidName(lastName, "Familiya");
  const normalizedSellerCountry = await assertValidSellerCountry(sellerCountry);

  let registration = await SellerRegistration.findOne({ email: normalizedEmail });

  if (registration?.status === "approved") {
    throw new HttpError(409, "Bu email allaqachon tasdiqlangan. Kirish qismidan kiring.", "ALREADY_APPROVED");
  }

  if (registration?.status === "pending") {
    throw new HttpError(
      409,
      "Arizangiz ko'rib chiqilmoqda. Ariza holati sahifasidan tekshiring.",
      "APPLICATION_PENDING"
    );
  }

  if (!registration) {
    registration = await SellerRegistration.create({
      firstName: safeFirstName,
      lastName: safeLastName,
      email: normalizedEmail,
      sellerCountry: normalizedSellerCountry,
      status: "draft",
      emailVerified: false,
    });
  } else {
    registration.firstName = safeFirstName;
    registration.lastName = safeLastName;
    registration.sellerCountry = normalizedSellerCountry;
    registration.emailVerified = false;
    if (registration.status === "rejected") {
      registration.status = "draft";
      registration.rejectionReason = "";
      registration.shopDisplayName = "";
      registration.passwordHash = "";
      registration.shopId = undefined;
      registration.submittedAt = undefined;
      registration.reviewedAt = undefined;
    }
    await registration.save();
  }

  const meta = await createAndSendOtp(normalizedEmail, OTP_PURPOSE);

  return {
    email: normalizedEmail,
    ...meta,
    application: toPublicJSON(registration),
  };
}

async function verifyRegistrationEmail({ email, code }) {
  const normalizedEmail = assertValidEmail(email);
  await verifyOtp(normalizedEmail, OTP_PURPOSE, code);

  const registration = await SellerRegistration.findOne({ email: normalizedEmail });
  if (!registration) {
    throw new HttpError(404, "Ro'yxat topilmadi. Qayta boshlang.", "REGISTRATION_NOT_FOUND");
  }

  if (registration.status === "approved") {
    throw new HttpError(409, "Bu email allaqachon tasdiqlangan", "ALREADY_APPROVED");
  }

  if (registration.status === "pending") {
    throw new HttpError(409, "Arizangiz allaqachon yuborilgan", "APPLICATION_PENDING");
  }

  registration.emailVerified = true;
  await registration.save();

  const registrationToken = signSellerRegistrationToken(normalizedEmail);

  return {
    registrationToken,
    application: toPublicJSON(registration),
  };
}

async function submitApplication(req, { shopDisplayName, shopId, password }) {
  const registrationToken = getRegistrationTokenFromRequest(req);
  if (!registrationToken) {
    throw new HttpError(401, "Ro'yxat tokeni talab qilinadi", "REGISTRATION_TOKEN_REQUIRED");
  }

  const email = verifySellerRegistrationToken(registrationToken);
  const registration = await SellerRegistration.findOne({ email });
  if (!registration) {
    throw new HttpError(404, "Ro'yxat topilmadi", "REGISTRATION_NOT_FOUND");
  }

  if (!registration.emailVerified) {
    throw new HttpError(400, "Avval emailni tasdiqlang", "EMAIL_NOT_VERIFIED");
  }

  if (registration.status === "pending") {
    throw new HttpError(409, "Ariza allaqachon yuborilgan", "APPLICATION_PENDING");
  }

  if (registration.status === "approved") {
    throw new HttpError(409, "Hisob allaqachon tasdiqlangan", "ALREADY_APPROVED");
  }

  const safeShopName = assertValidName(shopDisplayName, "Do'kon nomi");
  const normalizedShopId = assertValidShopId(shopId);
  const safePassword = assertValidPassword(password);

  const existingShop = await SellerAccount.findOne({ id: normalizedShopId });
  if (existingShop) {
    throw new HttpError(409, "Bu do'kon ID band. Boshqasini tanlang.", "SHOP_ID_TAKEN");
  }

  const existingRegistrationShop = await SellerRegistration.findOne({
    shopId: normalizedShopId,
    _id: { $ne: registration._id },
    status: { $in: ["pending", "approved"] },
  });
  if (existingRegistrationShop) {
    throw new HttpError(409, "Bu do'kon ID band. Boshqasini tanlang.", "SHOP_ID_TAKEN");
  }

  registration.shopDisplayName = safeShopName;
  registration.shopId = normalizedShopId;
  registration.passwordHash = hashPassword(safePassword);
  registration.status = "pending";
  registration.submittedAt = new Date();
  registration.rejectionReason = "";
  registration.reviewedAt = undefined;
  await registration.save();

  return { application: toPublicJSON(registration) };
}

async function getApplicationStatus(req, { email }) {
  let normalizedEmail = "";

  const registrationToken = getRegistrationTokenFromRequest(req);
  if (registrationToken) {
    normalizedEmail = verifySellerRegistrationToken(registrationToken);
  } else if (email) {
    normalizedEmail = assertValidEmail(email);
  } else {
    throw new HttpError(400, "Email yoki ro'yxat tokeni talab qilinadi", "STATUS_LOOKUP_REQUIRED");
  }

  const registration = await SellerRegistration.findOne({ email: normalizedEmail });
  if (!registration) {
    throw new HttpError(404, "Ariza topilmadi", "REGISTRATION_NOT_FOUND");
  }

  return { application: toPublicJSON(registration) };
}

async function loginSeller({ shopId, password }) {
  const normalizedShopId = assertValidShopId(shopId);
  const safePassword = assertValidPassword(password);

  const registration = await SellerRegistration.findOne({
    shopId: normalizedShopId,
    status: "approved",
  });

  if (!registration || !registration.passwordHash) {
    throw new HttpError(401, "Do'kon ID yoki parol noto'g'ri", "INVALID_CREDENTIALS");
  }

  const passwordOk = verifyPassword(safePassword, registration.passwordHash);
  if (!passwordOk) {
    throw new HttpError(401, "Do'kon ID yoki parol noto'g'ri", "INVALID_CREDENTIALS");
  }

  const sellerAccount = await SellerAccount.findOne({ id: normalizedShopId });
  if (!sellerAccount) {
    throw new HttpError(404, "Sotuvchi hisobi topilmadi", "SELLER_ACCOUNT_NOT_FOUND");
  }

  const token = signSellerToken(normalizedShopId);

  return {
    token,
    seller: {
      shopId: normalizedShopId,
      shopDisplayName: registration.shopDisplayName,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      sellerCountry: registration.sellerCountry || "",
      accountStatus: normalizeSellerAccountStatus(sellerAccount.status),
    },
  };
}

async function getSellerCabinetProfile(shopId) {
  const normalizedShopId = assertValidShopId(shopId);

  const [registration, sellerAccount] = await Promise.all([
    SellerRegistration.findOne({ shopId: normalizedShopId, status: "approved" }),
    SellerAccount.findOne({ id: normalizedShopId }),
  ]);

  if (!registration) {
    throw new HttpError(404, "Tasdiqlangan sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }

  if (!sellerAccount) {
    throw new HttpError(404, "Do'kon profili topilmadi", "SELLER_ACCOUNT_NOT_FOUND");
  }

  return {
    registration: toPublicJSON(registration),
    account: {
      id: sellerAccount.id,
      name: sellerAccount.name,
      description: sellerAccount.description,
      sellerCountry: sellerAccount.sellerCountry || "",
      logo: sellerAccount.logo,
      address: String(sellerAccount.address || "").trim(),
      coordinates: Array.isArray(sellerAccount.coordinates) && sellerAccount.coordinates.length >= 2
        ? [Number(sellerAccount.coordinates[0]), Number(sellerAccount.coordinates[1])]
        : null,
      subscriberCount: sellerAccount.subscriberCount,
      orderCount: Math.max(0, Number(sellerAccount.orderCount) || 0),
      status: normalizeSellerAccountStatus(sellerAccount.status),
    },
  };
}

function trimText(value, fieldLabel, { required = false, maxLength = 2000 } = {}) {
  const trimmed = String(value ?? "").trim();
  if (required && !trimmed) {
    throw new HttpError(400, `${fieldLabel} bo'sh bo'lmasligi kerak`, "VALIDATION_ERROR");
  }
  if (trimmed.length > maxLength) {
    throw new HttpError(400, `${fieldLabel} juda uzun`, "VALIDATION_ERROR");
  }
  return trimmed;
}

async function updateSellerMarketProfile(shopId, payload = {}) {
  const normalizedShopId = assertValidShopId(shopId);
  const registration = await SellerRegistration.findOne({
    shopId: normalizedShopId,
    status: "approved",
  });
  if (!registration) {
    throw new HttpError(404, "Tasdiqlangan sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }

  const sellerAccount = await SellerAccount.findOne({ id: normalizedShopId });
  if (!sellerAccount) {
    throw new HttpError(404, "Do'kon profili topilmadi", "SELLER_ACCOUNT_NOT_FOUND");
  }

  if (payload.nameUz !== undefined) {
    sellerAccount.name.uz = trimText(payload.nameUz, "Do'kon nomi (UZ)", { required: true, maxLength: 120 });
  }
  if (payload.nameRu !== undefined) {
    sellerAccount.name.ru = trimText(payload.nameRu, "Do'kon nomi (RU)", { required: true, maxLength: 120 });
  }
  if (payload.descriptionUz !== undefined) {
    sellerAccount.description.uz = trimText(payload.descriptionUz, "Tavsif (UZ)", { maxLength: 2000 });
  }
  if (payload.descriptionRu !== undefined) {
    sellerAccount.description.ru = trimText(payload.descriptionRu, "Tavsif (RU)", { maxLength: 2000 });
  }
  if (payload.logo !== undefined) {
    const logo = trimText(payload.logo, "Logo", { maxLength: 500 });
    sellerAccount.logo = logo || "img/vm logo.jpg";
  }
  if (payload.address !== undefined) {
    sellerAccount.address = trimText(payload.address, "Manzil", { maxLength: 500 });
  }
  if (payload.coordinates !== undefined) {
    const raw = payload.coordinates;
    if (raw == null || raw === "" || (Array.isArray(raw) && raw.length === 0)) {
      sellerAccount.coordinates = undefined;
    } else {
      const lat = Number(Array.isArray(raw) ? raw[0] : raw.lat ?? raw.latitude);
      const lng = Number(Array.isArray(raw) ? raw[1] : raw.lng ?? raw.longitude);
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        throw new HttpError(400, "Koordinata noto‘g‘ri", "INVALID_COORDINATES");
      }
      sellerAccount.coordinates = [lat, lng];
    }
  }

  await sellerAccount.save();
  return getSellerCabinetProfile(normalizedShopId);
}

async function getSellerCountryOptions() {
  const rows = await listSellerCountryOptions();
  return {
    countries: rows.map((row) => ({
      id: row.id,
      code: String(row.code || "").trim(),
      name: row.name,
      sortOrder: row.sortOrder,
    })),
  };
}

module.exports = {
  startRegistration,
  verifyRegistrationEmail,
  submitApplication,
  getApplicationStatus,
  loginSeller,
  getSellerCountryOptions,
  getSellerCabinetProfile,
  updateSellerMarketProfile,
};
