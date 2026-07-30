/**
 * Logistica Tarix balansi.
 * Faqat To‘landi (paidAt) — admin «mijoz to‘lovini tasdiqlash» aralashmaydi.
 * Summa = cargoDeliveryFee (kg uchun yozilgan).
 */

const mongoose = require("mongoose");
const { CargoShipment } = require("../../models/cargoShipment");
const { LogisticaProfile } = require("../../models/logisticaProfile");
const { HttpError } = require("../../utils/httpError");
const { toNumber } = require("../adminSales/salesStatisticsHelpers");

const MONTH_LABELS_UZ = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

/** Asia/Tashkent (UTC+5) — sana chegaralari */
function uzWallToUtcDate(year, month1to12, day, hour = 0, minute = 0, second = 0) {
  return new Date(
    Date.UTC(year, month1to12 - 1, day, hour - 5, minute, second, 0),
  );
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toYmd(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  // Convert UTC instant → UZ wall by +5h for labeling helpers that use UTC getters after shift
  const shifted = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    ymd: `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`,
  };
}

function nowUzParts() {
  return toYmd(new Date());
}

function daysInMonth(year, month1to12) {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

function buildMonthRange(year, month1to12) {
  const y = Math.floor(Number(year));
  const m = Math.floor(Number(month1to12));
  if (!Number.isFinite(y) || y < 2000 || y > 2100) {
    throw new HttpError(400, "Yil noto‘g‘ri", "INVALID_YEAR");
  }
  if (!Number.isFinite(m) || m < 1 || m > 12) {
    throw new HttpError(400, "Oy noto‘g‘ri", "INVALID_MONTH");
  }
  const lastDay = daysInMonth(y, m);
  return {
    from: uzWallToUtcDate(y, m, 1, 0, 0, 0),
    to: uzWallToUtcDate(y, m, lastDay, 23, 59, 59),
    label: `${MONTH_LABELS_UZ[m - 1]} ${y}`,
    year: y,
    month: m,
  };
}

function parseYmd(raw) {
  const text = String(raw || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day, ymd: text };
}

/** Dushanba 00:00 → yakshanba 23:59:59 (UZ) */
function buildWeekRange(weekStartYmd) {
  const parsed = parseYmd(weekStartYmd);
  if (!parsed) {
    throw new HttpError(400, "Hafta boshi noto‘g‘ri", "INVALID_WEEK_START");
  }
  const from = uzWallToUtcDate(parsed.year, parsed.month, parsed.day, 0, 0, 0);
  // Monday check in UZ wall
  const wall = new Date(from.getTime() + 5 * 60 * 60 * 1000);
  const weekday = wall.getUTCDay(); // 0 Sun .. 6 Sat in shifted calendar
  if (weekday !== 1) {
    throw new HttpError(400, "Hafta dushanbadan boshlanishi kerak", "WEEK_NOT_MONDAY");
  }
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  const endParts = toYmd(to);
  return {
    from,
    to,
    label: `${pad2(parsed.day)}.${pad2(parsed.month)} – ${pad2(endParts.day)}.${pad2(endParts.month)}.${endParts.year}`,
    weekStart: parsed.ymd,
    weekEnd: endParts.ymd,
  };
}

function mondayOnOrBefore(parts) {
  const from = uzWallToUtcDate(parts.year, parts.month, parts.day, 12, 0, 0);
  const wall = new Date(from.getTime() + 5 * 60 * 60 * 1000);
  const weekday = wall.getUTCDay(); // 0 Sun
  const offsetToMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = new Date(from.getTime() - offsetToMonday * 24 * 60 * 60 * 1000);
  return toYmd(monday).ymd;
}

function buildMonthOptions(count = 12) {
  const now = nowUzParts();
  const options = [];
  let y = now.year;
  let m = now.month;
  for (let i = 0; i < count; i += 1) {
    options.push({
      key: `${y}-${pad2(m)}`,
      label: `${MONTH_LABELS_UZ[m - 1]} ${y}`,
      year: y,
      month: m,
    });
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
  }
  return options;
}

function buildWeekOptions(count = 12) {
  const now = nowUzParts();
  let weekStart = mondayOnOrBefore(now);
  const options = [];
  for (let i = 0; i < count; i += 1) {
    const range = buildWeekRange(weekStart);
    options.push({
      key: range.weekStart,
      label: range.label,
      weekStart: range.weekStart,
      weekEnd: range.weekEnd,
    });
    const prev = parseYmd(weekStart);
    const prevMonday = uzWallToUtcDate(prev.year, prev.month, prev.day, 12, 0, 0);
    const earlier = new Date(prevMonday.getTime() - 7 * 24 * 60 * 60 * 1000);
    weekStart = toYmd(earlier).ymd;
  }
  return options;
}

async function assertActiveLogistica(logisticaId) {
  if (!mongoose.isValidObjectId(logisticaId)) {
    throw new HttpError(401, "Avtorizatsiya noto‘g‘ri", "UNAUTHORIZED");
  }
  const profile = await LogisticaProfile.findById(logisticaId)
    .select({ status: 1 })
    .lean();
  if (!profile || profile.status !== "active") {
    throw new HttpError(403, "Logistica akkaunt faol emas", "ACCOUNT_BLOCKED");
  }
}

/**
 * To‘landi bosilgan yuklar: paidAt oralig‘ida cargoDeliveryFee yig‘indisi.
 */
async function getBalanceForLogistica(logisticaId, query = {}) {
  await assertActiveLogistica(logisticaId);

  const modeRaw = String(query.mode || query.period || "month")
    .trim()
    .toLowerCase();
  const mode = modeRaw === "week" ? "week" : "month";
  const now = nowUzParts();

  let range;
  let selected;

  if (mode === "week") {
    const weekStart =
      String(query.weekStart || query.from || "").trim() ||
      mondayOnOrBefore(now);
    range = buildWeekRange(weekStart);
    selected = {
      weekStart: range.weekStart,
      weekEnd: range.weekEnd,
    };
  } else {
    const year = toNumber(query.year, now.year);
    const month = toNumber(query.month, now.month);
    range = buildMonthRange(year, month);
    selected = { year: range.year, month: range.month };
  }

  const match = {
    logisticaId: new mongoose.Types.ObjectId(String(logisticaId)),
    paidAt: { $gte: range.from, $lte: range.to },
  };

  const [agg] = await CargoShipment.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        balance: { $sum: { $ifNull: ["$cargoDeliveryFee", 0] } },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    mode,
    periodLabel: range.label,
    from: range.from,
    to: range.to,
    selected,
    balance: Math.max(0, Math.round(Number(agg?.balance) || 0)),
    count: Math.max(0, Number(agg?.count) || 0),
    months: buildMonthOptions(12),
    weeks: buildWeekOptions(12),
  };
}

module.exports = {
  getBalanceForLogistica,
  buildMonthRange,
  buildWeekRange,
  buildMonthOptions,
  buildWeekOptions,
  nowUzParts,
  mondayOnOrBefore,
};
