/**
 * Admin — Logistica Ma’lumot (faqat o‘qish).
 * Balance/history write zanjiriga tegmaydi; mijoz orderId → Order → User join.
 */

const mongoose = require("mongoose");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { Order } = require("../../models/order");
const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");
const {
  COUNTRY_LABELS,
} = require("../logisticaAuth/logisticaAuthService");
const {
  getBalanceForLogistica,
} = require("../cargoShipments/cargoLogisticaBalanceService");
const {
  listHistoryForLogistica,
} = require("../cargoShipments/cargoLogisticaHistoryService");

function emptyCustomer() {
  return { firstName: "", lastName: "", phone: "", fullName: "" };
}

function toCustomerJSON(user) {
  if (!user) return emptyCustomer();
  const firstName = String(user.firstName || "").trim();
  const lastName = String(user.lastName || "").trim();
  const phone = String(user.phone || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return {
    firstName,
    lastName,
    phone,
    fullName: fullName || "—",
  };
}

function toDetailProfileJSON(profile) {
  if (!profile) return null;
  return {
    id: profile._id.toString(),
    email: profile.email,
    companyName: profile.companyName,
    name: profile.companyName,
    logisticaCountry: profile.logisticaCountry,
    countryLabel:
      COUNTRY_LABELS[profile.logisticaCountry] || profile.logisticaCountry,
    status: profile.status,
    reviewedAt: profile.reviewedAt || null,
    createdAt: profile.createdAt || null,
    chinaAddress: String(profile.chinaAddress || ""),
    chinaPhone: String(profile.chinaPhone || ""),
    profileDescription: String(profile.profileDescription || ""),
  };
}

async function assertActiveLogistica(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "Logistica ID noto‘g‘ri", "VALIDATION_ERROR");
  }
  const profile = await LogisticaProfile.findById(id).lean();
  if (!profile) {
    throw new HttpError(404, "Logistica topilmadi", "LOGISTICA_NOT_FOUND");
  }
  if (profile.status !== "active") {
    throw new HttpError(400, "Logistica faol emas", "INVALID_STATUS");
  }
  return profile;
}

async function enrichHistoryItemsWithCustomers(items = []) {
  const orderIds = [
    ...new Set(
      items
        .map((item) => Number(item.orderId) || 0)
        .filter((orderId) => orderId > 0),
    ),
  ];

  if (!orderIds.length) {
    return items.map((item) => ({ ...item, customer: emptyCustomer() }));
  }

  const orders = await Order.find({ id: { $in: orderIds } })
    .select("id userId")
    .lean();

  const userIds = [
    ...new Set(
      orders
        .map((order) => String(order.userId || "").trim())
        .filter(Boolean),
    ),
  ];

  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } })
        .select("firstName lastName phone")
        .lean()
    : [];

  const userMap = new Map(
    users.map((user) => [String(user._id), toCustomerJSON(user)]),
  );
  const orderCustomerMap = new Map(
    orders.map((order) => [
      Number(order.id) || 0,
      userMap.get(String(order.userId || "")) || emptyCustomer(),
    ]),
  );

  return items.map((item) => ({
    ...item,
    customer: orderCustomerMap.get(Number(item.orderId) || 0) || emptyCustomer(),
  }));
}

/**
 * Profil + joriy hafta/oy balanslari.
 */
async function getLogisticaDetail(id) {
  const profile = await assertActiveLogistica(id);

  const [week, month] = await Promise.all([
    getBalanceForLogistica(id, { mode: "week" }),
    getBalanceForLogistica(id, { mode: "month" }),
  ]);

  return {
    profile: toDetailProfileJSON(profile),
    balance: {
      week: {
        balance: week.balance,
        count: week.count,
        periodLabel: week.periodLabel,
      },
      month: {
        balance: month.balance,
        count: month.count,
        periodLabel: month.periodLabel,
      },
    },
  };
}

/**
 * Tarix list + mijoz (read-time join). kind: all|handed_over|returned
 */
async function listLogisticaDetailHistory(id, query = {}) {
  await assertActiveLogistica(id);

  const kindRaw = String(query.kind || "all").trim().toLowerCase();
  const kind =
    kindRaw === "handed_over" || kindRaw === "returned" ? kindRaw : "all";

  const history = await listHistoryForLogistica(id, {
    page: query.page,
    limit: query.limit,
    kind,
    cargoServiceType: query.cargoServiceType || query.lane,
  });

  const items = await enrichHistoryItemsWithCustomers(history.items || []);

  return {
    ...history,
    items,
  };
}

module.exports = {
  getLogisticaDetail,
  listLogisticaDetailHistory,
};
