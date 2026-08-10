/**
 * Mijozga pul qaytarish — inventar/qaytarish lifecycle dan alohida.
 *
 * Yaratiladi:
 *   - kuryer sotuvchiga topshirgach (return|defective + isPaid)
 *   - cargo logistica «Ha» (defective + isPaid)
 *   - siller/admin «Mavjud emas» (unavailable + isPaid) — returnedOrderId yo‘q
 * Tasdiqlanadi: asosiy admin «Mijozga summa qaytarildi».
 */

const { CustomerRefundRequest } = require("../../models/customerRefundRequest");
const { SellerAccount } = require("../../models/sellerAccount");
const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");
const {
  SELLER_RETURNED_LIST_REASON_TYPES,
} = require("../../unitLifecycle/constants");
const {
  buildReturnedProductsFilterOptions,
  resolveReturnedListPeriod,
  resolveSelectedFilters,
} = require("../returnedProducts/returnedProductsFilterService");
const {
  normalizeCargoCountry,
  cargoCountryDisplayLabel,
} = require("../../utils/cargoCountryNormalize");
const {
  isOrderPaid,
  resolvePeriodKeys,
} = require("../deliveryOrders/courierReturnOrderService");

const REFUND_STATUSES = new Set(["pending", "refunded", "all"]);
const REFUNDABLE_REASON_TYPES = new Set(SELLER_RETURNED_LIST_REASON_TYPES);

let refundIndexesReady = null;
let missingUnavailableRepairReady = null;

/**
 * Eski returnedOrderId unique (null ham unique) indexni olib tashlaydi.
 * Aks holda 2-chi seller_unavailable refund duplicate key bilan yiqiladi.
 */
async function ensureCustomerRefundIndexes() {
  if (refundIndexesReady) return refundIndexesReady;

  refundIndexesReady = (async () => {
    try {
      await CustomerRefundRequest.syncIndexes();
    } catch (error) {
      // Eski unique index bilan conflict bo‘lsa — drop qilib qayta sync
      try {
        const indexes = await CustomerRefundRequest.collection.indexes();
        for (const index of indexes) {
          const keys = index?.key && typeof index.key === "object" ? index.key : {};
          const keyNames = Object.keys(keys);
          const isReturnedOrderIdOnly =
            keyNames.length === 1 && keyNames[0] === "returnedOrderId";
          const isPartial =
            Boolean(index?.partialFilterExpression) ||
            String(index?.name || "") === "returnedOrderId_partial_unique";
          if (isReturnedOrderIdOnly && index.unique && !isPartial && index.name) {
            await CustomerRefundRequest.collection.dropIndex(index.name);
          }
        }
        await CustomerRefundRequest.syncIndexes();
      } catch (inner) {
        console.error(
          "[customer-refund] index ensure failed",
          inner?.message || inner,
        );
      }
    }
  })();

  return refundIndexesReady;
}

function formatProductCode(productId) {
  const id = Math.max(0, Math.floor(Number(productId) || 0));
  if (!id) return "";
  return `#${String(id).padStart(4, "0")}`;
}

/**
 * Allaqachon unavailable, lekin unique-null bug tufayli refundsiz qolganlarni to‘ldiradi.
 */
async function repairMissingSellerUnavailableRefundsOnce() {
  if (missingUnavailableRepairReady) return missingUnavailableRepairReady;

  missingUnavailableRepairReady = (async () => {
    await ensureCustomerRefundIndexes();
    try {
      const { Order } = require("../../models/order");
      const {
        resolveUnitTrackingStatus,
        resolveItemQuantity,
      } = require("../../productManagement/orderItemUnitTracking");

      const rows = await Order.find({
        $or: [
          { "items.trackingStatus": "unavailable" },
          { "items.units.trackingStatus": "unavailable" },
        ],
      })
        .sort({ updatedAt: -1, paidAt: -1 })
        .limit(300)
        .lean();

      for (const order of rows) {
        if (!isOrderPaid(order)) continue;
        const items = Array.isArray(order.items) ? order.items : [];
        for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
          const item = items[itemIndex];
          const qty = resolveItemQuantity(item);
          const hasUnits = Array.isArray(item?.units) && item.units.length > 0;

          if (hasUnits) {
            for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
              if (resolveUnitTrackingStatus(item, unitIndex) !== "unavailable") {
                continue;
              }
              await createCustomerRefundForSellerUnavailable({
                order,
                item,
                itemIndex,
                unitIndex,
                productCode: formatProductCode(item?.productId),
                _skipEnsure: true,
              });
            }
            continue;
          }

          if (String(item?.trackingStatus || "") !== "unavailable") continue;
          // Eski yozuv: units yo‘q — har dona uchun (yoki unitIndex 0 full legacy)
          for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
            await createCustomerRefundForSellerUnavailable({
              order,
              item,
              itemIndex,
              unitIndex,
              productCode: formatProductCode(item?.productId),
              _skipEnsure: true,
            });
          }
        }
      }
    } catch (error) {
      console.error(
        "[customer-refund] unavailable repair failed",
        error?.message || error,
      );
    }
  })();

  return missingUnavailableRepairReady;
}

