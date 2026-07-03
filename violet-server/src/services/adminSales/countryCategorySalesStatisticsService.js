const { CountryCategoryProductSale } = require("../../models/countryCategoryProductSale");
const { BrandCountryFilterValue } = require("../../models/brandCountryFilterValue");
const { CountryCategory } = require("../../models/countryCategory");
const { toNumber } = require("./salesStatisticsHelpers");
const { resolveSelectedFilters, buildSalesFilterOptions } = require("./salesFilterOptionsService");
const { backfillCountryCategoryProductSalesFromOrders } = require("../../productManagement/recordCountryCategoryProductSales");
const {
  addDaysToDateKey,
  getIsoWeekStart,
  parseMonthKey,
} = require("../../utils/customerStatisticsDate");

const PERIOD_LABELS = {
  day: "Kunlik",
  week: "Haftalik",
  month: "Oylik",
};

const MONTH_LABELS_UZ = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

const COUNTRY_CATEGORY_COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#b45309",
  "#db2777",
  "#0d9488",
  "#4f46e5",
  "#dc2626",
  "#65a30d",
  "#0891b2",
  "#ea580c",
];

function normalizeFilterToken(value) {
  return String(value || "").trim().toLowerCase();
}

function resolvePeriod(raw) {
  const period = String(raw || "day").trim();
  if (period === "week" || period === "month") return period;
  return "day";
}

function buildPeriodMatch(period, filters) {
  const match = { countriesCategories: { $ne: "" } };
  if (period === "week") {
    match.weekKey = String(filters.week || "");
  } else if (period === "month") {
    match.monthKey = String(filters.month || "");
  } else {
    match.dateKey = String(filters.day || "");
  }
  return match;
}

function formatDayLabel(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))] || "";
  return `${day} ${monthLabel} ${year}`.trim();
}

function formatMonthLabel(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))] || "";
  return `${monthLabel} ${year}`;
}

function formatWeekLabel(weekKey) {
  const raw = String(weekKey || "");
  const match = /^(\d{4})-W(\d{1,2})$/.exec(raw);
  if (!match) return raw;

  const isoYear = Number(match[1]);
  const week = Number(match[2]);
  const weekStartKey = getIsoWeekStart(isoYear, week);
  const weekEndKey = addDaysToDateKey(weekStartKey, 6);
  const startLabel = formatDayLabel(weekStartKey).replace(/\s\d{4}$/, "");
  const endLabel = formatDayLabel(weekEndKey);
  return `${startLabel} - ${endLabel}`;
}

function buildScopeLabel(period, filters) {
  if (period === "week") {
    return formatWeekLabel(filters.week);
  }
  if (period === "month") {
    return formatMonthLabel(filters.month);
  }
  return formatDayLabel(filters.day);
}

async function loadCountryMetadata() {
  const [filterRows, categoryRows] = await Promise.all([
    BrandCountryFilterValue.find({ type: "country" })
      .select("filterValue")
      .sort({ id: 1 })
      .lean(),
    CountryCategory.find()
      .select("filterValue name")
      .lean(),
  ]);

  const allowedValues = filterRows
    .map((row) => String(row.filterValue || "").trim())
    .filter(Boolean);

  const labelByFilterValue = new Map();
  for (const row of categoryRows) {
    const filterValue = String(row.filterValue || "").trim();
    if (!filterValue) continue;
    const label = String(row?.name?.uz || row?.name?.ru || filterValue).trim();
    labelByFilterValue.set(normalizeFilterToken(filterValue), label);
  }

  return {
    allowedValues,
    allowedTokens: new Set(allowedValues.map((value) => normalizeFilterToken(value))),
    labelByFilterValue,
  };
}

function buildCountryCategoryRows(rows, totalQuantity, metadata) {
  return rows
    .map((row, index) => {
      const filterValue = String(row._id || "").trim();
      const token = normalizeFilterToken(filterValue);
      if (!metadata.allowedTokens.has(token)) return null;

      return {
        filterValue,
        label: metadata.labelByFilterValue.get(token) || filterValue,
        quantity: toNumber(row.totalQuantity, 0),
        percentage: totalQuantity > 0
          ? Math.round((toNumber(row.totalQuantity, 0) / totalQuantity) * 1000) / 10
          : 0,
        color: COUNTRY_CATEGORY_COLORS[index % COUNTRY_CATEGORY_COLORS.length],
      };
    })
    .filter((item) => item && item.filterValue && item.quantity > 0);
}

async function buildCountryCategorySalesStatistics(query = {}) {
  await backfillCountryCategoryProductSalesFromOrders();

  const filterOptions = await buildSalesFilterOptions();
  const filters = resolveSelectedFilters(query, filterOptions);
  const period = resolvePeriod(query.period);
  const match = buildPeriodMatch(period, filters);
  const metadata = await loadCountryMetadata();

  const rows = await CountryCategoryProductSale.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$countriesCategories",
        totalQuantity: { $sum: "$quantity" },
      },
    },
    { $sort: { totalQuantity: -1, _id: 1 } },
  ]);

  const totalQuantity = rows.reduce(
    (sum, row) => sum + toNumber(row.totalQuantity, 0),
    0,
  );

  return {
    period,
    periodLabel: PERIOD_LABELS[period] || PERIOD_LABELS.day,
    scopeLabel: buildScopeLabel(period, filters),
    filters,
    totalQuantity,
    countries: buildCountryCategoryRows(rows, totalQuantity, metadata),
  };
}

module.exports = {
  buildCountryCategorySalesStatistics,
};
