const { CargoRegionRate, DeliveryRegionPrice } = require("../models");
const { HttpError } = require("../utils/httpError");

function clean(value) {
  return String(value || "").trim();
}

function toSortOrder(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new HttpError(400, "sortOrder noto'g'ri", "VALIDATION_ERROR");
  }
  return Math.floor(n);
}

function normalizeObjectPayload(value, label = "data") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, `${label} object bo'lishi kerak`, "VALIDATION_ERROR");
  }
  return value;
}

function stripMongoMeta(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = plain;
  return rest;
}

async function getNextSortOrder(Model) {
  const last = await Model.findOne().sort({ sortOrder: -1 }).lean();
  return Number.isFinite(last?.sortOrder) ? Number(last.sortOrder) + 1 : 0;
}

async function listCargoAdminData() {
  const [cargoRates, deliveryPrices] = await Promise.all([
    CargoRegionRate.find().sort({ sortOrder: 1, key: 1 }).lean(),
    DeliveryRegionPrice.find().sort({ sortOrder: 1, key: 1 }).lean(),
  ]);
  return {
    cargoRates: cargoRates.map(stripMongoMeta),
    deliveryPrices: deliveryPrices.map(stripMongoMeta),
  };
}

async function createCargoRate(payload) {
  const key = clean(payload?.key);
  if (!key) {
    throw new HttpError(400, "key to'ldirilishi shart", "VALIDATION_ERROR");
  }
  const existing = await CargoRegionRate.findOne({ key }).lean();
  if (existing) {
    throw new HttpError(409, "Bunday key allaqachon mavjud", "DUPLICATE_KEY");
  }
  const defaultSortOrder = await getNextSortOrder(CargoRegionRate);
  const row = new CargoRegionRate({
    key,
    sortOrder: toSortOrder(payload?.sortOrder, defaultSortOrder),
    data: normalizeObjectPayload(payload?.data, "data"),
  });
  await row.save();
  return stripMongoMeta(row);
}

async function updateCargoRate(rateKey, payload) {
  const sourceKey = clean(rateKey);
  const row = await CargoRegionRate.findOne({ key: sourceKey });
  if (!row) {
    throw new HttpError(404, "Cargo rate topilmadi", "NOT_FOUND");
  }

  const nextKey = clean(payload?.key || sourceKey);
  if (!nextKey) {
    throw new HttpError(400, "key to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (nextKey !== sourceKey) {
    const duplicate = await CargoRegionRate.findOne({ key: nextKey }).lean();
    if (duplicate) {
      throw new HttpError(409, "Yangi key band", "DUPLICATE_KEY");
    }
  }

  row.key = nextKey;
  if (payload?.sortOrder !== undefined) {
    row.sortOrder = toSortOrder(payload.sortOrder, row.sortOrder);
  }
  if (payload?.data !== undefined) {
    row.data = normalizeObjectPayload(payload.data, "data");
  }

  await row.save();
  return stripMongoMeta(row);
}

async function deleteCargoRate(rateKey) {
  const key = clean(rateKey);
  const deleted = await CargoRegionRate.findOneAndDelete({ key });
  if (!deleted) {
    throw new HttpError(404, "Cargo rate topilmadi", "NOT_FOUND");
  }
}

async function createDeliveryPrice(payload) {
  const key = clean(payload?.key);
  if (!key) {
    throw new HttpError(400, "key to'ldirilishi shart", "VALIDATION_ERROR");
  }
  const existing = await DeliveryRegionPrice.findOne({ key }).lean();
  if (existing) {
    throw new HttpError(409, "Bunday key allaqachon mavjud", "DUPLICATE_KEY");
  }
  const defaultSortOrder = await getNextSortOrder(DeliveryRegionPrice);
  const row = new DeliveryRegionPrice({
    key,
    sortOrder: toSortOrder(payload?.sortOrder, defaultSortOrder),
    data: normalizeObjectPayload(payload?.data, "data"),
  });
  await row.save();
  return stripMongoMeta(row);
}

async function updateDeliveryPrice(regionKey, payload) {
  const sourceKey = clean(regionKey);
  const row = await DeliveryRegionPrice.findOne({ key: sourceKey });
  if (!row) {
    throw new HttpError(404, "Delivery price topilmadi", "NOT_FOUND");
  }

  const nextKey = clean(payload?.key || sourceKey);
  if (!nextKey) {
    throw new HttpError(400, "key to'ldirilishi shart", "VALIDATION_ERROR");
  }
  if (nextKey !== sourceKey) {
    const duplicate = await DeliveryRegionPrice.findOne({ key: nextKey }).lean();
    if (duplicate) {
      throw new HttpError(409, "Yangi key band", "DUPLICATE_KEY");
    }
  }

  row.key = nextKey;
  if (payload?.sortOrder !== undefined) {
    row.sortOrder = toSortOrder(payload.sortOrder, row.sortOrder);
  }
  if (payload?.data !== undefined) {
    row.data = normalizeObjectPayload(payload.data, "data");
  }

  await row.save();
  return stripMongoMeta(row);
}

async function deleteDeliveryPrice(regionKey) {
  const key = clean(regionKey);
  const deleted = await DeliveryRegionPrice.findOneAndDelete({ key });
  if (!deleted) {
    throw new HttpError(404, "Delivery price topilmadi", "NOT_FOUND");
  }
}

module.exports = {
  listCargoAdminData,
  createCargoRate,
  updateCargoRate,
  deleteCargoRate,
  createDeliveryPrice,
  updateDeliveryPrice,
  deleteDeliveryPrice,
};
