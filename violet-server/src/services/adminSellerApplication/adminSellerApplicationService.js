const { SellerRegistration, toPublicJSON } = require("../../models/sellerRegistration");
const { SellerAccount } = require("../../models/sellerAccount");
const { SellerRatingSummary } = require("../../models/sellerRatingSummary");
const { HttpError } = require("../../utils/httpError");

const DEFAULT_SELLER_LOGO = "img/vm logo.jpg";

const { toSellerAccountPublic } = require("../adminSellerManagement/sellerAccountMapper");

async function listSellerApplications() {
  const [pending, approvedRegistrations] = await Promise.all([
    SellerRegistration.find({ status: "pending" }).sort({ submittedAt: -1, createdAt: -1 }),
    SellerRegistration.find({ status: "approved" }).sort({ reviewedAt: -1, createdAt: -1 }),
  ]);

  const approvedShopIds = approvedRegistrations.map((item) => item.shopId).filter(Boolean);
  const sellerAccounts = approvedShopIds.length
    ? await SellerAccount.find({ id: { $in: approvedShopIds } })
    : [];
  const accountById = new Map(sellerAccounts.map((item) => [item.id, item]));

  return {
    pending: pending.map(toPublicJSON),
    approved: approvedRegistrations.map((registration) => {
      const account = accountById.get(registration.shopId);
      return {
        ...toPublicJSON(registration),
        sellerAccount: toSellerAccountPublic(account),
      };
    }),
  };
}

async function approveApplication(applicationId) {
  const registration = await SellerRegistration.findById(applicationId);
  if (!registration) {
    throw new HttpError(404, "Ariza topilmadi", "APPLICATION_NOT_FOUND");
  }

  if (registration.status !== "pending") {
    throw new HttpError(400, "Faqat kutilayotgan arizani tasdiqlash mumkin", "INVALID_STATUS");
  }

  const displayName = registration.shopDisplayName || registration.shopId;

  const existingAccount = await SellerAccount.findOne({ id: registration.shopId });
  if (existingAccount) {
    existingAccount.name = {
      uz: displayName,
      ru: displayName,
    };
    await existingAccount.save();
  } else {
    await SellerAccount.create({
      id: registration.shopId,
      name: { uz: displayName, ru: displayName },
      description: { uz: "", ru: "" },
      logo: DEFAULT_SELLER_LOGO,
      subscriberCount: 0,
      status: "active",
    });
  }

  const existingSummary = await SellerRatingSummary.findOne({ sellerId: registration.shopId });
  if (!existingSummary) {
    await SellerRatingSummary.create({
      sellerId: registration.shopId,
      totalReviews: 0,
      ratingSum: 0,
      star1: 0,
      star2: 0,
      star3: 0,
      star4: 0,
      star5: 0,
    });
  }

  registration.status = "approved";
  registration.reviewedAt = new Date();
  registration.rejectionReason = "";
  await registration.save();

  const account = await SellerAccount.findOne({ id: registration.shopId });

  return {
    application: toPublicJSON(registration),
    sellerAccount: toSellerAccountPublic(account),
  };
}

async function rejectApplication(applicationId, reason) {
  const registration = await SellerRegistration.findById(applicationId);
  if (!registration) {
    throw new HttpError(404, "Ariza topilmadi", "APPLICATION_NOT_FOUND");
  }

  if (registration.status !== "pending") {
    throw new HttpError(400, "Faqat kutilayotgan arizani rad etish mumkin", "INVALID_STATUS");
  }

  registration.status = "rejected";
  registration.rejectionReason = String(reason || "").trim() || "Ariza rad etildi";
  registration.reviewedAt = new Date();
  await registration.save();

  return { application: toPublicJSON(registration) };
}

module.exports = {
  listSellerApplications,
  approveApplication,
  rejectApplication,
};
