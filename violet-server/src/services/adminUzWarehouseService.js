const { UzWarehouseLocale } = require("../models");
const { HttpError } = require("../utils/httpError");

function normalizeSrcPair(src, label) {
  if (!src || typeof src !== "object") {
    throw new HttpError(400, `${label}.src to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  const uz = String(src.uz || "").trim();
  const ru = String(src.ru || "").trim();
  if (!uz || !ru) {
    throw new HttpError(400, `${label}.src.uz va ${label}.src.ru to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  return { uz, ru };
}

function mapBySlots(rows) {
  const result = {
    uzWarehouseData: null,
    chinaWarehouseData: null,
  };
  const uzRow = rows.find((row) => Number(row.slot) === 1);
  const chinaRow = rows.find((row) => Number(row.slot) === 2);

  if (uzRow?.src) {
    result.uzWarehouseData = { src: uzRow.src };
  }
  if (chinaRow?.src) {
    result.chinaWarehouseData = { src: chinaRow.src };
  }
  return result;
}

async function getWarehouseBanners() {
  const rows = await UzWarehouseLocale.find().sort({ slot: 1 }).lean();
  return mapBySlots(rows);
}

async function upsertWarehouseBanners(payload) {
  const hasUz = payload?.uzWarehouseData?.src != null;
  const hasChina = payload?.chinaWarehouseData?.src != null;

  if (!hasUz && !hasChina) {
    throw new HttpError(
      400,
      "uzWarehouseData.src yoki chinaWarehouseData.src yuborilishi shart",
      "VALIDATION_ERROR",
    );
  }

  if (hasUz) {
    const src = normalizeSrcPair(payload.uzWarehouseData.src, "uzWarehouseData");
    await UzWarehouseLocale.findOneAndUpdate(
      { slot: 1 },
      { $set: { slot: 1, src } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  if (hasChina) {
    const src = normalizeSrcPair(payload.chinaWarehouseData.src, "chinaWarehouseData");
    await UzWarehouseLocale.findOneAndUpdate(
      { slot: 2 },
      { $set: { slot: 2, src } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  return getWarehouseBanners();
}

module.exports = {
  getWarehouseBanners,
  upsertWarehouseBanners,
};
