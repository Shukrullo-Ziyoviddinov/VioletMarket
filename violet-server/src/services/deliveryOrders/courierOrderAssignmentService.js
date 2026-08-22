const { Order } = require("../../models/order");
const { User } = require("../../models/user");
const { SellerAccount } = require("../../models/sellerAccount");
const { CourierOrderAssignment } = require("../../models/courierOrderAssignment");
const { HttpError } = require("../../utils/httpError");
const {
  normalizeOrderTrackingStatus,
} = require("../../productManagement/orderTracking");
const {
  isClosedUnitStatus,
  resolveUnitTrackingStatus,
} = require("../../productManagement/orderItemUnitTracking");
const {
  settleItemAndOrderAfterUnitDelivered,
} = require("../../unitLifecycle/deliveryUnitSettlement");
const {
  normalizeDeliveryAddress,
} = require("../../utils/normalizeDeliveryAddress");
const {
  recordSalesOnDelivery,
} = require("../../productManagement/recordSalesOnDelivery");
const { haversineKm } = require("../../utils/geoDistance");
const { resolveCourierAssignmentCargoLane } = require("../../utils/cargoServiceType");
const {
  getCourierPaymentSettings,
  resolveCourierPaymentForDistance,
} = require("../courierPayment/courierPaymentService");
const { isOrderPaid } = require("./courierReturnOrderService");
const {
  COURIER_IN_PROGRESS_STATUSES,
  REACCEPTABLE_ASSIGNMENT_STATUSES,
  assignmentUnitKey,
} = require("../../unitLifecycle/assignmentPoolRules");
const { resolveOptionLabel } = require("../../unitLifecycle/optionLabel");
const {
  snapshotUzWarehousePickup,
  toWarehouseSellerPickup,
} = require("../../productManagement/foreignUzWarehousePickup");
const {
  getActiveCourierWithRegion,
  assertOrderMatchesCourierRegion,
} = require("./deliveryRegionPolicy");

const ACTIVE_ASSIGNMENT_STATUSES = COURIER_IN_PROGRESS_STATUSES;
const SELLER_PHASE_STATUSES = new Set([
  "accepted",
  "en_route_to_seller",
  "arrived_at_seller",
]);

const CUSTOMER_PHASE_STATUSES = new Set([
  "picked_up",
  "en_route_to_customer",
  "arrived_at_customer",
  "return_request_pending",
]);

const RETURN_PHASE_STATUSES = new Set([
  "return_approved",
  "return_to_seller",
  "en_route_return_to_seller",
  "arrived_return_at_seller",
]);

const RETURNABLE_STATUSES = new Set([
  "picked_up",
  "en_route_to_customer",
  "arrived_at_customer",
]);

const ADVANCE_ACTIONS = {
  go_to_seller: {
    from: ["accepted"],
    to: "en_route_to_seller",
    atField: "enRouteToSellerAt",
    errorMessage: "Avval buyurtmani qabul qiling",
  },
  arrive_seller: {
    from: ["en_route_to_seller"],
    to: "arrived_at_seller",
    atField: "arrivedAtSellerAt",
    errorMessage: "Avval sotuvchiga yo‘lga chiqing",
  },
  go_to_customer: {
    from: ["picked_up"],
    to: "en_route_to_customer",
    atField: "enRouteToCustomerAt",
    errorMessage: "Avval sotuvchidan mahsulotni oling",
  },
  arrive_customer: {
    from: ["en_route_to_customer"],
    to: "arrived_at_customer",
    atField: "arrivedAtCustomerAt",
    errorMessage: "Avval mijozga yo‘lga chiqing",
  },
};

function resolvePickupPhase(status) {
  const value = String(status || "accepted");
  if (RETURN_PHASE_STATUSES.has(value) || value === "returned") {
    return "return";
  }
  if (CUSTOMER_PHASE_STATUSES.has(value) || value === "delivered") {
    return "customer";
  }
  return "seller";
}

function resetAssignmentStepFields(assignment) {
  assignment.enRouteToSellerAt = null;
  assignment.arrivedAtSellerAt = null;
  assignment.pickedUpAt = null;
  assignment.enRouteToCustomerAt = null;
  assignment.arrivedAtCustomerAt = null;
  assignment.deliveredAt = null;
  assignment.enRouteReturnToSellerAt = null;
  assignment.arrivedReturnAtSellerAt = null;
  assignment.returnedAt = null;
  assignment.set("approvedReturnReasonType", undefined);
}

