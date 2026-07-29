import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  TarixBalanceModeFilter,
  type TarixBalanceMode,
} from '@/components/tarix/TarixBalanceModeFilter';
import { TarixBalancePeriodDropdown } from '@/components/tarix/TarixBalancePeriodDropdown';
import { TarixBalanceSummary } from '@/components/tarix/TarixBalanceSummary';
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

export function TarixBalancePanel({ refreshKey = 0 }: Props) {
  const { token } = useAuth();
  const [mode, setMode] = useState<TarixBalanceMode>('month');
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [weekKey, setWeekKey] = useState(currentWeekStartKey);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<CargoHistoryBalanceResponse | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setData(null);
      setLoading(false);
      setError('Avtorizatsiya talab qilinadi');
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
        err instanceof ApiError ? err.message : 'Balansni yuklab bo‘lmadi',
      );
    } finally {
      setLoading(false);
    }
  }, [mode, monthKey, token, weekKey]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const monthOptions = useMemo(
    () =>
      (data?.months || []).map((row) => ({
        key: row.key,
        label: row.label,
      })),
    [data?.months],
  );

  const weekOptions = useMemo(
    () =>
      (data?.weeks || []).map((row) => ({
        key: row.key,
        label: row.label,
      })),
    [data?.weeks],
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
        periodLabel={data?.periodLabel || ''}
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
