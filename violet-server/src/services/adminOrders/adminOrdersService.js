const { Order } = require("../../models/order");
const { User } = require("../../models/user");
const { SellerAccount } = require("../../models/sellerAccount");
const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  buildSellerOrderItemCards,
  formatOrderCode,
} = require("../../productManagement/sellerOrders");
const {
  listAssignmentsByKeys,
  assignmentLookupKey,
} = require("../deliveryOrders/courierOrderAssignmentService");
const { toPublicReturnedOrder } = require("../deliveryOrders/courierReturnOrderService");
const sellerOrderTrackingService = require("../sellerOrders/sellerOrderTrackingService");

const DEFAULT_PAGE_SIZE = 100;

function cleanSellerId(value) {
  return String(value || "").trim();
}

function pickSellerName(account) {
  if (!account?.name) return "";
  if (typeof account.name === "string") return account.name;
  return String(account.name.uz || account.name.ru || "").trim();
}

async function loadSellerMap(sellerIds = []) {
  const ids = [...new Set(sellerIds.map(cleanSellerId).filter(Boolean))];
  if (!ids.length) return new Map();

  const rows = await SellerAccount.find({ id: { $in: ids } })
    .select("id name logo sellerCountry status")
    .lean();

  return new Map(
    rows.map((row) => [
      String(row.id),
      {
        id: String(row.id),
        name: pickSellerName(row) || String(row.id),
        logo: String(row.logo || ""),
        sellerCountry: String(row.sellerCountry || ""),
        status: String(row.status || ""),
      },
    ]),
  );
}

function attachSeller(card, sellerMap) {
  const sellerId = cleanSellerId(card.sellerId);
  const seller = sellerMap.get(sellerId) || {
    id: sellerId || "—",
    name: sellerId || "Noma'lum siller",
    logo: "",
    sellerCountry: "",
    status: "",
  };
  return {
    ...card,
    sellerId: seller.id,
    seller,
  };
}

async function listAdminNoAnswerOrders(query = {}) {
  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(200, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    CourierReturnedOrder.find({
      reasonType: "no_answer",
      $or: [{ resolvedAt: null }, { resolvedAt: { $exists: false } }],
    })
      .sort({ returnedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourierReturnedOrder.countDocuments({
      reasonType: "no_answer",
      $or: [{ resolvedAt: null }, { resolvedAt: { $exists: false } }],
    }),
  ]);

  const sellerMap = await loadSellerMap(rows.map((row) => row.sellerId));

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    orders: rows.map((row) => {
      const publicRow = toPublicReturnedOrder(row);
      return attachSeller(
        {
          ...publicRow,
          orderCode: formatOrderCode(publicRow.orderId),
          trackingStatus: "no_answer",
          buyer: publicRow.customer,
          orderedAt: publicRow.orderedAt,
          noAnswerAt: publicRow.returnedAt,
          amount: publicRow.amount,
          quantity: publicRow.quantity,
        },
        sellerMap,
      );
    }),
  };
}

async function buildAllAdminOrderCards() {
  const rows = await Order.find({})
    .sort({ paidAt: -1, createdAt: -1, id: -1 })
    .lean();

  const userIds = [...new Set(rows.map((row) => String(row.userId || "")).filter(Boolean))];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } })
        .select({ firstName: 1, lastName: 1, phone: 1 })
        .lean()
    : [];
  const userById = new Map(users.map((row) => [String(row._id), row]));

  const allCards = [];
  for (const order of rows) {
    const user = userById.get(String(order.userId));
    const sellerIds = [
      ...new Set(
        (Array.isArray(order.items) ? order.items : [])
          .map((item) => cleanSellerId(item?.sellerId))
          .filter(Boolean),
      ),
    ];

    for (const sellerId of sellerIds) {
      const cards = buildSellerOrderItemCards(order, user, sellerId).map((card) => ({
        ...card,
        sellerId,
      }));
      allCards.push(...cards);
    }
  }

  return allCards;
}

/**
 * Har bir jarayon (filter) bo‘yicha barcha sillerlar buyurtma soni.
 */