function parseCourierCoords(payload = {}) {
  const lat = Number(payload.courierLat ?? payload.lat);
  const lng = Number(payload.courierLng ?? payload.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

function resolveAssignmentDistanceKm(assignment, courierCoords) {
  const addressCoords = assignment?.deliveryAddress?.coords;
  if (courierCoords && Array.isArray(addressCoords) && addressCoords.length >= 2) {
    return haversineKm(courierCoords, addressCoords);
  }
  const stored = Number(assignment?.distanceKm);
  return Number.isFinite(stored) && stored >= 0 ? stored : null;
}

function resolveAssignmentCargoLane(item, assignment) {
  return resolveCourierAssignmentCargoLane(item, assignment);
}

/**
 * Bir mijoz + bir siller + bir kuryer (+ xorijda bir tarif) → bitta to‘lov.
 * Express va Standard alohida yetkazilsa, ikkala yo‘lak ham to‘lanadi.
 */
function buildCourierPayGroupFilter(assignment) {
  const orderId = Number(assignment?.orderId) || 0;
  const sellerId = String(assignment?.sellerId || "").trim();
  const deliveryId = assignment?.deliveryId;
  if (!orderId || !sellerId || !deliveryId) return null;
  const filter = { orderId, sellerId, deliveryId };
  const lane = resolveCourierAssignmentCargoLane(null, assignment);
  if (lane) filter.cargoServiceType = lane;
  return filter;
}

async function findSiblingCourierPaymentTotal(assignment) {
  const group = buildCourierPayGroupFilter(assignment);
  if (!group) return 0;

  const selfId = assignment?._id;
  const match = {
    orderId: group.orderId,
    sellerId: group.sellerId,
    deliveryId: group.deliveryId,
    courierPayment: { $gt: 0 },
    status: {
      $in: [
        ...COURIER_IN_PROGRESS_STATUSES,
        "delivered",
        "returned",
      ],
    },
  };
  if (group.cargoServiceType) {
    match.cargoServiceType = group.cargoServiceType;
  }
  if (selfId) {
    match._id = { $ne: selfId };
  }

  const rows = await CourierOrderAssignment.find(match)
    .select({ courierPayment: 1 })
    .lean();

  return rows.reduce(
    (sum, row) => sum + Math.max(0, Number(row.courierPayment) || 0),
    0,
  );
}

/**
 * Topshirish yoki sotuvchiga qaytarishda km bo‘yicha kuryer to‘lovini yozadi.
 * Guruhda (orderId+sellerId+deliveryId[+cargoServiceType]) allaqachon to‘lov yo‘yilgan bo‘lsa — 0.
 */
async function applyCourierKmPayment(assignment, payload = {}, atDate = new Date()) {
  const courierCoords = parseCourierCoords(payload);
  const distanceKm = resolveAssignmentDistanceKm(assignment, courierCoords);
  if (distanceKm != null) {
    assignment.distanceKm = distanceKm;
  }

  const alreadyPaid = await findSiblingCourierPaymentTotal(assignment);
  if (alreadyPaid > 0) {
    assignment.courierPayment = 0;
    assignment.courierPaymentUpdatedAt = atDate;
    return assignment;
  }

  const paymentSettings = await getCourierPaymentSettings();
  assignment.courierPayment = resolveCourierPaymentForDistance(
    assignment.distanceKm,
    paymentSettings.tiers,
  );
  assignment.courierPaymentUpdatedAt = atDate;
  return assignment;
}

function formatProductCode(productId) {
  const id = Math.max(0, Math.floor(Number(productId) || 0));
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

function snapshotCustomer(user) {
  if (!user) {
    return { firstName: "", lastName: "", phone: "" };
  }
  return {
    firstName: String(user.firstName || "").trim(),
    lastName: String(user.lastName || "").trim(),
    phone: String(user.phone || "").trim(),
  };
}

function snapshotDeliveryAddress(raw) {
  const normalized = normalizeDeliveryAddress(raw);
  if (!normalized) {
    return {
      region: "",
      city: "",
      district: "",
      addressLine: "",
      placeType: "",
      entrance: "",
      floor: "",
      domofon: "",
      courierNote: "",
    };
  }
  return {
    region: normalized.region || "",
    city: normalized.city || "",
    district: normalized.district || "",
    addressLine: normalized.addressLine || "",
    placeType: normalized.placeType || "",
    entrance: normalized.entrance || "",
    floor: normalized.floor || "",
    domofon: normalized.domofon || "",
    courierNote: normalized.courierNote || "",
    ...(normalized.coords ? { coords: normalized.coords } : {}),
  };
}

function toPublicAssignment(doc, extras = {}) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject() : doc;
  const address = row.deliveryAddress || {};
  const customer = row.customer || {};
  const isPaid =
    extras.isPaid != null ? Boolean(extras.isPaid) : Boolean(row.isPaid);
  return {
    id: String(row._id),
    orderId: Number(row.orderId) || 0,
    itemIndex: Number(row.itemIndex) || 0,
    unitIndex: Number(row.unitIndex) || 0,
    productId: Number(row.productId) || 0,
    productCode: String(row.productCode || ""),
    barcode: String(row.productCode || ""),
    sellerId: String(row.sellerId || ""),
    cargoServiceType: resolveCourierAssignmentCargoLane(null, row),
    title: resolveTitle(row.title),
    amount: Math.max(0, Number(row.amount) || 0),
    deliveryFee: 0,
    productCount: 1,
    imageUrl: String(row.imageUrl || ""),
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
    deliveryId: String(row.deliveryId || ""),
    courier: {
      firstName: String(row.courier?.firstName || ""),
      lastName: String(row.courier?.lastName || ""),
      phone: String(row.courier?.phone || ""),
      email: String(row.courier?.email || ""),
    },
    customer: {
      firstName: String(customer.firstName || ""),
      lastName: String(customer.lastName || ""),
      phone: String(customer.phone || ""),
    },
    deliveryAddress: {
      region: String(address.region || ""),
      city: String(address.city || ""),
      district: String(address.district || ""),
      addressLine: String(address.addressLine || ""),
      placeType: String(address.placeType || ""),
      entrance: String(address.entrance || ""),
      floor: String(address.floor || ""),
      domofon: String(address.domofon || ""),
      courierNote: String(address.courierNote || ""),
      coords: Array.isArray(address.coords) ? address.coords : null,
    },
    warehousePickup: snapshotUzWarehousePickup(row.warehousePickup),
    pickupKind: toWarehouseSellerPickup(row.warehousePickup) ? "warehouse" : "seller",
    status: String(row.status || "accepted"),
    pickupPhase: resolvePickupPhase(row.status),
    handedToCourierAt: row.handedToCourierAt || null,
    acceptedAt: row.acceptedAt || null,
    enRouteToSellerAt: row.enRouteToSellerAt || null,
    arrivedAtSellerAt: row.arrivedAtSellerAt || null,
    pickedUpAt: row.pickedUpAt || null,
    enRouteToCustomerAt: row.enRouteToCustomerAt || null,
    arrivedAtCustomerAt: row.arrivedAtCustomerAt || null,
    deliveredAt: row.deliveredAt || null,
    approvedReturnReasonType: row.approvedReturnReasonType || null,
    enRouteReturnToSellerAt: row.enRouteReturnToSellerAt || null,
    arrivedReturnAtSellerAt: row.arrivedReturnAtSellerAt || null,
    returnedAt: row.returnedAt || null,
    sellerPickup: extras.sellerPickup || null,
    distanceKm:
      row.distanceKm == null || row.distanceKm === ""
        ? null
        : Math.max(0, Number(row.distanceKm) || 0),
    courierPayment: Math.max(0, Number(row.courierPayment) || 0),
    createdAt: row.createdAt || null,
    isPaid,
    paymentMethod: String(
      extras.paymentMethod || row.paymentMethod || "",
    ),
    paymentStatus: String(extras.paymentStatus || row.paymentStatus || ""),
    orderedAt: extras.orderedAt || row.orderedAt || null,
  };
}

async function loadOrderPaymentMap(orderIds = []) {
  const ids = [...new Set(orderIds.map((id) => Number(id)).filter((id) => id > 0))];
  if (!ids.length) return new Map();

  const orders = await Order.find({ id: { $in: ids } })
    .select("id status paidAt createdAt paymentMethod")
    .lean();

  const map = new Map();
  for (const order of orders) {
    map.set(Number(order.id), {
      isPaid: isOrderPaid(order),
      paymentMethod: String(order.paymentMethod || ""),
      paymentStatus: String(order.status || ""),
      orderedAt: order.createdAt || null,
    });
  }
  return map;
}

function pickSellerName(account) {
  if (!account?.name) return "";
  if (typeof account.name === "string") return account.name;
  return String(account.name.uz || account.name.ru || "").trim();
}

function toSellerPickup(account) {
  if (!account) {
    return {
      id: "",
      name: "",
      address: "",
      sellerPhone: "",
      coordinates: null,
      pickupKind: "seller",
    };
  }
  const coords = Array.isArray(account.coordinates) && account.coordinates.length >= 2
    ? [Number(account.coordinates[0]), Number(account.coordinates[1])]
    : null;
  return {
    id: String(account.id || ""),
    name: pickSellerName(account) || String(account.id || ""),
    address: String(account.address || "").trim(),
    sellerPhone: String(account.sellerPhone || "").trim(),
    coordinates:
      coords && Number.isFinite(coords[0]) && Number.isFinite(coords[1])
        ? coords
        : null,
    pickupKind: "seller",
  };
}

async function loadSellerPickupMap(sellerIds = []) {
  const ids = [...new Set(sellerIds.map((id) => String(id || "").trim()).filter(Boolean))];
  if (!ids.length) return new Map();

  const rows = await SellerAccount.find({ id: { $in: ids } })
    .select("id name address sellerPhone coordinates")
    .lean();

  return new Map(rows.map((row) => [String(row.id), toSellerPickup(row)]));
}

/**
 * Pickup manzil:
 * - xorij warehousePickup snapshot → ombor
 * - aks holda SellerAccount (UZB siller)
 */
async function attachSellerPickup(publicRows = []) {
  const list = Array.isArray(publicRows) ? publicRows.filter(Boolean) : [];
  if (!list.length) return list;

  const sellerMap = await loadSellerPickupMap(list.map((row) => row.sellerId));
  return list.map((row) => {
    const sellerId = String(row.sellerId || "").trim();
    const warehousePickup = toWarehouseSellerPickup(
      row.warehousePickup,
      sellerId,
    );

    if (warehousePickup) {
      return {
        ...row,
        sellerPickup: warehousePickup,
        pickupKind: "warehouse",
        pickupPhase: resolvePickupPhase(row.status),
      };
    }

    const sellerPickup =
      sellerMap.get(sellerId) ||
      toSellerPickup({
        id: sellerId,
        name: sellerId,
        address: "",
        sellerPhone: "",
        coordinates: null,
      });
    return {
      ...row,
      sellerPickup,
      pickupKind: "seller",
      pickupPhase: resolvePickupPhase(row.status),
    };
  });
}

/**
 * Kuryer "Qabul qilish" — assignment yaratadi yoki cancelled ni qayta ochadi.
 * returned: available/accept bir xil — re_handoff assignmentni o‘chiradi, keyin yangi create.
 */
async function acceptOrderUnitByCourier(deliveryId, payload = {}) {
  const orderId = Number(payload.orderId);
  const itemIndex = Number(payload.itemIndex);
  const unitIndex = Math.max(0, Number(payload.unitIndex) || 0);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ORDER_ID");
  }
  if (!Number.isFinite(itemIndex) || itemIndex < 0) {
    throw new HttpError(400, "Mahsulot indeksi noto‘g‘ri", "INVALID_ITEM_INDEX");
  }

  const { delivery, region: courierRegion } =
    await getActiveCourierWithRegion(deliveryId);

  const order = await Order.findOne({ id: orderId });
  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }
  assertOrderMatchesCourierRegion(order, courierRegion);

  const item = Array.isArray(order.items) ? order.items[itemIndex] : null;
  if (!item) {
    throw new HttpError(404, "Mahsulot topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const trackingStatus = normalizeOrderTrackingStatus(item.trackingStatus);
  if (trackingStatus !== "handed_to_courier") {
    throw new HttpError(
      409,
      "Mahsulot hali kuryerga topshirilmagan",
      "ORDER_TRACKING_STATUS_CONFLICT",
    );
  }

  const unitCount = Math.max(1, Number(item.quantity) || 1);
  if (unitIndex >= unitCount) {
    throw new HttpError(400, "Dona indeksi noto‘g‘ri", "INVALID_UNIT_INDEX");
  }

  const unitTrackingStatus = resolveUnitTrackingStatus(item, unitIndex);
  if (isClosedUnitStatus(unitTrackingStatus)) {
    throw new HttpError(
      409,
      "Bu dona mavjud emas yoki bekor qilingan — qabul qilib bo‘lmaydi",
      "ORDER_UNIT_CLOSED",
    );
  }

  const handedEntry = (Array.isArray(item.trackingHistory) ? item.trackingHistory : []).find(
    (entry) => String(entry?.status || "") === "handed_to_courier",
  );

  const productId = Number(item.productId) || 0;
  const amount = Math.max(0, Number(item.price) || 0);
  const acceptedAt = new Date();
  const deliveryAddress = snapshotDeliveryAddress(order.deliveryAddress);
  const warehousePickup = snapshotUzWarehousePickup(item.uzWarehousePickup);
  const courierCoords = parseCourierCoords(payload);
  const distanceKm = resolveAssignmentDistanceKm({ deliveryAddress }, courierCoords);
  const user = order.userId
    ? await User.findById(order.userId).select("firstName lastName phone").lean()
    : null;
  const courierSnapshot = {
    firstName: String(delivery.firstName || "").trim(),
    lastName: String(delivery.lastName || "").trim(),
    phone: String(delivery.phone || "").trim(),
    email: String(delivery.email || "").trim(),
  };
  const customerSnapshot = snapshotCustomer(user);

  const existing = await CourierOrderAssignment.findOne({
    orderId,
    itemIndex,
    unitIndex,
  });

  if (existing) {
    const existingStatus = String(existing.status || "");

    // cancelled — available pool bilan bir xil: qayta qabul
    if (REACCEPTABLE_ASSIGNMENT_STATUSES.has(existingStatus)) {
      existing.deliveryId = delivery._id;
      existing.courier = courierSnapshot;
      existing.customer = customerSnapshot;
      existing.deliveryAddress = deliveryAddress;
      if (warehousePickup) {
        existing.warehousePickup = warehousePickup;
      }
      existing.status = "accepted";
      existing.acceptedAt = acceptedAt;
      resetAssignmentStepFields(existing);
      existing.courierPayment = 0;
      existing.courierPaymentUpdatedAt = null;
      existing.handedToCourierAt = handedEntry?.at || existing.handedToCourierAt || null;
      existing.productId = productId;
      existing.productCode = formatProductCode(productId);
      existing.sellerId = String(item.sellerId || "").trim();
      existing.cargoServiceType = resolveAssignmentCargoLane(item, existing);
      existing.title = resolveTitle(item.title);
      existing.amount = amount;
      existing.imageUrl = String(item.image || "");
      existing.color = String(item.color || "");
      existing.size = String(item.size || "");
      existing.storage = String(item.storage || "");
      existing.model = String(item.model || "");
      if (distanceKm != null) {
        existing.distanceKm = distanceKm;
      }
      await existing.save();

      const paymentMap = await loadOrderPaymentMap([existing.orderId]);
      const [publicRow] = await attachSellerPickup([
        toPublicAssignment(existing, paymentMap.get(Number(existing.orderId)) || {}),
      ]);
      return publicRow;
    }

    // returned = taken (available’da yo‘q). Qayta kuryerga assignment o‘chiradi.
    if (existingStatus === "returned") {
      throw new HttpError(
        409,
        "Bu mahsulot allaqachon sotuvchiga qaytarilgan",
        "ASSIGNMENT_ALREADY_RETURNED",
      );
    }

    if (String(existing.deliveryId) === String(deliveryId)) {
      if (warehousePickup) {
        existing.warehousePickup = warehousePickup;
        await existing.save();
      }
      const paymentMap = await loadOrderPaymentMap([existing.orderId]);
      const [publicRow] = await attachSellerPickup([
        toPublicAssignment(existing, paymentMap.get(Number(existing.orderId)) || {}),
      ]);
      return publicRow;
    }

    throw new HttpError(
      409,
      "Bu mahsulotni boshqa kuryer allaqachon qabul qilgan",
      "ALREADY_ACCEPTED",
    );
  }

  const created = await CourierOrderAssignment.create({
    orderId,
    itemIndex,
    unitIndex,
    productId,
    productCode: formatProductCode(productId),
    sellerId: String(item.sellerId || "").trim(),
    cargoServiceType: resolveAssignmentCargoLane(item, null),
    title: resolveTitle(item.title),
    amount,
    imageUrl: String(item.image || ""),
    color: resolveOptionLabel(item.color),
    size: resolveOptionLabel(item.size),
    storage: resolveOptionLabel(item.storage),
    model: resolveOptionLabel(item.model),
    deliveryId: delivery._id,
    courier: courierSnapshot,
    customer: customerSnapshot,
    deliveryAddress,
    ...(warehousePickup ? { warehousePickup } : {}),
    status: "accepted",
    handedToCourierAt: handedEntry?.at || null,
    acceptedAt,
    ...(distanceKm != null ? { distanceKm } : {}),
  });

  const paymentMap = await loadOrderPaymentMap([created.orderId]);
  const [publicRow] = await attachSellerPickup([
    toPublicAssignment(created, paymentMap.get(Number(created.orderId)) || {}),
  ]);
  return publicRow;
}

/**
 * Bir buyurtmani (berilgan donalarni) birga qabul qilish.
 * Return / deliver / pickup — hali dona (assignment) bo‘yicha.
 * units majburiy: [{ itemIndex, unitIndex }]
 */
async function acceptOrderGroupByCourier(deliveryId, payload = {}) {
  const orderId = Number(payload.orderId);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ORDER_ID");
  }

  const courierCoords = {
    courierLat: payload.courierLat ?? payload.lat,
    courierLng: payload.courierLng ?? payload.lng,
  };

  const rawUnits = Array.isArray(payload.units) ? payload.units : [];
  const seen = new Set();
  const uniqueUnits = [];
  for (const unit of rawUnits) {
    const itemIndex = Number(unit?.itemIndex);
    const unitIndex = Math.max(0, Number(unit?.unitIndex) || 0);
    if (!Number.isFinite(itemIndex) || itemIndex < 0) continue;
    const key = assignmentUnitKey(orderId, itemIndex, unitIndex);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueUnits.push({ itemIndex, unitIndex });
  }

  if (!uniqueUnits.length) {
    throw new HttpError(
      400,
      "Qabul qilish uchun mahsulotlar ko‘rsatilmagan",
      "UNITS_REQUIRED",
    );
  }

  const updated = [];
  const skipped = [];

  for (const unit of uniqueUnits) {
    try {
      const row = await acceptOrderUnitByCourier(deliveryId, {
        orderId,
        itemIndex: unit.itemIndex,
        unitIndex: unit.unitIndex,
        ...courierCoords,
      });
      updated.push(row);
    } catch (error) {
      if (error instanceof HttpError && Number(error.status) === 409) {
        skipped.push({
          orderId,
          itemIndex: unit.itemIndex,
          unitIndex: unit.unitIndex,
          code: error.code || "ORDER_TRACKING_STATUS_CONFLICT",
          message: error.message,
        });
        continue;
      }
      throw error;
    }
  }

  return {
    orderId,
    updated,
    skipped,
    updatedCount: updated.length,
    skippedCount: skipped.length,
    assignments: updated,
  };
}

/**
 * Kuryer "Topshirdim" — mijoz mahsulotni oldi.
 * Keyinchalik asosiy admindan ham shu holat tasdiqlanishi mumkin.
 */
async function deliverOrderUnitByCourier(deliveryId, payload = {}) {
  const assignmentId = String(payload.assignmentId || payload.id || "").trim();
  const orderId = Number(payload.orderId);
  const itemIndex = Number(payload.itemIndex);
  const unitIndex = Math.max(0, Number(payload.unitIndex) || 0);

  let assignment = null;
  if (assignmentId) {
    assignment = await CourierOrderAssignment.findById(assignmentId);
  } else if (Number.isFinite(orderId) && Number.isFinite(itemIndex)) {
    assignment = await CourierOrderAssignment.findOne({
      orderId,
      itemIndex,
      unitIndex,
    });
  }

  if (!assignment) {
    throw new HttpError(404, "Qabul qilingan buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }

  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }

  if (String(assignment.status) === "delivered") {
    const paymentMap = await loadOrderPaymentMap([assignment.orderId]);
    const payment = paymentMap.get(Number(assignment.orderId)) || {};
    const [publicRow] = await attachSellerPickup([
      toPublicAssignment(assignment, payment),
    ]);
    return publicRow;
  }

  if (String(assignment.status) !== "arrived_at_customer") {
    throw new HttpError(
      409,
      "Avval mijoz manziliga yetib boring",
      "ASSIGNMENT_NOT_AT_CUSTOMER",
    );
  }

  const deliveredAt = new Date();
  assignment.status = "delivered";
  assignment.deliveredAt = deliveredAt;
  await applyCourierKmPayment(assignment, payload, deliveredAt);

  if (
    !assignment.customer?.phone &&
    !assignment.customer?.firstName &&
    !assignment.customer?.lastName
  ) {
    const orderForCustomer = await Order.findOne({ id: assignment.orderId })
      .select("userId")
      .lean();
    if (orderForCustomer?.userId) {
      const user = await User.findById(orderForCustomer.userId)
        .select("firstName lastName phone")
        .lean();
      assignment.customer = snapshotCustomer(user);
    }
  }

  await assignment.save();

  const order = await Order.findOne({ id: assignment.orderId });
  if (order) {
    const item = Array.isArray(order.items) ? order.items[assignment.itemIndex] : null;
    if (item) {
      // Dona tracking + item/order settle (no_answer Sotildi bilan bir xil helper)
      await settleItemAndOrderAfterUnitDelivered(order, item, {
        orderId: assignment.orderId,
        itemIndex: assignment.itemIndex,
        unitIndex: Number(assignment.unitIndex) || 0,
        at: deliveredAt,
      });

      order.markModified("items");
      await order.save();

      // Sotuv/daromad — faqat topshirilganda (siller + asosiy admin)
      await recordSalesOnDelivery(order, deliveredAt, {
        assignmentId: String(assignment._id),
      });
    }
  }

  const paymentMap = await loadOrderPaymentMap([assignment.orderId]);
  const payment = paymentMap.get(Number(assignment.orderId)) || {};
  const [publicRow] = await attachSellerPickup([
    toPublicAssignment(assignment, payment),
  ]);
  return publicRow;
}

/**
 * Kuryer sotuvchidan mahsulotni oldi — keyin mijozga yetkazish bosqichi.
 * Faqat «Sotuvchiga keldim» dan keyin.
 */
async function pickUpOrderUnitByCourier(deliveryId, payload = {}) {
  const assignmentId = String(payload.assignmentId || payload.id || "").trim();
  if (!assignmentId) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ASSIGNMENT_ID");
  }

  const assignment = await CourierOrderAssignment.findById(assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Qabul qilingan buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }

  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }

  if (String(assignment.status) === "picked_up") {
    const paymentMap = await loadOrderPaymentMap([assignment.orderId]);
    const payment = paymentMap.get(Number(assignment.orderId)) || {};
    const [publicRow] = await attachSellerPickup([
      toPublicAssignment(assignment, payment),
    ]);
    return publicRow;
  }

  if (String(assignment.status) !== "arrived_at_seller") {
    throw new HttpError(
      409,
      "Avval sotuvchi manziliga yetib boring",
      "ASSIGNMENT_NOT_AT_SELLER",
    );
  }

  const pickedUpAt = new Date();
  assignment.status = "picked_up";
  assignment.pickedUpAt = pickedUpAt;
  await assignment.save();

  const paymentMap = await loadOrderPaymentMap([assignment.orderId]);
  const payment = paymentMap.get(Number(assignment.orderId)) || {};
  const [publicRow] = await attachSellerPickup([
    toPublicAssignment(assignment, payment),
  ]);
  return publicRow;
}

