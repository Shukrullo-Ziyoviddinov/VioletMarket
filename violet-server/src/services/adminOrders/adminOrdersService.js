const { Order } = require("../../models/order");
const { User } = require("../../models/user");
const { SellerAccount } = require("../../models/sellerAccount");
const { CourierReturnedOrder } = require("../../models/courierReturnedOrder");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");
const {
  buildSellerOrderItemCards,
  formatOrderCode,
  annotateVisibleFulfillmentGroups,
  sliceKeepingFulfillmentGroups,
} = require("../../productManagement/sellerOrders");
const {
  listAssignmentsByKeys,
  assignmentLookupKey,
} = require("../deliveryOrders/courierOrderAssignmentService");
const { toPublicReturnedOrder } = require("../deliveryOrders/courierReturnOrderService");
const sellerOrderTrackingService = require("../sellerOrders/sellerOrderTrackingService");
const {
  resolveSellerPipelineMode,
} = require("../../productManagement/sellerPipelineMode");
const cargoShipmentSellerService = require("../cargoShipments/cargoShipmentSellerService");
const {
  listCargoShipmentsByOrderItems,
  shipmentLookupKey,
} = cargoShipmentSellerService;
const foreignUzCourierBridgeService = require("../cargoShipments/foreignUzCourierBridgeService");

const DEFAULT_PAGE_SIZE = 100;

function normalizePipeline(value) {
  const mode = String(value || "")
    .trim()
    .toLowerCase();
  if (mode === "foreign" || mode === "local") return mode;
  return "";
}

function isTruthyQuery(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function cardMatchesPipeline(card, pipeline) {
  if (!pipeline) return true;
  const country = card?.seller?.sellerCountry || "";
  return resolveSellerPipelineMode(country) === pipeline;
}

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
  const pipeline = normalizePipeline(query.pipeline);

  const rows = await CourierReturnedOrder.find({
    reasonType: "no_answer",
    $or: [{ resolvedAt: null }, { resolvedAt: { $exists: false } }],
  })
    .sort({ returnedAt: -1, createdAt: -1 })
    .lean();

  const sellerMap = await loadSellerMap(rows.map((row) => row.sellerId));
  const orders = rows
    .map((row) => {
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
    })
    .filter((card) => cardMatchesPipeline(card, pipeline));

  const total = orders.length;
  const start = (page - 1) * limit;

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    orders: orders.slice(start, start + limit),
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
 * Har bir jarayon (filter) bo‘yicha buyurtma soni.
 * query.pipeline = foreign | local | (bo‘sh = hammasi)
 * Foreign courier count = Toshkent omborida (handed_to_cargo + ready).
 */
async function getAdminOrderCounts(query = {}) {
  const pipeline = normalizePipeline(query.pipeline);

  const [rawCards, noAnswerRows] = await Promise.all([
    buildAllAdminOrderCards(),
    CourierReturnedOrder.find({
      reasonType: "no_answer",
      $or: [{ resolvedAt: null }, { resolvedAt: { $exists: false } }],
    })
      .select({ sellerId: 1 })
      .lean(),
  ]);

  const sellerIds = [
    ...new Set([
      ...rawCards.map((card) => cleanSellerId(card.sellerId)),
      ...noAnswerRows.map((row) => cleanSellerId(row.sellerId)),
    ].filter(Boolean)),
  ];
  const sellerMap = await loadSellerMap(sellerIds);

  const allCards = rawCards
    .map((card) => attachSeller(card, sellerMap))
    .filter((card) => cardMatchesPipeline(card, pipeline));

  const noAnswerTotal = noAnswerRows
    .map((row) =>
      attachSeller(
        { sellerId: cleanSellerId(row.sellerId) },
        sellerMap,
      ),
    )
    .filter((card) => cardMatchesPipeline(card, pipeline)).length;

  const counts = {
    accepted: 0,
    seller_confirmed: 0,
    collected: 0,
    handed_to_courier: 0,
    handed_to_cargo: 0,
    no_answer: noAnswerTotal,
  };

  for (const card of allCards) {
    const status = String(card.trackingStatus || "");
    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += 1;
    }
  }

  let courierCount = counts.collected;
  if (pipeline === "foreign") {
    const cargoCandidates = allCards.filter(
      (card) => String(card.trackingStatus || "") === "handed_to_cargo",
    );
    if (cargoCandidates.length) {
      const shipments = await listCargoShipmentsByOrderItems(
        cargoCandidates.map((card) => ({
          orderId: card.orderId,
          itemIndex: card.itemIndex,
        })),
      );
      const readyKeys = new Set(
        shipments
          .filter((row) => foreignUzCourierBridgeService.isShipmentReadyForUzCourier(row))
          .map((row) => shipmentLookupKey(row.orderId, row.itemIndex)),
      );
      courierCount = cargoCandidates.filter((card) =>
        readyKeys.has(shipmentLookupKey(card.orderId, card.itemIndex)),
      ).length;
    } else {
      courierCount = 0;
    }
  }

  return {
    confirmation: counts.accepted,
    collection: counts.seller_confirmed,
    courier: courierCount,
    handed: counts.handed_to_courier,
    noAnswer: counts.no_answer,
    byStatus: counts,
    pipeline: pipeline || "all",
  };
}

/**
 * Asosiy admin — sillerlar buyurtmalari (tracking + pipeline filter bilan).
 * uzWarehouseReady=1 + handed_to_cargo → faqat Toshkent omboridagilar (Xorij→UZB courier).
 */
