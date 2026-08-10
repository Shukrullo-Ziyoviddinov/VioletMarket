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
    region: account.region || "",
    isOnline: Boolean(account.isOnline),
    status: account.status,
    reviewedAt: account.reviewedAt || null,
    createdAt: account.createdAt || null,
  };
}

const ASSIGNMENT_STATUS_RANK = {
  accepted: 1,
  en_route_to_seller: 2,
  arrived_at_seller: 3,
  picked_up: 4,
  en_route_to_customer: 5,
  arrived_at_customer: 6,
  delivered: 7,
  returned: 7,
};

function fulfillmentGroupKey(orderId, sellerId) {
  const oid = Number(orderId) || 0;
  const sid = String(sellerId || "").trim();
  if (!oid || !sid) return "";
  return `${oid}:${sid}`;
}

/**
 * Bir buyurtma + bir siller → bitta admin kartochka (qabul / topshirilgan).
 * Delivery ilovasidagi arxitektura bilan bir xil.
 */
function groupCourierAssignmentsByOrderSeller(cards = []) {
  const buckets = new Map();

  for (const card of cards) {
    if (!card) continue;
    const key =
      fulfillmentGroupKey(card.orderId, card.sellerId) ||
      `solo:${card.id}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(card);
  }

  const grouped = [];
  for (const units of buckets.values()) {
    const sorted = [...units].sort((a, b) => {
      const ai = Number(a.itemIndex) || 0;
      const bi = Number(b.itemIndex) || 0;
      if (ai !== bi) return ai - bi;
      return (Number(a.unitIndex) || 0) - (Number(b.unitIndex) || 0);
    });

    const primary =
      sorted.find((row) => Math.max(0, Number(row.courierPayment) || 0) > 0) ||
      sorted.reduce((best, row) => {
        const rank = ASSIGNMENT_STATUS_RANK[String(row.status || "")] || 0;
        const bestRank = ASSIGNMENT_STATUS_RANK[String(best.status || "")] || 0;
        return rank >= bestRank ? row : best;
      }, sorted[0]);

    const productCodes = [
      ...new Set(
        sorted
          .map((row) => String(row.productCode || row.barcode || "").trim())
          .filter(Boolean),
      ),
    ];
    const titles = [
      ...new Set(
        sorted
          .map((row) => String(row.title?.uz || row.title?.ru || "").trim())
          .filter(Boolean),
      ),
    ];
    const amount = sorted.reduce(
      (sum, row) => sum + Math.max(0, Number(row.amount) || 0),
      0,
    );
    const courierPayment = sorted.reduce(
      (sum, row) => sum + Math.max(0, Number(row.courierPayment) || 0),
      0,
    );
    const siblingIds = sorted.map((row) => String(row.id)).filter(Boolean);
    const acceptedAt = sorted
      .map((row) => row.acceptedAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] || null;
    const deliveredAt = sorted
      .map((row) => row.deliveredAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;
    const returnedAt = sorted
      .map((row) => row.returnedAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

    const status = normalizeCourierAssignmentStatus(primary.status);
    grouped.push({
      ...primary,
      id: siblingIds[0] || primary.id,
      status,
      statusLabel: getCourierAssignmentStatusLabel(status),
      progress: getCourierAssignmentProgress(status),
      acceptedAt: acceptedAt || primary.acceptedAt || null,
      deliveredAt: deliveredAt || primary.deliveredAt || null,
      returnedAt: returnedAt || primary.returnedAt || null,
      amount,
      courierPayment,
      productCount: sorted.length,
      isGroup: sorted.length > 1,
      productCodes,
      barcode:
        productCodes.length <= 1
          ? productCodes[0] || primary.barcode || primary.productCode || ""
          : productCodes.join(", "),
      productCode:
        productCodes.length <= 1
          ? productCodes[0] || primary.productCode || ""
          : productCodes.join(", "),
      title: {
        uz:
          titles.length <= 1
            ? titles[0] || primary.title?.uz || ""
            : `${titles[0]} +${titles.length - 1}`,
        ru:
          titles.length <= 1
            ? titles[0] || primary.title?.ru || ""
            : `${titles[0]} +${titles.length - 1}`,
      },
      siblingIds,
      units: sorted.map((row) => ({
        id: String(row.id),
        itemIndex: Number(row.itemIndex) || 0,
        unitIndex: Number(row.unitIndex) || 0,
        productId: Number(row.productId) || 0,
        productCode: String(row.productCode || ""),
        barcode: String(row.barcode || row.productCode || ""),
        title: row.title || { uz: "", ru: "" },
        amount: Math.max(0, Number(row.amount) || 0),
        courierPayment: Math.max(0, Number(row.courierPayment) || 0),
        color: String(row.color || ""),
        size: String(row.size || ""),
        storage: String(row.storage || ""),
        model: String(row.model || ""),
        status: String(row.status || ""),
      })),
      groupKey: fulfillmentGroupKey(primary.orderId, primary.sellerId),
      paymentAssignmentId:
        sorted.find((row) => Math.max(0, Number(row.courierPayment) || 0) > 0)
          ?.id || siblingIds[0] || primary.id,
    });
  }

  grouped.sort((a, b) => {
    const ta = a.acceptedAt ? new Date(a.acceptedAt).getTime() : 0;
    const tb = b.acceptedAt ? new Date(b.acceptedAt).getTime() : 0;
    if (tb !== ta) return tb - ta;
    return (Number(b.orderId) || 0) - (Number(a.orderId) || 0);
  });

  return grouped;
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
      sellerId: String(row.sellerId || "").trim(),
      productId: Number(row.productId) || 0,
      productCode: String(row.productCode || ""),
      barcode: String(row.productCode || ""),
      title: {
        uz: String(row.title?.uz || ""),
        ru: String(row.title?.ru || ""),
      },
      color: String(row.color || ""),
      size: String(row.size || ""),
      storage: String(row.storage || ""),
      model: String(row.model || ""),
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

  const orders = groupCourierAssignmentsByOrderSeller(rows.map(mapOrder));
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

/** Qabul qilingan (topshirilmagan) assignment — delivery poolga qaytarish. */
const REASSIGNABLE_ASSIGNMENT_STATUSES = new Set([
  "accepted",
  "en_route_to_seller",
  "arrived_at_seller",
  "picked_up",
  "en_route_to_customer",
  "arrived_at_customer",
]);

/**
 * Admin «Qayta tayinlash»:
 * assignment → cancelled → delivery «Buyurtmalar» pooliga qaytadi.
 * Order/item tracking, ombor, sotildi, sotuvchiga qaytarish — tegilmaydi.
 */
async function reassignCourierAssignmentToPool(assignmentIdRaw) {
  const assignmentId = String(assignmentIdRaw || "").trim();
  if (!assignmentId) {
    throw new HttpError(400, "Assignment ID noto‘g‘ri", "INVALID_ASSIGNMENT_ID");
  }

  const assignment = await CourierOrderAssignment.findById(assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }

  const status = String(assignment.status || "");

  // Guruh qayta urinishida allaqachon cancelled bo‘lgan sibling — xato emas
  if (status === "cancelled") {
    return {
      id: String(assignment._id),
      orderId: Number(assignment.orderId) || 0,
      itemIndex: Number(assignment.itemIndex) || 0,
      unitIndex: Number(assignment.unitIndex) || 0,
      status: "cancelled",
      releasedToPool: true,
      alreadyReleased: true,
    };
  }

  if (!REASSIGNABLE_ASSIGNMENT_STATUSES.has(status)) {
    throw new HttpError(
      409,
      "Faqat kuryer qabul qilgan (topshirilmagan) buyurtmani qayta tayinlash mumkin",
      "ASSIGNMENT_NOT_REASSIGNABLE",
    );
  }

  assignment.status = "cancelled";
  assignment.enRouteToSellerAt = null;
  assignment.arrivedAtSellerAt = null;
  assignment.pickedUpAt = null;
  assignment.enRouteToCustomerAt = null;
  assignment.arrivedAtCustomerAt = null;
  assignment.deliveredAt = null;
  assignment.enRouteReturnToSellerAt = null;
  assignment.arrivedReturnAtSellerAt = null;
  assignment.returnedAt = null;
  assignment.courierPayment = 0;
  assignment.courierPaymentUpdatedAt = null;
  if (typeof assignment.set === "function") {
    assignment.set("approvedReturnReasonType", undefined);
  } else {
    assignment.approvedReturnReasonType = undefined;
  }
  await assignment.save();

  return {
    id: String(assignment._id),
    orderId: Number(assignment.orderId) || 0,
    itemIndex: Number(assignment.itemIndex) || 0,
    unitIndex: Number(assignment.unitIndex) || 0,
    status: "cancelled",
    releasedToPool: true,
    alreadyReleased: false,
  };
}

module.exports = {
  listCouriers,
  approveCourier,
  rejectCourier,
  deleteCourier,
  listCourierAcceptedOrders,
  updateCourierAssignmentPayment,
  reassignCourierAssignmentToPool,
};