/**
 * Soft bosqichlar: sotuvchiga/mijozga ketaman / keldim.
 */
async function advanceAssignmentStepByCourier(deliveryId, payload = {}) {
  const assignmentId = String(payload.assignmentId || payload.id || "").trim();
  const action = String(payload.action || "").trim().toLowerCase();

  if (!assignmentId) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ASSIGNMENT_ID");
  }

  const rule = ADVANCE_ACTIONS[action];
  if (!rule) {
    throw new HttpError(400, "Noto‘g‘ri bosqich amali", "INVALID_ADVANCE_ACTION");
  }

  const assignment = await CourierOrderAssignment.findById(assignmentId);
  if (!assignment) {
    throw new HttpError(404, "Qabul qilingan buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }

  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }

  const current = String(assignment.status || "");
  if (current === rule.to) {
    const paymentMap = await loadOrderPaymentMap([assignment.orderId]);
    const payment = paymentMap.get(Number(assignment.orderId)) || {};
    const [publicRow] = await attachSellerPickup([
      toPublicAssignment(assignment, payment),
    ]);
    return publicRow;
  }

  if (!rule.from.includes(current)) {
    throw new HttpError(409, rule.errorMessage, "ASSIGNMENT_STATUS_CONFLICT");
  }

  const at = new Date();
  assignment.status = rule.to;
  assignment[rule.atField] = at;
  await assignment.save();

  const paymentMap = await loadOrderPaymentMap([assignment.orderId]);
  const payment = paymentMap.get(Number(assignment.orderId)) || {};
  const [publicRow] = await attachSellerPickup([
    toPublicAssignment(assignment, payment),
  ]);
  return publicRow;
}

