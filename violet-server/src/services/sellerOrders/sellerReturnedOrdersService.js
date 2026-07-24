const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const { toPublicReturnedOrder } = require("../deliveryOrders/courierReturnOrderService");
const {
  SELLER_RETURNED_LIST_REASON_TYPES,
} = require("../../unitLifecycle/constants");
const {
  buildReturnedProductsFilterOptions,
  resolveReturnedListPeriod,
  resolveSelectedFilters,
} = require("../returnedProducts/returnedProductsFilterService");

async function buildSellerReturnedFilterOptions(sellerId) {
  return buildReturnedProductsFilterOptions({
    sellerId: String(sellerId || "").trim(),
  });
}

async function aggregateReturnedStats(sellerId, match = {}) {
  const rows = await CourierReturnedOrder.aggregate([
    {
      $match: {
        sellerId: String(sellerId),
        ...match,
      },
    },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        totalQuantity: { $sum: "$quantity" },
        noAnswerCount: {
          $sum: {
            $cond: [{ $eq: ["$reasonType", "no_answer"] }, 1, 0],
          },
        },
        returnCount: {
          $sum: {
            $cond: [
              { $in: ["$reasonType", SELLER_RETURNED_LIST_REASON_TYPES] },
              1,
              0,
            ],
          },
        },
        defectiveCount: {
          $sum: {
            $cond: [{ $eq: ["$reasonType", "defective"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const row = rows[0] || {};
  return {
    totalCount: toNumber(row.totalCount, 0),
    totalAmount: toNumber(row.totalAmount, 0),
    totalQuantity: toNumber(row.totalQuantity, 0),
    noAnswerCount: toNumber(row.noAnswerCount, 0),
    returnCount: toNumber(row.returnCount, 0),
    defectiveCount: toNumber(row.defectiveCount, 0),
  };
}

async function listSellerReturnedOrders(sellerId, query = {}) {
  const shopId = String(sellerId || "").trim();
  const filterOptions = await buildSellerReturnedFilterOptions(shopId);
  const filters = resolveSelectedFilters(query, filterOptions);
  const listPeriod = resolveReturnedListPeriod(query, filters);

  const periodMatch = { [listPeriod.field]: listPeriod.value };
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const skip = (page - 1) * limit;

  const findFilter = {
    sellerId: shopId,
    reasonType: { $in: SELLER_RETURNED_LIST_REASON_TYPES },
    ...periodMatch,
  };

  const returnOnlyMatch = {
    reasonType: { $in: SELLER_RETURNED_LIST_REASON_TYPES },
  };

  const [rows, total, periodStats, allTimeStats, dayStats, weekStats, monthStats] =
    await Promise.all([
      CourierReturnedOrder.find(findFilter)
        .sort({ returnedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CourierReturnedOrder.countDocuments(findFilter),
      aggregateReturnedStats(shopId, { ...periodMatch, ...returnOnlyMatch }),
      aggregateReturnedStats(shopId, returnOnlyMatch),
      aggregateReturnedStats(shopId, { dateKey: filters.day, ...returnOnlyMatch }),
      aggregateReturnedStats(shopId, { weekKey: filters.week, ...returnOnlyMatch }),
      aggregateReturnedStats(shopId, { monthKey: filters.month, ...returnOnlyMatch }),
    ]);

  return {
    filters,
    filterOptions,
    activePeriod: listPeriod.period,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    stats: {
      allTime: allTimeStats,
      period: periodStats,
      day: dayStats,
      week: weekStats,
      month: monthStats,
    },
    orders: rows.map(toPublicReturnedOrder),
  };
}

/**
 * Siller "Buyurtmalar" → Javob bermadi filteri.
 * reasonType = no_answer bo‘lgan barcha yozuvlar (qayta qabul qilingan bo‘lsa ham
 * siller tugmalarni bosmaguncha ro‘yxatda qoladi).
 */
async function listSellerNoAnswerOrders(sellerId, query = {}) {
  const shopId = String(sellerId || "").trim();

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const skip = (page - 1) * limit;

  const findFilter = {
    reasonType: "no_answer",
    sellerId: shopId,
    $or: [{ resolvedAt: null }, { resolvedAt: { $exists: false } }],
  };

  const [rows, total] = await Promise.all([
    CourierReturnedOrder.find(findFilter)
      .sort({ returnedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourierReturnedOrder.countDocuments(findFilter),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    orders: rows.map((row) => {
      const publicRow = toPublicReturnedOrder(row);
      return {
        ...publicRow,
        trackingStatus: "no_answer",
        buyer: publicRow.customer,
        orderedAt: publicRow.orderedAt,
        noAnswerAt: publicRow.returnedAt,
        amount: publicRow.amount,
        quantity: publicRow.quantity,
      };
    }),
  };
}

module.exports = {
  listSellerReturnedOrders,
  listSellerNoAnswerOrders,
  buildSellerReturnedFilterOptions,
};
