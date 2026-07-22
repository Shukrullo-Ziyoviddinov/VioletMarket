const { DeliveryAccount } = require("../../models/deliveryAccount");
const { DeliveryAuthCode } = require("../../models/deliveryAuthCode");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const { HttpError } = require("../../utils/httpError");
const {
  deleteManagedDeliveryPhoto,
} = require("../deliveryAuth/deliveryPhotoStorage");
const {
  deleteMessagesForCourier,
} = require("../supportChat/supportChatService");
const {
  getCourierAssignmentStatusLabel,
  getCourierAssignmentProgress,
  pickAssignmentTimestamps,
  normalizeCourierAssignmentStatus,
} = require("../../utils/courierAssignmentStatus");

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

async function listCourierAcceptedOrders(courierId, options = {}) {
  const account = await DeliveryAccount.findById(courierId);
  if (!account) {
    throw new HttpError(404, "Kuryer topilmadi", "COURIER_NOT_FOUND");
  }

  const status = String(options.status || "").trim().toLowerCase();
  const listFilter = { deliveryId: account._id };
  if (status === "accepted") {
    listFilter.status = {
      $in: [
        "accepted",
        "en_route_to_seller",
        "arrived_at_seller",
        "picked_up",
        "en_route_to_customer",
        "arrived_at_customer",
      ],
    };
  } else if (status === "delivered") {
    listFilter.status = { $in: ["delivered", "returned"] };
  } else if (
    status === "picked_up" ||
    status === "en_route_to_seller" ||
    status === "arrived_at_seller" ||
    status === "en_route_to_customer" ||
    status === "arrived_at_customer" ||
    status === "returned"
  ) {
    listFilter.status = status;
  }

  const [allRows, rows] = await Promise.all([
    CourierOrderAssignment.find({ deliveryId: account._id }).lean(),
    CourierOrderAssignment.find(listFilter)
      .sort({ acceptedAt: -1, createdAt: -1 })
      .lean(),
  ]);

  function mapOrder(row) {
    const address = row.deliveryAddress || {};
    const customer = row.customer || {};
    const status = normalizeCourierAssignmentStatus(row.status);
    const timestamps = pickAssignmentTimestamps(row);
    return {
      id: String(row._id),
      orderId: Number(row.orderId) || 0,
      itemIndex: Number(row.itemIndex) || 0,
      unitIndex: Number(row.unitIndex) || 0,
      productId: Number(row.productId) || 0,
      productCode: String(row.productCode || ""),
      barcode: String(row.productCode || ""),
      title: {
        uz: String(row.title?.uz || ""),
        ru: String(row.title?.ru || ""),
      },
      amount: Math.max(0, Number(row.amount) || 0),
      status,
      statusLabel: getCourierAssignmentStatusLabel(status),
      progress: getCourierAssignmentProgress(status),
      ...timestamps,
      distanceKm:
        row.distanceKm == null || row.distanceKm === ""
          ? null
          : Math.max(0, Number(row.distanceKm) || 0),
      courierPayment: Math.max(0, Number(row.courierPayment) || 0),
      customer: {
        firstName: String(customer.firstName || ""),
        lastName: String(customer.lastName || ""),
        phone: String(customer.phone || ""),
      },
      deliveryAddress: {
        city: String(address.city || ""),
        district: String(address.district || ""),
        addressLine: String(address.addressLine || ""),
      },
    };
  }

  const orders = rows.map(mapOrder);
  const paidRows = allRows.filter((row) => {
    const status = String(row.status || "");
    return status === "delivered" || status === "returned";
  });
  const activeStatuses = new Set([
    "accepted",
    "en_route_to_seller",
    "arrived_at_seller",
    "picked_up",
    "en_route_to_customer",
    "arrived_at_customer",
  ]);
  const acceptedRows = allRows.filter((row) =>
    activeStatuses.has(String(row.status || "")),
  );
  const totalCourierIncome = paidRows.reduce(
    (sum, row) => sum + Math.max(0, Number(row.courierPayment) || 0),
    0,
  );

  return {
    courier: toAdminCourierJSON(account),
    stats: {
      totalAccepted: allRows.length,
      deliveredCount: paidRows.length,
      activeCount: acceptedRows.length,
      totalCourierIncome,
    },
    orders,
  };
}

async function updateCourierAssignmentPayment(assignmentId, payload = {}) {
  const payment = Math.max(0, Math.round(Number(payload.courierPayment) || 0));
  const assignment = await CourierOrderAssignment.findById(assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }
  const status = String(assignment.status || "");
  if (status !== "delivered" && status !== "returned") {
    throw new HttpError(
      400,
      "Faqat topshirilgan yoki qaytarilgan buyurtma to‘lovini tahrirlash mumkin",
      "INVALID_ASSIGNMENT_STATUS",
    );
  }

  assignment.courierPayment = payment;
  assignment.courierPaymentUpdatedAt = new Date();
  await assignment.save();

  const address = assignment.deliveryAddress || {};
  const customer = assignment.customer || {};
  return {
    id: String(assignment._id),
    orderId: Number(assignment.orderId) || 0,
    status: String(assignment.status || "delivered"),
    courierPayment: payment,
    distanceKm:
      assignment.distanceKm == null
        ? null
        : Math.max(0, Number(assignment.distanceKm) || 0),
    deliveredAt: assignment.deliveredAt || null,
    customer: {
      firstName: String(customer.firstName || ""),
      lastName: String(customer.lastName || ""),
      phone: String(customer.phone || ""),
    },
    deliveryAddress: {
      city: String(address.city || ""),
      district: String(address.district || ""),
      addressLine: String(address.addressLine || ""),
    },
  };
}

module.exports = {
  listCouriers,
  approveCourier,
  rejectCourier,
  deleteCourier,
  listCourierAcceptedOrders,
  updateCourierAssignmentPayment,
};