async function getAssignmentForCourier(deliveryId, assignmentId) {
  const id = String(assignmentId || "").trim();
  if (!id) {
    throw new HttpError(400, "Buyurtma ID noto‘g‘ri", "INVALID_ASSIGNMENT_ID");
  }

  const assignment = await CourierOrderAssignment.findById(id);
  if (!assignment) {
    throw new HttpError(404, "Buyurtma topilmadi", "ASSIGNMENT_NOT_FOUND");
  }
  if (String(assignment.deliveryId) !== String(deliveryId)) {
    throw new HttpError(403, "Bu buyurtma sizniki emas", "ASSIGNMENT_FORBIDDEN");
  }

  if (
    !assignment.customer?.phone &&
    !assignment.customer?.firstName &&
    !assignment.customer?.lastName
  ) {
    const order = await Order.findOne({ id: assignment.orderId }).select("userId").lean();
    if (order?.userId) {
      const user = await User.findById(order.userId)
        .select("firstName lastName phone")
        .lean();
      assignment.customer = snapshotCustomer(user);
      await assignment.save();
    }
  }

  // Partial qaytarish: bir siller guruhida qolib ketgan size/color donalar
  try {
    const {
      healStuckReturnSiblingsOnView,
    } = require("../../unitLifecycle/returnUnitLifecycleService");
    const healed = await healStuckReturnSiblingsOnView(assignment);
    if (healed) {
      const refreshed = await CourierOrderAssignment.findById(id);
      if (refreshed) {
        assignment.status = refreshed.status;
        assignment.approvedReturnReasonType = refreshed.approvedReturnReasonType;
        assignment.returnedAt = refreshed.returnedAt;
        assignment.enRouteReturnToSellerAt = refreshed.enRouteReturnToSellerAt;
        assignment.arrivedReturnAtSellerAt = refreshed.arrivedReturnAtSellerAt;
      }
    }
  } catch (err) {
    console.error("healStuckReturnSiblingsOnView:", err?.message || err);
  }

  const paymentMap = await loadOrderPaymentMap([assignment.orderId]);
  const payment = paymentMap.get(Number(assignment.orderId)) || {};
  const [publicRow] = await attachSellerPickup([
    toPublicAssignment(assignment, payment),
  ]);

  const siblingQuery = {
    deliveryId,
    orderId: Number(assignment.orderId) || 0,
    status: { $in: ACTIVE_ASSIGNMENT_STATUSES },
  };
  const primarySellerId = String(assignment.sellerId || "").trim();
  if (primarySellerId) {
    siblingQuery.sellerId = primarySellerId;
  }
  const laneType = resolveCourierAssignmentCargoLane(null, assignment);
  if (laneType) {
    siblingQuery.cargoServiceType = laneType;
  }

  const siblingRows = await CourierOrderAssignment.find(siblingQuery)
    .sort({ itemIndex: 1, unitIndex: 1 })
    .lean();

  const siblingPublic = await attachSellerPickup(
    siblingRows.map((row) =>
      toPublicAssignment(row, paymentMap.get(Number(row.orderId)) || payment),
    ),
  );

  const units = siblingPublic.map((row) => ({
    id: String(row.id || ""),
    itemIndex: Number(row.itemIndex) || 0,
    unitIndex: Number(row.unitIndex) || 0,
    productId: Number(row.productId) || 0,
    productCode: String(row.productCode || ""),
    barcode: String(row.barcode || row.productCode || ""),
    title: row.title || { uz: "", ru: "" },
    amount: Math.max(0, Number(row.amount) || 0),
    imageUrl: String(row.imageUrl || ""),
    color: String(row.color || ""),
    size: String(row.size || ""),
    storage: String(row.storage || ""),
    model: String(row.model || ""),
    status: String(row.status || "accepted"),
    sellerId: String(row.sellerId || ""),
    pickupKind: row.pickupKind || "seller",
    sellerPickup: row.sellerPickup || null,
  }));

  const productCodes = [
    ...new Set(
      units.map((unit) => String(unit.productCode || "").trim()).filter(Boolean),
    ),
  ];
  const amount = units.reduce(
    (sum, unit) => sum + (Math.max(0, Number(unit.amount) || 0)),
    0,
  );

  return {
    ...publicRow,
    isGroup: units.length > 1,
    productCount: Math.max(1, units.length),
    amount: units.length ? amount : publicRow.amount,
    productCodes,
    barcode:
      productCodes.length <= 1
        ? productCodes[0] || publicRow.barcode || publicRow.productCode || ""
        : productCodes.join(", "),
    productCode:
      productCodes.length <= 1
        ? productCodes[0] || publicRow.productCode || ""
        : productCodes.join(", "),
    units,
    siblingIds: units.map((unit) => unit.id).filter(Boolean),
  };
}

