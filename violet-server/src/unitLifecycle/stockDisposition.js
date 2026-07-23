/**
 * Qaytarish sababi → ombor amali (bitta joy).
 *
 * return     → releaseToWarehouse (+ombor, −reserved)
 * no_answer  → keepReserved (o‘zgarmaydi)
 * defective  → discardReserved (−reserved, ombor/algoritmga tegmaydi)
 */

const {
  releaseToWarehouse,
  keepReserved,
  discardReserved,
} = require("../inventory");
const { HttpError } = require("../utils/httpError");
const { REASON_TYPES } = require("./constants");

/**
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

  // defective (Yaroqsiz)
  if (!flags.stockDiscarded) {
    await discardReserved(productId, qty, variant);
  }
  return { stockReleased: false, stockDiscarded: true };
}

module.exports = {
  applyReturnStockDisposition,
};
