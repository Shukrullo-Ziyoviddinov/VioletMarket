const PAID_STATUSES = ["paid", "delivered"];

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function calcPercentageChange(current, previous) {
  const curr = toNumber(current, 0);
  const prev = toNumber(previous, 0);
  if (prev <= 0) {
    if (curr <= 0) return 0;
    return 100;
  }
  return ((curr - prev) / prev) * 100;
}

function formatSignedPercent(value) {
  const rounded = Math.round(value * 10) / 10;
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `${rounded}%`;
  return "0%";
}

function resolveTrendTone(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function resolveGrowthLabel(tone) {
  if (tone === "positive") return "o'sadi";
  if (tone === "negative") return "kamayadi";
  return "tekis";
}

function buildMetricRow(current, previous) {
  const growthPercent = calcPercentageChange(current, previous);
  const tone = resolveTrendTone(growthPercent);
  return {
    value: toNumber(current, 0),
    previousValue: toNumber(previous, 0),
    growthPercent,
    growthFormatted: formatSignedPercent(growthPercent),
    growthLabel: resolveGrowthLabel(tone),
    tone,
  };
}

function dateKeyToRange(dateKey) {
  const start = new Date(`${dateKey}T00:00:00+05:00`);
  const [year, month, day] = dateKey.split("-").map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const endKey = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDay.getUTCDate()).padStart(2, "0")}`;
  const end = new Date(`${endKey}T00:00:00+05:00`);
  return { start, end };
}

function parseWeekKey(weekKey) {
  const raw = String(weekKey || "").trim();
  const match = /^(\d{4})-W(\d{1,2})$/.exec(raw);
  if (!match) return null;
  return { year: Number(match[1]), week: Number(match[2]) };
}

function formatWeekKey(year, week) {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

module.exports = {
  PAID_STATUSES,
  toNumber,
  calcPercentageChange,
  formatSignedPercent,
  resolveTrendTone,
  resolveGrowthLabel,
  buildMetricRow,
  dateKeyToRange,
  parseWeekKey,
  formatWeekKey,
};