async function listAssignmentsByKeys(keys = []) {
  if (!Array.isArray(keys) || !keys.length) return [];

  const or = keys
    .map((key) => {
      const orderId = Number(key.orderId);
      const itemIndex = Number(key.itemIndex);
      const unitIndex = Math.max(0, Number(key.unitIndex) || 0);
      if (!Number.isFinite(orderId) || !Number.isFinite(itemIndex)) return null;
      return { orderId, itemIndex, unitIndex };
    })
    .filter(Boolean);

  if (!or.length) return [];

  const rows = await CourierOrderAssignment.find({ $or: or }).lean();
  return rows.map(toPublicAssignment);
}

function assignmentLookupKey(orderId, itemIndex, unitIndex) {
  return assignmentUnitKey(orderId, itemIndex, unitIndex);
}

module.exports = {
  ACTIVE_ASSIGNMENT_STATUSES,
  SELLER_PHASE_STATUSES,
  CUSTOMER_PHASE_STATUSES,
  RETURN_PHASE_STATUSES,
  RETURNABLE_STATUSES,
  acceptOrderUnitByCourier,
  acceptOrderGroupByCourier,
  pickUpOrderUnitByCourier,
  advanceAssignmentStepByCourier,
  deliverOrderUnitByCourier,
  getAssignmentForCourier,
  listAssignmentsByKeys,
  assignmentLookupKey,
  toPublicAssignment,
  attachSellerPickup,
  loadOrderPaymentMap,
  resolveAssignmentDistanceKm,
  parseCourierCoords,
  applyCourierKmPayment,
  buildCourierPayGroupFilter,
  resolvePickupPhase,
};
