/**
 * Foreign siller: collected → ready_for_cargo (+ cargo_shipments pending).
 * UZB / local sillerlarga ta’sir qilmaydi.
 */

const { Order } = require("../../models/order");
const { Product } = require("../../models/product");
const { SellerAccount } = require("../../models/sellerAccount");
const {
  CargoShipment,
  toPublicCargoShipment,
} = require("../../models/cargoShipment");
const { Counter } = require("../../models/counter");
const { HttpError } = require("../../utils/httpError");
const {
  normalizeOrderTrackingStatus,
  resolveSellerPipelineMode,
} = require("../../productManagement/orderTracking");

function cleanSellerId(value) {
  return String(value || "").trim();
}

function parsePositiveInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new HttpError(400, `${fieldName} noto'g'ri`, "VALIDATION_ERROR");
  }
  return number;
}

function resolveStoreName(account) {
  const name = account?.name;
  if (name && typeof name === "object") {
    return String(name.uz || name.ru || account.id || "").trim();
  }
  return String(name || account?.id || "").trim();
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

/** Product.weight gram bo‘lishi mumkin — kg ga aylantirish */
function resolveWeightKg(productDoc, quantity) {
  const qty = Math.max(1, Number(quantity) || 1);
  const raw = Number(productDoc?.weight);
  if (!Number.isFinite(raw) || raw <= 0) {
    return { weightKg: Number((qty * 0.5).toFixed(2)), estimated: true };
  }
  // 50+ odatda gram
  const perUnitKg = raw >= 50 ? raw / 1000 : raw;
  return {
    weightKg: Number((perUnitKg * qty).toFixed(2)),
    estimated: false,
  };
}

async function nextRequestCode(now = new Date()) {
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const dayKey = `${y}${m}${d}`;
  const counter = await Counter.findOneAndUpdate(
    { key: `cargo_shipment_${dayKey}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const seq = Math.max(1, Number(counter?.seq) || 1);
  return `REQ-${dayKey}-${String(seq).padStart(4, "0")}`;
}

async function listCargoShipmentsByOrderItems(keys = []) {
  const pairs = (Array.isArray(keys) ? keys : [])
    .map((row) => ({
      orderId: Number(row.orderId),
      itemIndex: Number(row.itemIndex),
    }))
    .filter(
      (row) =>
        Number.isFinite(row.orderId) &&
        Number.isFinite(row.itemIndex) &&
        row.itemIndex >= 0,
    );
  if (!pairs.length) return [];

  const or = pairs.map((row) => ({
    orderId: row.orderId,
    itemIndex: row.itemIndex,
  }));
  const rows = await CargoShipment.find({ $or: or }).lean();
  return rows.map(toPublicCargoShipment);
}

function shipmentLookupKey(orderId, itemIndex) {
  return `${Number(orderId)}:${Number(itemIndex)}`;
}

/**
 * Cargoga yuborish — so‘rov yaratadi, tracking = ready_for_cargo.
 */
async function submitSellerOrderItemToCargo(
  sellerId,
  orderIdRaw,
  itemIndexRaw,
  payload = {},
) {
  const normalizedSellerId = cleanSellerId(sellerId);
  if (!normalizedSellerId) {
    throw new HttpError(400, "Seller ID topilmadi", "VALIDATION_ERROR");
  }

  const account = await SellerAccount.findOne({ id: normalizedSellerId })
    .select({ id: 1, name: 1, sellerCountry: 1, address: 1 })
    .lean();
  if (!account) {
    throw new HttpError(404, "Sotuvchi topilmadi", "SELLER_NOT_FOUND");
  }

  const pipelineMode = resolveSellerPipelineMode(account.sellerCountry);
  if (pipelineMode !== "foreign") {
    throw new HttpError(
      409,
      "Faqat xorij sillerlari cargoga yubora oladi",
      "LOCAL_SELLER_CARGO_FORBIDDEN",
    );
  }

  const orderId = parsePositiveInteger(orderIdRaw, "orderId");
  const itemIndex = parsePositiveInteger(itemIndexRaw, "itemIndex");
  const order = await Order.findOne({ id: orderId });
  if (!order) {
    throw new HttpError(404, "Buyurtma topilmadi", "ORDER_NOT_FOUND");
  }

  const item = order.items?.[itemIndex];
  if (!item || cleanSellerId(item.sellerId) !== normalizedSellerId) {
    throw new HttpError(404, "Buyurtma mahsuloti topilmadi", "ORDER_ITEM_NOT_FOUND");
  }

  const currentStatus = normalizeOrderTrackingStatus(item.trackingStatus);

  if (currentStatus === "ready_for_cargo" || currentStatus === "handed_to_cargo") {
    const existing = await CargoShipment.findOne({
      orderId,
      itemIndex,
      sellerId: normalizedSellerId,
    });
    return {
      orderId,
      itemIndex,
      trackingStatus: currentStatus,
      shipment: toPublicCargoShipment(existing),
      alreadySubmitted: true,
    };
  }

  if (currentStatus !== "collected") {
    throw new HttpError(
      409,
      "Avval buyurtmani yig‘ish kerak",
      "ORDER_TRACKING_STATUS_CONFLICT",
    );
  }

  const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
  const productId = Number(item.productId) || 0;
  const productDoc = productId
    ? await Product.findOne({ id: productId }).select({ weight: 1, id: 1 }).lean()
    : null;
  const { weightKg, estimated } = resolveWeightKg(productDoc, quantity);

  const products = [];
  for (let unitIndex = 0; unitIndex < quantity; unitIndex += 1) {
    products.push({
      productId,
      title: resolveTitle(item.title),
      image: String(item.image || "/img/no-image.png"),
      color: String(item.color || ""),
      size: String(item.size || ""),
      storage: String(item.storage || ""),
      model: String(item.model || ""),
      quantity: 1,
      weightKg: Number((weightKg / quantity).toFixed(3)),
      unitIndex,
    });
  }

  const note = String(payload.note || "").trim();
  const submittedAt = new Date();
  const requestCode = await nextRequestCode(submittedAt);

  let shipment;
  try {
    shipment = await CargoShipment.create({
      requestCode,
      sellerId: normalizedSellerId,
      sellerCountry: String(account.sellerCountry || "").toLowerCase(),
      storeName: resolveStoreName(account),
      orderId,
      itemIndex,
      products,
      productCount: quantity,
      weightKg,
      weightLabel: estimated ? "Taxminiy og'irlik" : "Og'irlik",
      warehouseAddress: String(account.address || "").trim(),
      note,
      status: "pending",
      processStep: null,
      logisticaId: null,
      submittedAt,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await CargoShipment.findOne({
        orderId,
        itemIndex,
        sellerId: normalizedSellerId,
      });
      if (existing) {
        item.trackingStatus = "ready_for_cargo";
        if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
        const hasReady = item.trackingHistory.some(
          (entry) => String(entry?.status || "") === "ready_for_cargo",
        );
        if (!hasReady) {
          item.trackingHistory.push({ status: "ready_for_cargo", at: submittedAt });
        }
        order.markModified("items");
        await order.save();
        return {
          orderId,
          itemIndex,
          trackingStatus: "ready_for_cargo",
          shipment: toPublicCargoShipment(existing),
          alreadySubmitted: true,
        };
      }
    }
    throw error;
  }

  item.trackingStatus = "ready_for_cargo";
  if (!Array.isArray(item.trackingHistory)) item.trackingHistory = [];
  item.trackingHistory.push({ status: "ready_for_cargo", at: submittedAt });
  order.markModified("items");
  await order.save();

  return {
    orderId,
    itemIndex,
    trackingStatus: "ready_for_cargo",
    shipment: toPublicCargoShipment(shipment),
    alreadySubmitted: false,
  };
}

module.exports = {
  submitSellerOrderItemToCargo,
  listCargoShipmentsByOrderItems,
  shipmentLookupKey,
  toPublicCargoShipment,
};
