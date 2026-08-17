const { Order } = require("../../models/order");
const { User } = require("../../models/user");
const { HttpError } = require("../../utils/httpError");
const { resolvePublicAssetUrl } = require("../../utils/resolvePublicAssetUrl");
const { toNumber } = require("../../services/adminSales/salesStatisticsHelpers");
const {
  VALID_PAYMENT_METHODS,
  normalizePaymentMethod,
  resolveStoredPaymentMethod,
} = require("../checkout/paymentMethods");
const { normalizeOrderTrackingStatus } = require("../unitTracking/orderTracking");
const {
  resolveUnitTrackingStatus,
  resolveUnitTrackingHistory,
} = require("../unitTracking/orderItemUnitTracking");
const {
  listAssignmentsByKeys,
  assignmentLookupKey,
} = require("../../services/deliveryOrders/courierOrderAssignmentService");
const {
  listSellerNoAnswerOrders,
} = require("../../services/sellerOrders/sellerReturnedOrdersService");
const {
  listCargoShipmentsByOrderItems,
  shipmentLookupKey,
} = require("../../services/cargoShipments/cargoShipmentSellerService");
const { resolveOptionLabel } = require("../../unitLifecycle/optionLabel");
const { normalizeCargoServiceType } = require("../../utils/cargoServiceType");
const { SellerAccount } = require("../../models/sellerAccount");
const { resolveSellerPipelineMode } = require("./sellerPipelineMode");

const DEFAULT_PAGE_SIZE = 20;

function cleanSellerId(value) {
  return String(value || "").trim();
}

/**
 * Bir checkout + bir siller fulfillment guruhi (UI blok kaliti).
 * To‘lov / qaytarish / DP zanjiriga tegmaydi.
 */
function buildFulfillmentGroupKey(orderId, sellerId) {
  return `${Number(orderId) || 0}:${cleanSellerId(sellerId)}`;
}

function stampFulfillmentGroupFields(cards, orderId, sellerId) {
  const list = Array.isArray(cards) ? cards : [];
  if (!list.length) return list;

  const groupKey = buildFulfillmentGroupKey(orderId, sellerId);
  const siblingIds = list.map((card) => card.id);
  const groupItemIndexes = [
    ...new Set(list.map((card) => Number(card.itemIndex) || 0)),
  ];

  return list.map((card) => ({
    ...card,
    sellerId: cleanSellerId(sellerId),
    groupKey,
    groupSize: siblingIds.length,
    groupItemCount: groupItemIndexes.length,
    siblingIds,
  }));
}

/**
 * Status filterdan keyin: joriy listda shu guruhdan nechta sibling bor.
 */
function annotateVisibleFulfillmentGroups(cards) {
  const list = Array.isArray(cards) ? cards : [];
  if (!list.length) return list;

  const byKey = new Map();
  for (const card of list) {
    const key =
      String(card?.groupKey || "").trim() ||
      buildFulfillmentGroupKey(card?.orderId, card?.sellerId);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(card.id);
  }

  return list.map((card) => {
    const key =
      String(card?.groupKey || "").trim() ||
      buildFulfillmentGroupKey(card?.orderId, card?.sellerId);
    const visibleSiblingIds = byKey.get(key) || [card.id];
    return {
      ...card,
      groupKey: key,
      visibleGroupSize: visibleSiblingIds.length,
      visibleSiblingIds,
    };
  });
}

/**
 * Flat pagination oynasini guruh chegarasiga kengaytiradi —
 * bir groupKey siblinglari sahifa chetida bo‘linib qolmasin.
 * Natija limit dan biroz katta bo‘lishi mumkin.
 */
function sliceKeepingFulfillmentGroups(cards, start, limit) {
  const list = Array.isArray(cards) ? cards : [];
  if (!list.length || limit <= 0) return [];
  if (start >= list.length) return [];

  let from = Math.max(0, Math.floor(Number(start) || 0));
  let to = Math.min(list.length, from + Math.max(1, Math.floor(Number(limit) || 1)));

  const keyAt = (index) => {
    const card = list[index];
    return (
      String(card?.groupKey || "").trim() ||
      buildFulfillmentGroupKey(card?.orderId, card?.sellerId)
    );
  };

  if (from > 0) {
    const edgeKey = keyAt(from);
    while (from > 0 && keyAt(from - 1) === edgeKey) {
      from -= 1;
    }
  }

  if (to > from && to < list.length) {
    const edgeKey = keyAt(to - 1);
    while (to < list.length && keyAt(to) === edgeKey) {
      to += 1;
    }
  }

  return list.slice(from, to);
}

async function resolveSellerPipelineContext(sellerId) {
  const account = await SellerAccount.findOne({ id: sellerId })
    .select({ sellerCountry: 1 })
    .lean();
  const sellerCountry = String(account?.sellerCountry || "")
    .trim()
    .toLowerCase();
  return {
    sellerCountry,
    pipelineMode: resolveSellerPipelineMode(sellerCountry),
  };
}