function pickSellerName(account) {
  if (!account?.name) return "";
  if (typeof account.name === "string") return account.name;
  return String(account.name.uz || account.name.ru || "").trim();
}

function toPublicRefundRequest(doc, seller = null) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  const source = String(row.source || "courier").trim().toLowerCase() || "courier";
  const cargoCountry = normalizeCargoCountry(row.cargoCountry);
  return {
    id: String(row._id),
    returnedOrderId: String(row.returnedOrderId || ""),
    assignmentId: String(row.assignmentId || ""),
    shipmentId: row.shipmentId ? String(row.shipmentId) : null,
    source,
    cargoCountry,
    cargoCountryLabel: source === "cargo" ? cargoCountryDisplayLabel(cargoCountry) : "",
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    unitIndex: Number(row.unitIndex) || 0,
    productId: Number(row.productId) || 0,
    productCode: String(row.productCode || ""),
    sellerId: String(row.sellerId || ""),
    seller: seller || null,
    title: {
      uz: String(row.title?.uz || ""),
      ru: String(row.title?.ru || ""),
    },
    amount: Math.max(0, Number(row.amount) || 0),
    quantity: Math.max(1, Number(row.quantity) || 1),
    imageUrl: String(row.imageUrl || ""),
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
    reasonType: String(row.reasonType || "return"),
    customer: {
      firstName: String(row.customer?.firstName || ""),
      lastName: String(row.customer?.lastName || ""),
      phone: String(row.customer?.phone || ""),
    },
    courier: {
      firstName: String(row.courier?.firstName || ""),
      lastName: String(row.courier?.lastName || ""),
      phone: String(row.courier?.phone || ""),
      email: String(row.courier?.email || ""),
    },
    status: String(row.status || "pending"),
    returnedAt: row.returnedAt || null,
    dateKey: String(row.dateKey || ""),
    weekKey: String(row.weekKey || ""),
    monthKey: String(row.monthKey || ""),
    refundedAt: row.refundedAt || null,
    refundedBy: String(row.refundedBy || ""),
    createdAt: row.createdAt || null,
  };
}

function toPublicRefundSummary(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(row._id),
    status: String(row.status || "pending"),
    amount: Math.max(0, Number(row.amount) || 0),
    refundedAt: row.refundedAt || null,
  };
}

/**
 * completeReturn / cargo confirm dan keyin — inventarga tegmaydi.
 * return|defective + isPaid bo‘lsa pending refund ochadi (idempotent upsert).
 */
