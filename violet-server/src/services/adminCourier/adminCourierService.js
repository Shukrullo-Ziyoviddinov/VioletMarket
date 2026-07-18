const { DeliveryAccount } = require("../../models/deliveryAccount");
const { DeliveryAuthCode } = require("../../models/deliveryAuthCode");
const { HttpError } = require("../../utils/httpError");
const {
  deleteManagedDeliveryPhoto,
} = require("../deliveryAuth/deliveryPhotoStorage");
const {
  deleteMessagesForCourier,
} = require("../supportChat/supportChatService");

function toAdminCourierJSON(account) {
  if (!account) return null;
  return {
    id: account._id.toString(),
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    phone: account.phone,
    profileImage: account.profileImage || "",
    transport: account.transport || null,
    isOnline: Boolean(account.isOnline),
    status: account.status,
    reviewedAt: account.reviewedAt || null,
    createdAt: account.createdAt || null,
  };
}

async function deleteCourierRelatedData(account) {
  if (!account) return;

  if (account.profileImage) {
    deleteManagedDeliveryPhoto(account.profileImage);
  }

  await deleteMessagesForCourier(account._id.toString());
  await DeliveryAuthCode.deleteMany({ email: account.email });
  await DeliveryAccount.deleteOne({ _id: account._id });
}

async function listCouriers() {
  const [pendingAccounts, activeAccounts] = await Promise.all([
    DeliveryAccount.find({ status: "pending" }).sort({ createdAt: -1 }),
    DeliveryAccount.find({ status: "active" }).sort({
      reviewedAt: -1,
      createdAt: -1,
    }),
  ]);

  return {
    pending: pendingAccounts.map(toAdminCourierJSON),
    approved: activeAccounts.map(toAdminCourierJSON),
  };
}

async function approveCourier(courierId) {
  const account = await DeliveryAccount.findById(courierId);
  if (!account) {
    throw new HttpError(404, "Kuryer topilmadi", "COURIER_NOT_FOUND");
  }
  if (account.status !== "pending") {
    throw new HttpError(
      400,
      "Faqat kutilayotgan so‘rovni tasdiqlash mumkin",
      "INVALID_STATUS",
    );
  }

  account.status = "active";
  account.reviewedAt = new Date();
  await account.save();

  return { courier: toAdminCourierJSON(account) };
}

async function rejectCourier(courierId) {
  const account = await DeliveryAccount.findById(courierId);
  if (!account) {
    throw new HttpError(404, "Kuryer topilmadi", "COURIER_NOT_FOUND");
  }
  if (account.status !== "pending") {
    throw new HttpError(
      400,
      "Faqat kutilayotgan so‘rovni bekor qilish mumkin",
      "INVALID_STATUS",
    );
  }

  await deleteCourierRelatedData(account);
  return { deleted: true, id: courierId };
}

async function deleteCourier(courierId) {
  const account = await DeliveryAccount.findById(courierId);
  if (!account) {
    throw new HttpError(404, "Kuryer topilmadi", "COURIER_NOT_FOUND");
  }
  if (account.status !== "active") {
    throw new HttpError(
      400,
      "Faqat tasdiqlangan kuryerni o‘chirish mumkin",
      "INVALID_STATUS",
    );
  }

  await deleteCourierRelatedData(account);
  return { deleted: true, id: courierId };
}

module.exports = {
  listCouriers,
  approveCourier,
  rejectCourier,
  deleteCourier,
};