async function listAdminOrders(query = {}) {
  const requestedTrackingStatus = String(query.trackingStatus || "").trim();
  if (requestedTrackingStatus === "no_answer") {
    return listAdminNoAnswerOrders(query);
  }

  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(200, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));
  const pipeline = normalizePipeline(query.pipeline);
  const uzWarehouseReady = isTruthyQuery(query.uzWarehouseReady);

  const allCards = await buildAllAdminOrderCards();
  const sellerMapForFilter = await loadSellerMap(
    allCards.map((card) => card.sellerId),
  );
  let filteredCards = allCards
    .map((card) => attachSeller(card, sellerMapForFilter))
    .filter((card) => {
      if (requestedTrackingStatus && card.trackingStatus !== requestedTrackingStatus) {
        return false;
      }
      return cardMatchesPipeline(card, pipeline);
    });

  if (uzWarehouseReady && requestedTrackingStatus === "handed_to_cargo") {
    const shipments = await listCargoShipmentsByOrderItems(
      filteredCards.map((card) => ({
        orderId: card.orderId,
        itemIndex: card.itemIndex,
      })),
    );
    const byKey = new Map(
      shipments.map((row) => [shipmentLookupKey(row.orderId, row.itemIndex), row]),
    );
    filteredCards = filteredCards
      .map((card) => {
        const shipment = byKey.get(
          shipmentLookupKey(card.orderId, card.itemIndex),
        );
        return {
          ...card,
          cargoShipment: shipment || null,
          uzWarehouseReady: foreignUzCourierBridgeService.isShipmentReadyForUzCourier(
            shipment,
          ),
        };
      })
      .filter((card) => card.uzWarehouseReady);
  }

  filteredCards = annotateVisibleFulfillmentGroups(filteredCards);

  const total = filteredCards.length;
  const start = (page - 1) * limit;
  let orders = sliceKeepingFulfillmentGroups(filteredCards, start, limit);

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
  const account = await SellerAccount.findOne({ id: sellerId })
    .select({ sellerCountry: 1 })
    .lean();
  const pipelineMode = resolveSellerPipelineMode(account?.sellerCountry);

  if (pipelineMode === "foreign") {
    return foreignUzCourierBridgeService.handoffForeignItemToUzCourier(
      sellerId,
      payload.orderId,
      payload.itemIndex,
      payload,
    );
  }

  return sellerOrderTrackingService.handoffSellerOrderItem(
    sellerId,
    payload.orderId,
    payload.itemIndex,
  );
}

async function confirmAdminOrderGroup(payload = {}) {
  const sellerId = cleanSellerId(payload.sellerId);
  return sellerOrderTrackingService.confirmSellerOrderGroup(
    sellerId,
    payload.orderId,
    { itemIndexes: payload.itemIndexes },
  );
}

async function collectAdminOrderGroup(payload = {}) {
  const sellerId = cleanSellerId(payload.sellerId);
  return sellerOrderTrackingService.collectSellerOrderGroup(
    sellerId,
    payload.orderId,
    { itemIndexes: payload.itemIndexes },
  );
}

/**
 * Local UZB yoki xorij→UZB bulk handoff.
 * Xorij: bir xil ombor pickup + soft-skip.
 */
async function handoffAdminOrderGroup(payload = {}) {
  const sellerId = cleanSellerId(payload.sellerId);
  const account = await SellerAccount.findOne({ id: sellerId })
    .select({ sellerCountry: 1 })
    .lean();
  const pipelineMode = resolveSellerPipelineMode(account?.sellerCountry);

  if (pipelineMode === "foreign") {
    return foreignUzCourierBridgeService.handoffForeignOrderGroupToUzCourier(
      sellerId,
      payload.orderId,
      payload,
    );
  }

  return sellerOrderTrackingService.handoffSellerOrderGroup(
    sellerId,
    payload.orderId,
    { itemIndexes: payload.itemIndexes },
  );
}

async function submitAdminOrderGroupToCargo(payload = {}) {
  const sellerId = cleanSellerId(payload.sellerId);
  return cargoShipmentSellerService.submitSellerOrderGroupToCargo(
    sellerId,
    payload.orderId,
    {
      itemIndexes: payload.itemIndexes,
      note: payload.note,
      groupId: payload.groupId,
    },
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

async function cancelAdminOrderGroup(payload = {}) {
  const sellerId = cleanSellerId(payload.sellerId);
  return sellerOrderTrackingService.cancelSellerOrderGroup(
    sellerId,
    payload.orderId,
    { itemIndexes: payload.itemIndexes },
  );
}

async function markUnavailableAdminOrderItem(payload = {}) {
  const sellerId = cleanSellerId(payload.sellerId);
  return sellerOrderTrackingService.markUnavailableSellerOrderItem(
    sellerId,
    payload.orderId,
    payload.itemIndex,
    { unitIndexes: payload.unitIndexes },
  );
}

module.exports = {
  listAdminOrders,
  getAdminOrderCounts,
  confirmAdminOrderItem,
  collectAdminOrderItem,
  handoffAdminOrderItem,
  confirmAdminOrderGroup,
  collectAdminOrderGroup,
  handoffAdminOrderGroup,
  submitAdminOrderGroupToCargo,
  cancelAdminOrderItem,
  cancelAdminOrderGroup,
  markUnavailableAdminOrderItem,
};