async function createCustomerRefundRequestIfNeeded(returnedDoc) {
  if (!returnedDoc) return null;

  const row = returnedDoc.toObject ? returnedDoc.toObject() : returnedDoc;
  const reasonType = String(row.reasonType || "").trim().toLowerCase();
  if (!REFUNDABLE_REASON_TYPES.has(reasonType)) return null;
  if (!row.isPaid) return null;

  const amount = Math.max(0, Number(row.amount) || 0);
  if (amount <= 0) return null;

  const returnedOrderId = row._id;
  if (!returnedOrderId) return null;

  const source =
    String(row.source || "courier").trim().toLowerCase() === "cargo"
      ? "cargo"
      : "courier";

  const payload = {
    returnedOrderId,
    assignmentId: row.assignmentId || null,
    shipmentId: row.shipmentId || null,
    source,
    cargoCountry: normalizeCargoCountry(row.cargoCountry),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    unitIndex: Number(row.unitIndex) || 0,
    productId: Number(row.productId) || 0,
    productCode: String(row.productCode || ""),
    sellerId: String(row.sellerId || "").trim(),
    title: {
      uz: String(row.title?.uz || ""),
      ru: String(row.title?.ru || ""),
    },
    amount,
    quantity: Math.max(1, Number(row.quantity) || 1),
    imageUrl: String(row.imageUrl || ""),
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
    reasonType,
    customer: {
      firstName: String(row.customer?.firstName || ""),
      lastName: String(row.customer?.lastName || ""),
      phone: String(row.customer?.phone || ""),
    },
    courier: {
      firstName: String(row.courier?.firstName || ""),
      lastName: String(row.courier?.lastName || ""),
      phone: String(row.courier?.phone || ""),
      email: String(row.courier?.email || ""),
    },
    status: "pending",
    returnedAt: row.returnedAt || new Date(),
    dateKey: String(row.dateKey || ""),
    weekKey: String(row.weekKey || ""),
    monthKey: String(row.monthKey || ""),
  };

  const saved = await CustomerRefundRequest.findOneAndUpdate(
    { returnedOrderId },
    {
      $setOnInsert: payload,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  return saved;
}

/**
 * Siller «Mavjud emas» — to‘langan (Payme/Click) bo‘lsa pending refund.
 * Cancel / return zanjiriga tegmaydi. Idempotent: orderId+itemIndex+unitIndex.
 * unitIndex berilmasa 0 (eski chaqiriqlar). Miqdor doim 1 dona summasi.
 */
async function createCustomerRefundForSellerUnavailable({
  order,
  item,
  itemIndex,
  unitIndex: unitIndexRaw = 0,
  productCode = "",
  _skipEnsure = false,
} = {}) {
  if (!order || !item) return null;
  if (!isOrderPaid(order)) return null;

  const lineQty = Math.max(1, Math.floor(Number(item.quantity) || 1));
  const unitIndex = Math.max(0, Math.floor(Number(unitIndexRaw) || 0));
  if (unitIndex >= lineQty) return null;

  const unitPrice = Math.max(0, Number(item.price) || 0);
  const lineTotal = Math.max(0, Number(item.lineTotal) || 0);
  const amount = Math.max(
    0,
    unitPrice ||
      (lineQty > 0 ? Math.round(lineTotal / lineQty) : 0) ||
      0,
  );
  if (amount <= 0) return null;

  const orderId = Number(order.id) || 0;
  const index = Number(itemIndex);
  if (!orderId || !Number.isInteger(index) || index < 0) return null;

  const now = new Date();
  const periods = resolvePeriodKeys(now);

  let customer = {
    firstName: "",
    lastName: "",
    phone: "",
  };
  if (order.userId) {
    const user = await User.findById(order.userId)
      .select("firstName lastName phone")
      .lean();
    if (user) {
      customer = {
        firstName: String(user.firstName || ""),
        lastName: String(user.lastName || ""),
        phone: String(user.phone || ""),
      };
    }
  }

  const titleRaw = item.title;
  const title =
    titleRaw && typeof titleRaw === "object"
      ? {
          uz: String(titleRaw.uz || ""),
          ru: String(titleRaw.ru || ""),
        }
      : {
          uz: String(titleRaw || ""),
          ru: "",
        };

  const payload = {
    assignmentId: null,
    shipmentId: null,
    source: "seller_unavailable",
    cargoCountry: "",
    orderId,
    itemIndex: index,
    unitIndex,
    productId: Number(item.productId) || 0,
    productCode: String(productCode || item.productCode || ""),
    sellerId: String(item.sellerId || "").trim(),
    title,
    amount,
    quantity: 1,
    imageUrl: String(item.image || item.imageUrl || ""),
    color: String(item.color || ""),
    size: String(item.size || ""),
    storage: String(item.storage || ""),
    model: String(item.model || ""),
    reasonType: "unavailable",
    customer,
    courier: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    },
    status: "pending",
    returnedAt: now,
    dateKey: periods.dateKey,
    weekKey: periods.weekKey,
    monthKey: periods.monthKey,
  };

  // returnedOrderId umuman yozilmaydi — unique null conflict bo‘lmasin.
  // Har bir dona orderId+itemIndex+unitIndex bo‘yicha alohida kartochka.
  if (!_skipEnsure) {
    await ensureCustomerRefundIndexes();
  }
  const saved = await CustomerRefundRequest.findOneAndUpdate(
    { orderId, itemIndex: index, unitIndex },
    { $setOnInsert: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );

  return saved;
}

async function loadSellerMap(sellerIds = []) {
  const ids = [...new Set(sellerIds.map((id) => String(id || "").trim()).filter(Boolean))];
  if (!ids.length) return new Map();

  const rows = await SellerAccount.find({ id: { $in: ids } })
    .select("id name logo")
    .lean();

  return new Map(
    rows.map((row) => [
      String(row.id),
      {
        id: String(row.id),
        name: pickSellerName(row) || String(row.id),
        logo: String(row.logo || ""),
      },
    ]),
  );
}

/**
 * returnedOrderId → refund summary (siller/admin returned list uchun).
 */
async function loadRefundSummaryByReturnedOrderIds(returnedOrderIds = []) {
  const ids = [...new Set(returnedOrderIds.filter(Boolean))];
  if (!ids.length) return new Map();

  const rows = await CustomerRefundRequest.find({
    returnedOrderId: { $in: ids },
  })
    .select("_id returnedOrderId status amount refundedAt")
    .lean();

  return new Map(
    rows.map((row) => [String(row.returnedOrderId), toPublicRefundSummary(row)]),
  );
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchMatch(searchRaw) {
  const search = String(searchRaw || "").trim();
  if (!search) return null;

  const rx = new RegExp(escapeRegex(search), "i");
  const phoneDigits = search.replace(/\D/g, "");
  const or = [
    { "customer.firstName": rx },
    { "customer.lastName": rx },
    { "customer.phone": rx },
    { productCode: rx },
  ];

  if (phoneDigits.length >= 3) {
    or.push({ "customer.phone": new RegExp(escapeRegex(phoneDigits), "i") });
  }

  // "Ism Familiya" birga
  const parts = search.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = new RegExp(escapeRegex(parts[0]), "i");
    const last = new RegExp(escapeRegex(parts.slice(1).join(" ")), "i");
    or.push({
      $and: [{ "customer.firstName": first }, { "customer.lastName": last }],
    });
    or.push({
      $and: [{ "customer.firstName": last }, { "customer.lastName": first }],
    });
  }

  return { $or: or };
}

function refundGroupKey(row) {
  return [
    Number(row.orderId) || 0,
    String(row.sellerId || "").trim(),
    String(row.status || "pending"),
    String(row.source || "courier"),
    String(row.reasonType || "return"),
  ].join(":");
}

function toUnitPublic(row) {
  return {
    id: String(row.id || ""),
    itemIndex: Number(row.itemIndex) || 0,
    unitIndex: Number(row.unitIndex) || 0,
    productId: Number(row.productId) || 0,
    productCode: String(row.productCode || ""),
    title: row.title || { uz: "", ru: "" },
    amount: Math.max(0, Number(row.amount) || 0),
    quantity: Math.max(1, Number(row.quantity) || 1),
    imageUrl: String(row.imageUrl || ""),
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
  };
}

/**
 * Bir order + bir siller (+ status/source/sabab) — bitta admin kartochka.
 */
function groupCustomerRefundRequests(items = []) {
  if (!Array.isArray(items) || !items.length) return [];

  const buckets = new Map();
  for (const row of items) {
    const key = refundGroupKey(row);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(row);
  }

  const groups = [];
  for (const rows of buckets.values()) {
    const sorted = [...rows].sort((a, b) => {
      const ai = Number(a.itemIndex) || 0;
      const bi = Number(b.itemIndex) || 0;
      if (ai !== bi) return ai - bi;
      return (Number(a.unitIndex) || 0) - (Number(b.unitIndex) || 0);
    });
    const primary = sorted[0];
    const units = sorted.map(toUnitPublic);
    const amount = units.reduce(
      (sum, unit) => sum + Math.max(0, Number(unit.amount) || 0),
      0,
    );
    const productCodes = [
      ...new Set(
        units.map((unit) => String(unit.productCode || "").trim()).filter(Boolean),
      ),
    ];

    groups.push({
      ...primary,
      amount,
      quantity: units.length,
      productCount: units.length,
      isGroup: units.length > 1,
      productCodes,
      productCode:
        productCodes.length <= 1
          ? productCodes[0] || primary.productCode || ""
          : productCodes.join(", "),
      title:
        units.length > 1
          ? {
              uz: `${units.length} ta mahsulot (buyurtma #${primary.orderId})`,
              ru: `${units.length} товара (заказ #${primary.orderId})`,
            }
          : primary.title,
      imageUrl: primary.imageUrl || units.find((u) => u.imageUrl)?.imageUrl || "",
      units,
      siblingIds: units.map((unit) => unit.id).filter(Boolean),
    });
  }

  groups.sort((a, b) => {
    const ta = new Date(a.returnedAt || 0).getTime();
    const tb = new Date(b.returnedAt || 0).getTime();
    return tb - ta;
  });

  return groups;
}

async function listAdminCustomerRefundRequests(query = {}) {
  await ensureCustomerRefundIndexes();
  await repairMissingSellerUnavailableRefundsOnce();

  const filterOptions = await buildReturnedProductsFilterOptions();
  const filters = resolveSelectedFilters(query, filterOptions);
  const listPeriod = resolveReturnedListPeriod(query, filters);

  const statusRaw = String(query.status || "pending").trim().toLowerCase();
  const status = REFUND_STATUSES.has(statusRaw) ? statusRaw : "pending";
  const search = String(query.search || query.q || "").trim();
  const searchMatch = buildSearchMatch(search);

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));

  const findFilter = {
    [listPeriod.field]: listPeriod.value,
  };
  if (status !== "all") {
    findFilter.status = status;
  }
  if (searchMatch) {
    findFilter.$and = [...(findFilter.$and || []), searchMatch];
  }

  const countBase = {
    [listPeriod.field]: listPeriod.value,
  };
  if (searchMatch) {
    countBase.$and = [searchMatch];
  }

  // Guruhlashdan oldin yetarli qator; pagination — guruhlar bo‘yicha
  const [rows, pendingCount, refundedCount] = await Promise.all([
    CustomerRefundRequest.find(findFilter)
      .sort({ returnedAt: -1, createdAt: -1 })
      .limit(500)
      .lean(),
    CustomerRefundRequest.countDocuments({
      ...countBase,
      status: "pending",
    }),
    CustomerRefundRequest.countDocuments({
      ...countBase,
      status: "refunded",
    }),
  ]);

  const sellerMap = await loadSellerMap(rows.map((row) => row.sellerId));
  const flatItems = rows.map((row) => {
    const sellerId = String(row.sellerId || "").trim();
    const seller = sellerMap.get(sellerId) || {
      id: sellerId || "—",
      name: sellerId || "Noma’lum siller",
      logo: "",
    };
    return toPublicRefundRequest(row, seller);
  });

  const grouped = groupCustomerRefundRequests(flatItems);
  const total = grouped.length;
  const skip = (page - 1) * limit;
  const items = grouped.slice(skip, skip + limit);

  return {
    filters,
    filterOptions,
    activePeriod: listPeriod.period,
    status,
    search,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    counts: {
      pending: pendingCount,
      refunded: refundedCount,
    },
    items,
  };
}

