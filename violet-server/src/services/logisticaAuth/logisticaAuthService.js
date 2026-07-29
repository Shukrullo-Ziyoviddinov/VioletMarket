const {
  LogisticaProfile,
  LOGISTICA_COUNTRIES,
} = require("../../models/logisticaProfile");
const { HttpError } = require("../../utils/httpError");
const { signLogisticaToken } = require("../../utils/logisticaJwt");
const {
  createAndSendLogisticaOtp,
  verifyLogisticaOtp,
} = require("./logisticaOtpService");

const LOGIN_PURPOSE = "logistica-login";
const REGISTER_PURPOSE = "logistica-register";

const COUNTRY_LABELS = {
  china: "China",
  usa: "AQSH",
  turkey: "Turkiya",
  korea: "Korea",
  japan: "Yaponiya",
};

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Gmail manzil noto'g'ri", "VALIDATION_ERROR");
  }
  return email;
}

function normalizeCompanyName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) {
    throw new HttpError(
      400,
      "Kompaniya nomi 2–120 ta belgidan iborat bo'lishi kerak",
      "VALIDATION_ERROR",
    );
  }
  return name;
}

function normalizeCountry(value) {
  const country = String(value || "").trim().toLowerCase();
  if (!LOGISTICA_COUNTRIES.includes(country)) {
    throw new HttpError(
      400,
      "Logistica davlati noto'g'ri",
      "VALIDATION_ERROR",
    );
  }
  return country;
}

function assertActiveProfile(profile) {
  if (!profile) {
    throw new HttpError(404, "Logistica akkaunt topilmadi", "ACCOUNT_NOT_FOUND");
  }
  if (profile.status === "pending") {
    throw new HttpError(
      403,
      "Admin tasdiqlashini kuting",
      "ACCOUNT_PENDING",
    );
  }
  if (profile.status !== "active") {
    throw new HttpError(403, "Logistica akkaunt bloklangan", "ACCOUNT_BLOCKED");
  }
}

async function sendRegistrationCode(payload) {
  const email = normalizeEmail(payload.email);
  const companyName = normalizeCompanyName(payload.companyName);
  const logisticaCountry = normalizeCountry(payload.logisticaCountry);

  const existing = await LogisticaProfile.findOne({ email });
  if (existing) {
    if (existing.status === "pending") {
      throw new HttpError(
        403,
        "Bu Gmail uchun so‘rov allaqachon yuborilgan. Admin tasdiqlashini kuting",
        "ACCOUNT_PENDING",
      );
    }
    throw new HttpError(
      409,
      "Bu email bilan logistica akkaunt mavjud",
      "ACCOUNT_EXISTS",
    );
  }

  const otp = await createAndSendLogisticaOtp(email, REGISTER_PURPOSE);
  return {
    email,
    companyName,
    logisticaCountry,
    countryLabel: COUNTRY_LABELS[logisticaCountry],
    ...otp,
  };
}

async function completeRegistration(payload) {
  try {
    const email = normalizeEmail(payload.email);
    const companyName = normalizeCompanyName(payload.companyName);
    const logisticaCountry = normalizeCountry(payload.logisticaCountry);

    if (await LogisticaProfile.exists({ email })) {
      throw new HttpError(
        409,
        "Bu email bilan logistica akkaunt mavjud",
        "ACCOUNT_EXISTS",
      );
    }

    await verifyLogisticaOtp(email, REGISTER_PURPOSE, payload.code);

    const profile = await LogisticaProfile.create({
      email,
      companyName,
      logisticaCountry,
      status: "pending",
    });

    return {
      requiresApproval: true,
      profile: profile.toPublicJSON(),
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(
        409,
        "Bu email bilan logistica akkaunt mavjud",
        "ACCOUNT_EXISTS",
      );
    }
    throw error;
  }
}

async function sendLoginCode(payload) {
  const email = normalizeEmail(payload.email);
  const profile = await LogisticaProfile.findOne({ email });
  assertActiveProfile(profile);

  const otp = await createAndSendLogisticaOtp(email, LOGIN_PURPOSE);
  return { email, ...otp };
}

async function verifyLogin(payload) {
  const email = normalizeEmail(payload.email);
  const profile = await LogisticaProfile.findOne({ email });
  assertActiveProfile(profile);

  await verifyLogisticaOtp(email, LOGIN_PURPOSE, payload.code);

  return {
    token: signLogisticaToken(profile._id),
    profile: profile.toPublicJSON(),
  };
}

async function getApprovalStatus(payload) {
  const email = normalizeEmail(payload.email);
  const profile = await LogisticaProfile.findOne({ email }).select("status");

  if (!profile) {
    return { email, status: "not_found" };
  }

  return {
    email,
    status: profile.status,
  };
}

async function getProfile(logisticaId) {
  const profile = await LogisticaProfile.findById(logisticaId);
  assertActiveProfile(profile);
  return profile.toPublicJSON();
}

function normalizeRequiredProfileText(value, label, maxLength) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (!text) {
    throw new HttpError(400, `${label}ni kiriting`, "VALIDATION_ERROR");
  }
  if (text.length > maxLength) {
    throw new HttpError(
      400,
      `${label} ${maxLength} ta belgidan oshmasligi kerak`,
      "VALIDATION_ERROR",
    );
  }
  return text;
}

async function updateProfileDetails(logisticaId, payload = {}) {
  const profile = await LogisticaProfile.findById(logisticaId);
  assertActiveProfile(profile);

  const chinaAddress = normalizeRequiredProfileText(
    payload.chinaAddress,
    "Xitoydagi manzil",
    300,
  );
  const chinaPhone = normalizeRequiredProfileText(
    payload.chinaPhone,
    "Xitoydagi telefon raqami",
    40,
  );
  const profileDescription = String(payload.profileDescription || "").trim();
  if (profileDescription.length > 500) {
    throw new HttpError(
      400,
      "Qisqacha tavsif 500 ta belgidan oshmasligi kerak",
      "VALIDATION_ERROR",
    );
  }

  profile.chinaAddress = chinaAddress;
  profile.chinaPhone = chinaPhone;
  profile.profileDescription = profileDescription;
  await profile.save();

  return profile.toPublicJSON();
}

module.exports = {
  sendRegistrationCode,
  completeRegistration,
  sendLoginCode,
  verifyLogin,
  getApprovalStatus,
  getProfile,
  updateProfileDetails,
  COUNTRY_LABELS,
  LOGISTICA_COUNTRIES,
};
