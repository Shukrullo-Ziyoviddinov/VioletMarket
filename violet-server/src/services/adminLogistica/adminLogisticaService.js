const {
  LogisticaProfile,
} = require("../../models/logisticaProfile");
const { LogisticaAuthCode } = require("../../models/logisticaAuthCode");
const { HttpError } = require("../../utils/httpError");
const {
  COUNTRY_LABELS,
} = require("../logisticaAuth/logisticaAuthService");

function toAdminLogisticaJSON(profile) {
  if (!profile) return null;
  return {
    id: profile._id.toString(),
    email: profile.email,
    companyName: profile.companyName,
    name: profile.companyName,
    logisticaCountry: profile.logisticaCountry,
    countryLabel: COUNTRY_LABELS[profile.logisticaCountry] || profile.logisticaCountry,
    status: profile.status,
    reviewedAt: profile.reviewedAt || null,
    createdAt: profile.createdAt || null,
  };
}

async function listLogistica() {
  const [pendingProfiles, activeProfiles] = await Promise.all([
    LogisticaProfile.find({ status: "pending" }).sort({ createdAt: -1 }),
    LogisticaProfile.find({ status: "active" }).sort({
      reviewedAt: -1,
      createdAt: -1,
    }),
  ]);

  return {
    pending: pendingProfiles.map(toAdminLogisticaJSON),
    approved: activeProfiles.map(toAdminLogisticaJSON),
  };
}

async function approveLogistica(id) {
  const profile = await LogisticaProfile.findById(id);
  if (!profile) {
    throw new HttpError(404, "Logistica topilmadi", "LOGISTICA_NOT_FOUND");
  }
  if (profile.status !== "pending") {
    throw new HttpError(
      400,
      "Faqat kutilayotgan so‘rovni tasdiqlash mumkin",
      "INVALID_STATUS",
    );
  }

  profile.status = "active";
  profile.reviewedAt = new Date();
  await profile.save();

  return { profile: toAdminLogisticaJSON(profile) };
}

async function rejectLogistica(id) {
  const profile = await LogisticaProfile.findById(id);
  if (!profile) {
    throw new HttpError(404, "Logistica topilmadi", "LOGISTICA_NOT_FOUND");
  }
  if (profile.status !== "pending") {
    throw new HttpError(
      400,
      "Faqat kutilayotgan so‘rovni bekor qilish mumkin",
      "INVALID_STATUS",
    );
  }

  await LogisticaAuthCode.deleteMany({ email: profile.email });
  await LogisticaProfile.deleteOne({ _id: profile._id });
  return { deleted: true, id };
}

module.exports = {
  listLogistica,
  approveLogistica,
  rejectLogistica,
};