async function markCustomerRefundRefunded(id, adminId = "") {
  const doc = await CustomerRefundRequest.findById(String(id || "").trim());
  if (!doc) {
    throw new HttpError(404, "Pul qaytarish so‘rovi topilmadi", "REFUND_NOT_FOUND");
  }
  if (String(doc.status) === "refunded") {
    return toPublicRefundRequest(doc);
  }
  if (String(doc.status) !== "pending") {
    throw new HttpError(409, "So‘rov holati noto‘g‘ri", "REFUND_INVALID_STATUS");
  }

  const now = new Date();
  const reviewedBy = String(adminId || "").trim();
  const markOne = async (row) => {
    if (String(row.status) === "refunded") return row;
    row.status = "refunded";
    row.refundedAt = now;
    row.refundedBy = reviewedBy;
    await row.save();
    return row;
  };

  await markOne(doc);

  // Bir order + siller guruhidagi qolgan pendinglarni birga yopish
  const siblings = await CustomerRefundRequest.find({
    orderId: Number(doc.orderId) || 0,
    sellerId: String(doc.sellerId || "").trim(),
    status: "pending",
    source: String(doc.source || "courier"),
    reasonType: String(doc.reasonType || "return"),
    _id: { $ne: doc._id },
  });

  for (const sibling of siblings) {
    await markOne(sibling);
  }

  return toPublicRefundRequest(doc);
}

module.exports = {
  createCustomerRefundRequestIfNeeded,
  createCustomerRefundForSellerUnavailable,
  loadRefundSummaryByReturnedOrderIds,
  listAdminCustomerRefundRequests,
  markCustomerRefundRefunded,
  toPublicRefundRequest,
  toPublicRefundSummary,
};
