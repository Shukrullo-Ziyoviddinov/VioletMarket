const { FlashSaleCountdown } = require("../../models/flashSaleCountdown");
const { HttpError } = require("../../utils/httpError");
const {
  parseDurationHours,
  parseProductId,
  durationToMs,
  buildClientPayload,
} = require("./flashSaleCountdownHelpers");

function cycleExpired(row, now) {
  return !row?.cycleEndsAt || row.cycleEndsAt.getTime() <= now.getTime();
}

function durationChanged(row, durationHours) {
  return row && Number(row.durationHours) !== Number(durationHours);
}

async function getOrStartCycle(productId, durationHours) {
  const now = new Date();
  let row = await FlashSaleCountdown.findOne({ productId }).lean();

  if (!row || cycleExpired(row, now) || durationChanged(row, durationHours)) {
    const cycleEndsAt = new Date(now.getTime() + durationToMs(durationHours));
    row = await FlashSaleCountdown.findOneAndUpdate(
      { productId },
      {
        $set: {
          productId,
          durationHours,
          cycleEndsAt,
        },
      },
      { upsert: true, new: true, lean: true },
    );
  }

  return buildClientPayload(row, now);
}

async function getForProduct(rawProductId, rawDurationHours) {
  const productId = parseProductId(rawProductId);
  const durationHours = parseDurationHours(rawDurationHours);
  if (productId == null) {
    throw new HttpError(400, "Mahsulot ID noto'g'ri", "INVALID_PRODUCT_ID");
  }
  if (durationHours == null) {
    throw new HttpError(400, "flashDurationHours noto'g'ri", "INVALID_DURATION");
  }
  return getOrStartCycle(productId, durationHours);
}

async function syncBatch(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new HttpError(400, "items massivi kerak", "INVALID_ITEMS");
  }

  if (rawItems.length > 50) {
    throw new HttpError(400, "Bir so'rovda ko'pi bilan 50 ta mahsulot", "TOO_MANY_ITEMS");
  }

  const tasks = rawItems.map((item, index) => {
    const productId = parseProductId(item?.productId);
    const durationHours = parseDurationHours(item?.durationHours);
    if (productId == null || durationHours == null) {
      return Promise.resolve({
        error: true,
        index,
        message: "productId yoki flashDurationHours noto'g'ri",
      });
    }
    return getOrStartCycle(productId, durationHours).then((data) => ({
      error: false,
      index,
      ...data,
    }));
  });

  const results = await Promise.all(tasks);
  const now = new Date();
  return {
    serverNow: now.toISOString(),
    items: results,
  };
}

module.exports = {
  getForProduct,
  syncBatch,
};