async function getAdminOrderCounts() {
  const [allCards, noAnswerTotal] = await Promise.all([
    buildAllAdminOrderCards(),
    CourierReturnedOrder.countDocuments({
      reasonType: "no_answer",
      $or: [{ resolvedAt: null }, { resolvedAt: { $exists: false } }],
    }),
  ]);

  const counts = {
    accepted: 0,
    seller_confirmed: 0,
    collected: 0,
    handed_to_courier: 0,
    no_answer: noAnswerTotal,
  };

  for (const card of allCards) {
    const status = String(card.trackingStatus || "");
    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += 1;
    }
  }

  return {
    confirmation: counts.accepted,
    collection: counts.seller_confirmed,
    courier: counts.collected,
    handed: counts.handed_to_courier,
    noAnswer: counts.no_answer,
    byStatus: counts,
  };
}

/**
 * Asosiy admin — barcha sillerlar buyurtmalari (tracking filter bilan).
 */
async function listAdminOrders(query = {}) {
  const requestedTrackingStatus = String(query.trackingStatus || "").trim();
  if (requestedTrackingStatus === "no_answer") {
    return listAdminNoAnswerOrders(query);
  }

  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(200, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));

  const allCards = await buildAllAdminOrderCards();

  const filteredCards = requestedTrackingStatus
    ? allCards.filter((card) => card.trackingStatus === requestedTrackingStatus)
    : allCards;

  const total = filteredCards.length;
  const start = (page - 1) * limit;
  let orders = filteredCards.slice(start, start + limit);

  const sellerMap = await loadSellerMap(orders.map((card) => card.sellerId));
  orders = orders.map((card) => attachSeller(card, sellerMap));

  if (requestedTrackingStatus === "handed_to_courier" && orders.length) {
    const assignments = await listAssignmentsByKeys(
      orders.map((card) => ({
        orderId: card.orderId,
        itemIndex: card.itemIndex,
        unitIndex: card.unitIndex,
      })),
    );
    const byKey = new Map();
    for (const row of assignments) {
      const key = assignmentLookupKey(row.orderId, row.itemIndex, row.unitIndex);
      const existing = byKey.get(key);
      const rowStatus = String(row.status || "");
      if (!existing) {
        byKey.set(key, row);
        continue;
      }
      if (String(existing.status || "") === "cancelled" && rowStatus !== "cancelled") {
        byKey.set(key, row);
      }
    }

    orders = orders.map((card) => {
      const assignment = byKey.get(
        assignmentLookupKey(card.orderId, card.itemIndex, card.unitIndex),
      );
      const assignmentStatus = String(assignment?.status || "");
      if (!assignment || assignmentStatus === "cancelled") {
        return {
          ...card,
          courierAccepted: false,
          courier: null,
          acceptedAt: null,
        };
      }
      return {
        ...card,
        courierAccepted: true,
        courier: assignment.courier,
        acceptedAt: assignment.acceptedAt,
        assignmentId: assignment.id,
      };
    });
  }

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    orders,
  };
}

async function confirmAdminOrderItem(payload = {}) {
  const sellerId = cleanSellerId(payload.sellerId);
  return sellerOrderTrackingService.confirmSellerOrderItem(
    sellerId,
    payload.orderId,
    payload.itemIndex,
  );
}

async function collectAdminOrderItem(payload = {}) {
  const sellerId = cleanSellerId(payload.sellerId);
  return sellerOrderTrackingService.collectSellerOrderItem(
    sellerId,
    payload.orderId,
    payload.itemIndex,
  );
}

async function handoffAdminOrderItem(payload = {}) {
  const sellerId = cleanSellerId(payload.sellerId);
  return sellerOrderTrackingService.handoffSellerOrderItem(
    sellerId,
    payload.orderId,
    payload.itemIndex,
  );
}

async function cancelAdminOrderItem(payload = {}) {
  const sellerId = cleanSellerId(payload.sellerId);
  return sellerOrderTrackingService.cancelSellerOrderItem(
    sellerId,
    payload.orderId,
    payload.itemIndex,
  );
}

module.exports = {
  listAdminOrders,
  getAdminOrderCounts,
  confirmAdminOrderItem,
  collectAdminOrderItem,
  handoffAdminOrderItem,
  cancelAdminOrderItem,
};