function stampSellerPipelineFields(cards, pipelineContext) {
  const pipelineMode = pipelineContext?.pipelineMode || "local";
  const sellerCountry = String(pipelineContext?.sellerCountry || "").trim();
  return (Array.isArray(cards) ? cards : []).map((card) => ({
    ...card,
    pipelineMode,
    sellerCountry,
    cargoServiceType:
      pipelineMode === "foreign" ? card.cargoServiceType || null : null,
  }));
}

function formatOrderCode(orderId) {
  const id = Math.max(0, Math.floor(toNumber(orderId, 0)));
  return `#${String(id).padStart(4, "0")}`;
}

function formatProductCode(productId) {
  const id = Math.max(0, Math.floor(toNumber(productId, 0)));
  if (!id) return "";
  return `#${String(id).padStart(4, "0")}`;
}

function resolveTitle(title) {
  if (title && typeof title === "object") {
    return {
      uz: String(title.uz || "").trim(),
      ru: String(title.ru || "").trim(),
    };
  }
  const text = String(title || "").trim();
  return { uz: text, ru: text };
}

function mapSellerOrderItems(items, sellerId) {
  return (Array.isArray(items) ? items : [])
    .map((item, itemIndex) => ({ item, itemIndex }))
    .filter(({ item }) => cleanSellerId(item?.sellerId) === sellerId)
    .map(({ item, itemIndex }) => {
      const productId = Math.max(0, Math.floor(toNumber(item?.productId, 0)));
      const quantity = Math.max(1, Math.floor(toNumber(item?.quantity, 1)));
      const price = Math.max(0, toNumber(item?.price, 0));
      const originalPrice = Math.max(0, toNumber(item?.originalPrice, 0));
      const lineTotal = Math.max(0, toNumber(item?.lineTotal, price * quantity));

      return {
        itemIndex,
        productId,
        productCode: formatProductCode(productId),
        title: resolveTitle(item?.title),
        imageUrl: resolvePublicAssetUrl(String(item?.image || "").trim() || "/img/no-image.png"),
        color: resolveOptionLabel(item?.color),
        size: resolveOptionLabel(item?.size),
        storage: resolveOptionLabel(item?.storage),
        model: resolveOptionLabel(item?.model),
        quantity,
        price,
        originalPrice,
        lineTotal,
        trackingStatus: normalizeOrderTrackingStatus(item?.trackingStatus),
        trackingHistory: Array.isArray(item?.trackingHistory) ? item.trackingHistory : [],
        units: Array.isArray(item?.units) ? item.units : undefined,
        cargoServiceType: normalizeCargoServiceType(item?.cargoServiceType),
      };
    });
}

/**
 * Bitta buyurtmadagi har bir seller mahsuloti — alohida kartochka (alohida shtrix).
 * quantity > 1 bo'lsa ham har bir dona alohida kartochka.
 */
function buildSellerOrderItemCards(order, user, sellerId) {
  const sellerItems = mapSellerOrderItems(order?.items, sellerId);
  const orderedAt = order?.paidAt || order?.createdAt || null;
  const buyer = {
    firstName: String(user?.firstName || "").trim(),
    lastName: String(user?.lastName || "").trim(),
    phone: String(user?.phone || "").trim(),
  };
  const paymentMethod = resolveStoredPaymentMethod(order?.paymentMethod);
  const status = String(order?.status || "paid");
  const orderId = Number(order?.id) || 0;
  const orderCode = formatOrderCode(orderId);

  const cards = [];

  sellerItems.forEach((item) => {
    const unitCount = Math.max(1, item.quantity);
    const unitPrice = unitCount > 0 ? Math.max(0, Number(item.price) || 0) : 0;

    for (let unitIndex = 0; unitIndex < unitCount; unitIndex += 1) {
      const unitTrackingStatus = resolveUnitTrackingStatus(item, unitIndex);
      const unitHistory = resolveUnitTrackingHistory(item, unitIndex);

      cards.push({
        id: `${orderId}-${item.productId}-${item.itemIndex}-${unitIndex}`,
        orderId,
        itemIndex: item.itemIndex,
        orderCode,
        productId: item.productId,
        productCode: item.productCode,
        title: item.title,
        imageUrl: item.imageUrl,
        color: item.color,
        size: item.size,
        storage: item.storage,
        model: item.model,
        orderedAt,
        buyer,
        paymentMethod,
        status,
        amount: unitPrice,
        originalPrice: item.originalPrice,
        quantity: 1,
        trackingStatus: unitTrackingStatus,
        confirmedAt:
          unitHistory.find(
            (entry) => String(entry?.status || "") === "seller_confirmed",
          )?.at || null,
        handedToCourierAt:
          unitHistory.find(
            (entry) => String(entry?.status || "") === "handed_to_courier",
          )?.at || null,
        readyForCargoAt:
          unitHistory.find(
            (entry) => String(entry?.status || "") === "ready_for_cargo",
          )?.at || null,
        handedToCargoAt:
          unitHistory.find(
            (entry) => String(entry?.status || "") === "handed_to_cargo",
          )?.at || null,
        unitIndex,
        cargoServiceType: item.cargoServiceType || null,
      });
    }
  });

  return stampFulfillmentGroupFields(cards, orderId, sellerId);
}

