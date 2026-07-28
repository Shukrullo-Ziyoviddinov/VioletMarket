/**
 * Mijozga pul qaytarish — inventar/qaytarish lifecycle dan alohida.
 *
 * Yaratiladi:
 *   - kuryer sotuvchiga topshirgach (return|defective + isPaid)
 *   - cargo logistica «Ha» (defective + isPaid)
 * Tasdiqlanadi: asosiy admin «Mijozga summa qaytarildi».
 */

const { CustomerRefundRequest } = require("../../models/customerRefundRequest");
const { SellerAccount } = require("../../models/sellerAccount");
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

const REFUND_STATUSES = new Set(["pending", "refunded", "all"]);
const REFUNDABLE_REASON_TYPES = new Set(SELLER_RETURNED_LIST_REASON_TYPES);

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

async function listAdminCustomerRefundRequests(query = {}) {
  const filterOptions = await buildReturnedProductsFilterOptions();
  const filters = resolveSelectedFilters(query, filterOptions);
  const listPeriod = resolveReturnedListPeriod(query, filters);

  const statusRaw = String(query.status || "pending").trim().toLowerCase();
  const status = REFUND_STATUSES.has(statusRaw) ? statusRaw : "pending";
  const search = String(query.search || query.q || "").trim();
  const searchMatch = buildSearchMatch(search);

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const skip = (page - 1) * limit;

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

  const [rows, total, pendingCount, refundedCount] = await Promise.all([
    CustomerRefundRequest.find(findFilter)
      .sort({ returnedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CustomerRefundRequest.countDocuments(findFilter),
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
  const items = rows.map((row) => {
    const sellerId = String(row.sellerId || "").trim();
    const seller = sellerMap.get(sellerId) || {
      id: sellerId || "—",
      name: sellerId || "Noma’lum siller",
      logo: "",
    };
    return toPublicRefundRequest(row, seller);
  });

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

  doc.status = "refunded";
  doc.refundedAt = new Date();
  doc.refundedBy = String(adminId || "").trim();
  await doc.save();

  const sellerMap = await loadSellerMap([doc.sellerId]);
  const seller = sellerMap.get(String(doc.sellerId || "").trim()) || null;
  return toPublicRefundRequest(doc, seller);
}

module.exports = {
  createCustomerRefundRequestIfNeeded,
  loadRefundSummaryByReturnedOrderIds,
  listAdminCustomerRefundRequests,
  markCustomerRefundRefunded,
  toPublicRefundRequest,
  toPublicRefundSummary,
};
