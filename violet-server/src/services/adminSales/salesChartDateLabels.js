const WEEKDAY_NAMES_UZ = [
  "Yakshanba",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];

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

function getWeekdayIndexFromDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function formatChartDayLabel(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))] || "";
  const weekday = WEEKDAY_NAMES_UZ[getWeekdayIndexFromDateKey(dateKey)] || "";
  return `${day} ${monthLabel} ${weekday}`.trim();
}

function formatChartDayTooltip(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))] || "";
  const weekday = WEEKDAY_NAMES_UZ[getWeekdayIndexFromDateKey(dateKey)] || "";
  return `${day} ${monthLabel}, ${year} (${weekday})`;
}

function formatChartMonthLabel(monthKey) {
  const [year, month] = String(monthKey).split("-").map(Number);
  const monthLabel = MONTH_LABELS_UZ[Math.max(0, Math.min(11, month - 1))] || "";
  return `${monthLabel} ${year}`;
}

function formatChartWeekLabel(weekStartKey, weekEndKey) {
  const start = formatChartDayLabel(weekStartKey).split(" ").slice(0, 2).join(" ");
  const end = formatChartDayLabel(weekEndKey).split(" ").slice(0, 2).join(" ");
  return `${start} - ${end}`;
}

module.exports = {
  MONTH_LABELS_UZ,
  formatChartDayLabel,
  formatChartDayTooltip,
  formatChartMonthLabel,
  formatChartWeekLabel,
};
