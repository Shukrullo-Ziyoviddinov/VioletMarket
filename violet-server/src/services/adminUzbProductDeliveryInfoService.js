const { UzbProductDeliveryInfo } = require("../models");
const { HttpError } = require("../utils/httpError");

function clean(value) {
  return String(value || "").trim();
}

function normalizeLocalized(value, label) {
  if (!value || typeof value !== "object") {
    throw new HttpError(400, `${label}.uz va ${label}.ru to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  const uz = clean(value.uz);
  const ru = clean(value.ru);
  if (!uz || !ru) {
    throw new HttpError(400, `${label}.uz va ${label}.ru to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  return { uz, ru };
}

function toResponse(row) {
  if (!row) return { deliveryInfo: null };
  return {
    deliveryInfo: {
      title: row.title,
      text: row.text,
    },
  };
}

async function getInfo() {
  const row = await UzbProductDeliveryInfo.findOne({ key: "default" }).lean();
  return toResponse(row);
}

async function upsertInfo(payload) {
  const deliveryInfo = payload?.deliveryInfo;
  if (!deliveryInfo || typeof deliveryInfo !== "object") {
    throw new HttpError(400, "deliveryInfo yuborilishi shart", "VALIDATION_ERROR");
  }

  const title = normalizeLocalized(deliveryInfo.title, "deliveryInfo.title");
  const text = normalizeLocalized(deliveryInfo.text, "deliveryInfo.text");

  await UzbProductDeliveryInfo.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        key: "default",
        title,
        text,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return getInfo();
}

async function deleteInfo() {
  const deleted = await UzbProductDeliveryInfo.findOneAndDelete({ key: "default" });
  if (!deleted) {
    throw new HttpError(404, "Mahsulot UZB ombori ma'lumoti topilmadi", "NOT_FOUND");
  }
  return { deliveryInfo: null };
}

module.exports = {
  getInfo,
  upsertInfo,
  deleteInfo,
};