/** @deprecated Use buildSellerOrderItemCards — kept for export stability */
function buildSellerOrderCard(order, user, sellerId) {
  const cards = buildSellerOrderItemCards(order, user, sellerId);
  if (!cards.length) {
    return {
      id: Number(order?.id) || 0,
      orderCode: formatOrderCode(order?.id),
      orderedAt: order?.paidAt || order?.createdAt || null,
      buyer: {
        firstName: String(user?.firstName || "").trim(),
        lastName: String(user?.lastName || "").trim(),
        phone: String(user?.phone || "").trim(),
      },
      paymentMethod: resolveStoredPaymentMethod(order?.paymentMethod),
      status: String(order?.status || "paid"),
      amount: 0,
      productCode: "",
      productCodes: [],
      items: [],
    };
  }

  return {
    ...cards[0],
    productCodes: cards.map((card) => card.productCode).filter(Boolean),
    items: cards,
    amount: cards.reduce((sum, card) => sum + (Number(card.amount) || 0), 0),
  };
}

/**
 * Seller admin "Buyurtmalar" — har bir mahsulot (dona) alohida kartochka.
 */
async function listSellerOrders(sellerId, query = {}) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const requestedTrackingStatus = String(query.trackingStatus || "").trim();
  if (requestedTrackingStatus === "no_answer") {
    return listSellerNoAnswerOrders(normalizedSellerId, query);
  }

  const page = Math.max(1, Math.floor(toNumber(query.page, 1)));
  const limit = Math.min(200, Math.max(1, Math.floor(toNumber(query.limit, DEFAULT_PAGE_SIZE))));

  const match = { "items.sellerId": normalizedSellerId };

  const rows = await Order.find(match)
    .sort({ paidAt: -1, createdAt: -1, id: -1 })
    .lean();

  const userIds = [...new Set(rows.map((row) => String(row.userId || "")).filter(Boolean))];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } })
        .select({ firstName: 1, lastName: 1, phone: 1 })
        .lean()
    : [];
  const userById = new Map(users.map((row) => [String(row._id), row]));

  const pipelineContext = await resolveSellerPipelineContext(normalizedSellerId);

  const allCards = stampSellerPipelineFields(
    rows.flatMap((row) =>
      buildSellerOrderItemCards(row, userById.get(String(row.userId)), normalizedSellerId),
    ),
    pipelineContext,
  );
  const filteredCards = annotateVisibleFulfillmentGroups(
    requestedTrackingStatus
      ? allCards.filter((card) => card.trackingStatus === requestedTrackingStatus)
      : allCards,
  );

  const total = filteredCards.length;
  const start = (page - 1) * limit;
  let orders = sliceKeepingFulfillmentGroups(filteredCards, start, limit);

  // Kuryerga topshirilgan kartochkalarga qabul qilgan kuryer malumotini ulash
  if (requestedTrackingStatus === "handed_to_courier" && orders.length) {
    const assignments = await listAssignmentsByKeys(
      orders.map((card) => ({
        orderId: card.orderId,
        itemIndex: card.itemIndex,
        unitIndex: card.unitIndex,
      })),
    );
    const byKey = new Map(
      assignments.map((row) => [
        assignmentLookupKey(row.orderId, row.itemIndex, row.unitIndex),
        row,
      ]),
    );

    orders = orders.map((card) => {
      const assignment = byKey.get(
        assignmentLookupKey(card.orderId, card.itemIndex, card.unitIndex),
      );
      if (!assignment) {
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

  // Cargo so‘rovlari — ready_for_cargo / handed_to_cargo filterlari
  if (
    (requestedTrackingStatus === "ready_for_cargo" ||
      requestedTrackingStatus === "handed_to_cargo") &&
    orders.length
  ) {
    const shipments = await listCargoShipmentsByOrderItems(
      orders.map((card) => ({
        orderId: card.orderId,
        itemIndex: card.itemIndex,
      })),
    );
    const byKey = new Map(
      shipments.map((row) => [
        shipmentLookupKey(row.orderId, row.itemIndex),
        row,
      ]),
    );

    orders = orders.map((card) => {
      const shipment = byKey.get(
        shipmentLookupKey(card.orderId, card.itemIndex),
      );
      if (!shipment) {
        return {
          ...card,
          cargoSubmitted: false,
          cargoAccepted: false,
          cargoShipment: null,
        };
      }
      return {
        ...card,
        cargoSubmitted: true,
        cargoAccepted: String(shipment.status) === "accepted",
        cargoShipment: shipment,
        readyForCargoAt: shipment.submittedAt || null,
        handedToCargoAt: shipment.acceptedAt || null,
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

module.exports = {
  VALID_PAYMENT_METHODS,
  normalizePaymentMethod,
  formatOrderCode,
  formatProductCode,
  buildFulfillmentGroupKey,
  stampFulfillmentGroupFields,
  annotateVisibleFulfillmentGroups,
  sliceKeepingFulfillmentGroups,
  buildSellerOrderCard,
  buildSellerOrderItemCards,
  listSellerOrders,
};
