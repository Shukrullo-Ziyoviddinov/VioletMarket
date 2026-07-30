import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  TarixBalanceModeFilter,
  type TarixBalanceMode,
} from '@/components/tarix/TarixBalanceModeFilter';
import { TarixBalancePeriodDropdown } from '@/components/tarix/TarixBalancePeriodDropdown';
import { TarixBalanceSummary } from '@/components/tarix/TarixBalanceSummary';
import { localeForLanguage } from '@/i18n';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import {
  fetchCargoHistoryBalance,
  type CargoHistoryBalanceResponse,
} from '@/services/logistica-shipments';

type Props = {
  refreshKey?: number;
};

function currentMonthKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function currentWeekStartKey() {
  const now = new Date();
  const day = now.getDay();
  const offset = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - offset);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatMonthLabel(year: number, month: number, locale: string) {
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}

function formatDayMonth(
  year: number,
  month: number,
  day: number,
  locale: string,
  withYear = false,
) {
  return new Date(year, month - 1, day).toLocaleDateString(
    locale,
    withYear
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : { day: '2-digit', month: '2-digit' },
  );
}

function formatWeekLabel(
  weekStart: string,
  weekEnd: string,
  locale: string,
  rangeTemplate: (start: string, end: string) => string,
) {
  const startParts = weekStart.split('-').map(Number);
  const endParts = weekEnd.split('-').map(Number);
  if (startParts.length !== 3 || endParts.length !== 3) {
    return weekStart;
  }
  const [sy, sm, sd] = startParts;
  const [ey, em, ed] = endParts;
  return rangeTemplate(
    formatDayMonth(sy, sm, sd, locale),
    formatDayMonth(ey, em, ed, locale, true),
  );
}

function periodLabelFromData(
  data: CargoHistoryBalanceResponse | null,
  locale: string,
  rangeTemplate: (start: string, end: string) => string,
) {
  if (!data) return '';
  if (data.mode === 'month' && data.selected.year && data.selected.month) {
    return formatMonthLabel(data.selected.year, data.selected.month, locale);
  }
  if (data.selected.weekStart && data.selected.weekEnd) {
    return formatWeekLabel(
      data.selected.weekStart,
      data.selected.weekEnd,
      locale,
      rangeTemplate,
    );
  }
  return data.periodLabel || '';
}

export function TarixBalancePanel({ refreshKey = 0 }: Props) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.language);
  const { token } = useAuth();
  const [mode, setMode] = useState<TarixBalanceMode>('month');
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [weekKey, setWeekKey] = useState(currentWeekStartKey);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<CargoHistoryBalanceResponse | null>(null);

  const rangeTemplate = useCallback(
    (start: string, end: string) => t('balance.weekRange', { start, end }),
    [t],
  );

  const load = useCallback(async () => {
    if (!token) {
      setData(null);
      setLoading(false);
      setError(t('account.authRequired'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [year, month] = monthKey.split('-').map((part) => Number(part));
      const next = await fetchCargoHistoryBalance(token, {
        mode,
        year,
        month,
        weekStart: weekKey,
      });
      setData(next);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t('balance.loadFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, [mode, monthKey, t, token, weekKey]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const monthOptions = useMemo(
    () =>
      (data?.months || []).map((row) => ({
        key: row.key,
        label: formatMonthLabel(row.year, row.month, locale),
      })),
    [data?.months, locale],
  );

  const weekOptions = useMemo(
    () =>
      (data?.weeks || []).map((row) => ({
        key: row.key,
        label: formatWeekLabel(
          row.weekStart,
          row.weekEnd,
          locale,
          rangeTemplate,
        ),
      })),
    [data?.weeks, locale, rangeTemplate],
  );

  const handleModeChange = (next: TarixBalanceMode) => {
    if (next === mode) {
      setDropdownOpen((prev) => !prev);
      return;
    }
    setMode(next);
    setDropdownOpen(true);
  };

  return (
    <View style={styles.panel}>
      <View style={styles.filterArea}>
        <TarixBalanceModeFilter value={mode} onChange={handleModeChange} />

        {dropdownOpen ? (
          <View style={styles.dropdownRow}>
            {mode === 'week' ? <View style={styles.dropdownSpacer} /> : null}
            <View style={styles.dropdownSlot}>
              <TarixBalancePeriodDropdown
                open
                options={mode === 'month' ? monthOptions : weekOptions}
                selectedKey={mode === 'month' ? monthKey : weekKey}
                onSelect={(key) => {
                  if (mode === 'month') setMonthKey(key);
                  else setWeekKey(key);
                  setDropdownOpen(false);
                }}
              />
            </View>
            {mode === 'month' ? <View style={styles.dropdownSpacer} /> : null}
          </View>
        ) : null}
      </View>

      <TarixBalanceSummary
        balance={data?.balance || 0}
        count={data?.count || 0}
        periodLabel={periodLabelFromData(data, locale, rangeTemplate)}
        loading={loading}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  filterArea: {
    position: 'relative',
    zIndex: 30,
  },
  dropdownRow: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    zIndex: 40,
    elevation: 12,
  },
  dropdownSlot: {
    flex: 1,
  },
  dropdownSpacer: {
    flex: 1,
  },
  error: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
});
