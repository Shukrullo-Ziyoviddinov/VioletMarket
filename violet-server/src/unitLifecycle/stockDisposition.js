/**
 * Qaytarish sababi → ombor amali (bitta joy).
 *
 * return     → releaseToWarehouse (+ombor, −reserved)
 * no_answer  → keepReserved (o‘zgarmaydi)
 * defective  → discardReserved (−reserved, ombor/algoritmga tegmaydi)
 *
 * Idempotent claim: avval CourierReturnedOrder flag, keyin inventory.
 * Shu bilan stock muvaffaqiyatli / DB yozuvi fail bo‘lsa qayta urinishda
 * ombor ikki marta o‘zgarmaydi.
 */

const { CourierReturnedOrder } = require("../models/courierReturnedOrder");
const {
  releaseToWarehouse,
  keepReserved,
  discardReserved,
} = require("../inventory");
const { HttpError } = require("../utils/httpError");
const { REASON_TYPES } = require("./constants");

/**
 * Past daraja — faqat flag berilganda (legacy). Yangi kod claimAndApply ishlatsin.
 * @returns {{ stockReleased: boolean, stockDiscarded: boolean }}
 */
async function applyReturnStockDisposition(
  reasonType,
  productId,
  qty = 1,
  variant = {},
  flags = {},
) {
  const reason = String(reasonType || "").trim().toLowerCase();
  if (!REASON_TYPES.has(reason)) {
    throw new HttpError(400, "Sabab turi noto‘g‘ri", "INVALID_REASON_TYPE");
  }

  if (reason === "return") {
    if (!flags.stockReleased) {
      await releaseToWarehouse(productId, qty, variant);
    }
    return { stockReleased: true, stockDiscarded: false };
  }

  if (reason === "no_answer") {
    await keepReserved(productId, qty, variant);
    return {
      stockReleased: false,
      stockDiscarded: Boolean(flags.stockDiscarded),
    };
  }

  if (!flags.stockDiscarded) {
    await discardReserved(productId, qty, variant);
  }
  return { stockReleased: false, stockDiscarded: true };
}

/**
 * Atomik claim → inventory. Qayta urinishda ikki marta stock yo‘q.
 *
 * @returns {{ stockReleased: boolean, stockDiscarded: boolean }}
 */
async function claimAndApplyReturnStockDisposition({
  returnedOrderId,
  reasonType,
  productId,
  qty = 1,
  variant = {},
}) {
  const id = returnedOrderId;
  if (!id) {
    throw new HttpError(500, "Returned order ID yo‘q", "RETURNED_ORDER_ID_MISSING");
  }

  const reason = String(reasonType || "").trim().toLowerCase();
  if (!REASON_TYPES.has(reason)) {
    throw new HttpError(400, "Sabab turi noto‘g‘ri", "INVALID_REASON_TYPE");
  }

  if (reason === "no_answer") {
    const doc = await CourierReturnedOrder.findById(id)
      .select("stockReleased stockDiscarded")
      .lean();
    await keepReserved(productId, qty, variant);
    return {
      stockReleased: false,
      stockDiscarded: Boolean(doc?.stockDiscarded),
    };
  }

  if (reason === "return") {
    const claimed = await CourierReturnedOrder.findOneAndUpdate(
      { _id: id, stockReleased: false },
      { $set: { stockReleased: true, stockDiscarded: false } },
      { new: false },
    );

    if (!claimed) {
      const current = await CourierReturnedOrder.findById(id)
        .select("stockReleased stockDiscarded")
        .lean();
      if (current?.stockReleased) {
        return {
          stockReleased: true,
          stockDiscarded: Boolean(current.stockDiscarded),
        };
      }
      throw new HttpError(404, "Qaytarilgan yozuv topilmadi", "RETURNED_ORDER_NOT_FOUND");
    }

    try {
      await releaseToWarehouse(productId, qty, variant);
    } catch (err) {
      await CourierReturnedOrder.updateOne(
        { _id: id },
        { $set: { stockReleased: false } },
      );
      throw err;
    }

    return { stockReleased: true, stockDiscarded: false };
  }

  // defective
  const claimed = await CourierReturnedOrder.findOneAndUpdate(
    { _id: id, stockDiscarded: false },
    { $set: { stockDiscarded: true, stockReleased: false } },
    { new: false },
  );

  if (!claimed) {
    const current = await CourierReturnedOrder.findById(id)
      .select("stockReleased stockDiscarded")
      .lean();
    if (current?.stockDiscarded) {
      return {
        stockReleased: Boolean(current.stockReleased),
        stockDiscarded: true,
      };
    }
    throw new HttpError(404, "Qaytarilgan yozuv topilmadi", "RETURNED_ORDER_NOT_FOUND");
  }

  try {
    await discardReserved(productId, qty, variant);
  } catch (err) {
    await CourierReturnedOrder.updateOne(
      { _id: id },
      { $set: { stockDiscarded: false } },
    );
    throw err;
  }

  return { stockReleased: false, stockDiscarded: true };
}

module.exports = {
  applyReturnStockDisposition,
  claimAndApplyReturnStockDisposition,
};
