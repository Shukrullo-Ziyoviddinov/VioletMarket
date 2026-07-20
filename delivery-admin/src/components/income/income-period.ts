import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

export type IncomePeriod = 'day' | 'week' | 'month';

export type IncomePeriodOption = {
  key: string;
  label: string;
  income: number;
  count: number;
};

export const INCOME_PERIODS: { key: IncomePeriod; label: string }[] = [
  { key: 'day', label: 'Kun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Oy' },
];

const MONTH_NAMES_UZ = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

export function startOfMonth(date = new Date()) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

export function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function deliveredAt(order: DeliveryAcceptedOrder) {
  if (!order.deliveredAt) return null;
  const date = new Date(order.deliveredAt);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function toDayKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toWeekKey(date: Date) {
  const start = startOfWeek(date);
  return toDayKey(start);
}

export function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function parseDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  if (![y, m, d].every(Number.isFinite)) return null;
  return startOfDay(new Date(y, m - 1, d));
}

export function parseMonthKey(key: string) {
  const [y, m] = key.split('-').map(Number);
  if (![y, m].every(Number.isFinite)) return null;
  return startOfMonth(new Date(y, m - 1, 1));
}

export function formatDayLabel(date: Date) {
  return `${date.getDate()} ${MONTH_NAMES_UZ[date.getMonth()]}`;
}

export function formatWeekLabel(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()}–${weekEnd.getDate()} ${MONTH_NAMES_UZ[weekStart.getMonth()]}`;
  }
  return `${formatDayLabel(weekStart)} – ${formatDayLabel(weekEnd)}`;
}

export function formatMonthLabel(date: Date) {
  const name = MONTH_NAMES_UZ[date.getMonth()];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getFullYear()}`;
}

export function sumCourierIncome(orders: DeliveryAcceptedOrder[]) {
  return orders.reduce(
    (sum, order) => sum + Math.max(0, Number(order.courierPayment) || 0),
    0,
  );
}

function incomeForRange(
  orders: DeliveryAcceptedOrder[],
  from: Date,
  to: Date,
) {
  const matched = orders.filter((order) => {
    const at = deliveredAt(order);
    return at != null && at >= from && at <= to;
  });
  return {
    income: sumCourierIncome(matched),
    count: matched.length,
  };
}

/** Shu oydagi barcha kunlar (1 … oy oxiri). Buyurtma bo‘lmasa 0. */
export function buildDayOptions(
  orders: DeliveryAcceptedOrder[],
  baseDate = new Date(),
): IncomePeriodOption[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = endOfMonth(baseDate).getDate();
  const options: IncomePeriodOption[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = startOfDay(new Date(year, month, day));
    const from = date;
    const to = new Date(year, month, day, 23, 59, 59, 999);
    const stats = incomeForRange(orders, from, to);
    options.push({
      key: toDayKey(date),
      label: formatDayLabel(date),
      income: stats.income,
      count: stats.count,
    });
  }

  return options;
}

/** Shu oyga tegishli haftalar. */
export function buildWeekOptions(
  orders: DeliveryAcceptedOrder[],
  baseDate = new Date(),
): IncomePeriodOption[] {
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);
  let cursor = startOfWeek(monthStart);
  const options: IncomePeriodOption[] = [];
  const seen = new Set<string>();

  while (cursor <= monthEnd) {
    const weekStart = startOfDay(cursor);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const overlapsMonth = weekEnd >= monthStart && weekStart <= monthEnd;
    if (overlapsMonth) {
      const key = toWeekKey(weekStart);
      if (!seen.has(key)) {
        seen.add(key);
        const stats = incomeForRange(orders, weekStart, weekEnd);
        options.push({
          key,
          label: formatWeekLabel(weekStart),
          income: stats.income,
          count: stats.count,
        });
      }
    }

    cursor = new Date(weekStart);
    cursor.setDate(cursor.getDate() + 7);
  }

  return options;
}

/** Joriy yildagi oylar (yanvar … joriy oy). */
export function buildMonthOptions(
  orders: DeliveryAcceptedOrder[],
  baseDate = new Date(),
): IncomePeriodOption[] {
  const year = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth();
  const options: IncomePeriodOption[] = [];

  for (let month = 0; month <= currentMonth; month += 1) {
    const date = startOfMonth(new Date(year, month, 1));
    const from = date;
    const to = endOfMonth(date);
    const stats = incomeForRange(orders, from, to);
    options.push({
      key: toMonthKey(date),
      label: formatMonthLabel(date),
      income: stats.income,
      count: stats.count,
    });
  }

  return options.reverse();
}

export function filterOrdersBySelection(
  orders: DeliveryAcceptedOrder[],
  period: IncomePeriod,
  selectedKey: string,
) {
  if (period === 'day') {
    const day = parseDayKey(selectedKey);
    if (!day) return [];
    const to = new Date(day);
    to.setHours(23, 59, 59, 999);
    return orders.filter((order) => {
      const at = deliveredAt(order);
      return at != null && at >= day && at <= to;
    });
  }

  if (period === 'week') {
    const weekStart = parseDayKey(selectedKey);
    if (!weekStart) return [];
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return orders.filter((order) => {
      const at = deliveredAt(order);
      return at != null && at >= weekStart && at <= weekEnd;
    });
  }

  const month = parseMonthKey(selectedKey);
  if (!month) return [];
  const to = endOfMonth(month);
  return orders.filter((order) => {
    const at = deliveredAt(order);
    return at != null && at >= month && at <= to;
  });
}

export function incomeForSelection(
  orders: DeliveryAcceptedOrder[],
  period: IncomePeriod,
  selectedKey: string,
) {
  return sumCourierIncome(filterOrdersBySelection(orders, period, selectedKey));
}

export function buildIncomePeriodStats(
  orders: DeliveryAcceptedOrder[],
  selection: {
    dayKey: string;
    weekKey: string;
    monthKey: string;
  },
) {
  return {
    dayIncome: incomeForSelection(orders, 'day', selection.dayKey),
    weekIncome: incomeForSelection(orders, 'week', selection.weekKey),
    monthIncome: incomeForSelection(orders, 'month', selection.monthKey),
  };
}

/** @deprecated use filterOrdersBySelection */
export function filterOrdersByPeriod(
  orders: DeliveryAcceptedOrder[],
  period: IncomePeriod,
) {
  const now = new Date();
  const key =
    period === 'day'
      ? toDayKey(now)
      : period === 'week'
        ? toWeekKey(now)
        : toMonthKey(now);
  return filterOrdersBySelection(orders, period, key);
}

export function formatIncomeAmount(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

export function formatIncomeDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function resolveProductTitle(order: DeliveryAcceptedOrder) {
  return (
    String(order.title?.uz || '').trim() ||
    String(order.title?.ru || '').trim() ||
    'Mahsulot'
  );
}

export function resolveDistrict(order: DeliveryAcceptedOrder) {
  return (
    String(order.deliveryAddress?.district || '').trim() ||
    'Tuman ko‘rsatilmagan'
  );
}

export function formatDistanceKm(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${Number(value)} km`;
}

export function pickerTitle(period: IncomePeriod) {
  if (period === 'day') return 'Kunni tanlang';
  if (period === 'week') return 'Haftani tanlang';
  return 'Oyni tanlang';
}
