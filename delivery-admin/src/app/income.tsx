import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IncomeOrderCard } from '@/components/income/IncomeOrderCard';
import { IncomePeriodFilter } from '@/components/income/IncomePeriodFilter';
import { IncomePeriodPickerSheet } from '@/components/income/IncomePeriodPickerSheet';
import { IncomeSummaryCards } from '@/components/income/IncomeSummaryCards';
import {
  buildDayOptions,
  buildIncomePeriodStats,
  buildMonthOptions,
  buildWeekOptions,
  filterOrdersBySelection,
  toDayKey,
  toMonthKey,
  toWeekKey,
  type IncomePeriod,
} from '@/components/income/income-period';
import {
  BrandLoader,
  PullRefreshFlatList,
  usePageRefresh,
  useRefreshState,
} from '@/components/loading/PageRefresh';
import { useAuth } from '@/providers/AuthProvider';
import { fetchDeliveredHistory } from '@/services/delivery-orders';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

function defaultKeys(now = new Date()) {
  return {
    dayKey: toDayKey(now),
    weekKey: toWeekKey(now),
    monthKey: toMonthKey(now),
  };
}

export default function IncomeScreen() {
  const router = useRouter();
  const { token, delivery, isLoading } = useAuth();
  const [period, setPeriod] = useState<IncomePeriod>('day');
  const [pickerPeriod, setPickerPeriod] = useState<IncomePeriod | null>(null);
  const [keys, setKeys] = useState(defaultKeys);
  const [orders, setOrders] = useState<DeliveryAcceptedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !delivery) router.replace('/auth');
  }, [delivery, isLoading, router]);

  const loadIncome = useCallback(async () => {
    if (!token) return;
    const data = await fetchDeliveredHistory(token);
    setOrders(data.orders || []);
  }, [token]);

  const { refreshing, onRefresh } = useRefreshState(async () => {
    try {
      await loadIncome();
    } catch {
      setOrders([]);
    }
  });

  usePageRefresh(onRefresh);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!token) return;
        setLoading(true);
        try {
          const data = await fetchDeliveredHistory(token);
          if (!cancelled) setOrders(data.orders || []);
        } catch {
          if (!cancelled) setOrders([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [token]),
  );

  const selectedKey =
    period === 'day'
      ? keys.dayKey
      : period === 'week'
        ? keys.weekKey
        : keys.monthKey;

  const pickerOptions = useMemo(() => {
    if (pickerPeriod === 'day') return buildDayOptions(orders);
    if (pickerPeriod === 'week') return buildWeekOptions(orders);
    if (pickerPeriod === 'month') return buildMonthOptions(orders);
    return [];
  }, [orders, pickerPeriod]);

  const stats = useMemo(
    () => buildIncomePeriodStats(orders, keys),
    [orders, keys],
  );

  const filteredOrders = useMemo(
    () => filterOrdersBySelection(orders, period, selectedKey),
    [orders, period, selectedKey],
  );

  const openPicker = (nextPeriod: IncomePeriod) => {
    setPeriod(nextPeriod);
    setPickerPeriod(nextPeriod);
  };

  const handleSelectOption = (key: string) => {
    if (!pickerPeriod) return;
    setPeriod(pickerPeriod);
    setKeys((prev) => {
      if (pickerPeriod === 'day') return { ...prev, dayKey: key };
      if (pickerPeriod === 'week') return { ...prev, weekKey: key };
      return { ...prev, monthKey: key };
    });
    setPickerPeriod(null);
  };

  if (isLoading || !delivery) {
    return (
      <SafeAreaView style={styles.safeLoading}>
        <BrandLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Daromad</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <PullRefreshFlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <IncomePeriodFilter value={period} onChange={openPicker} />
              <IncomeSummaryCards
                period={period}
                dayIncome={stats.dayIncome}
                weekIncome={stats.weekIncome}
                monthIncome={stats.monthIncome}
                onSelectPeriod={openPicker}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Daromad topilmadi</Text>
              <Text style={styles.emptyText}>
                Tanlangan davrda to‘lovli topshirilgan buyurtma yo‘q.
              </Text>
            </View>
          }
          renderItem={({ item }) => <IncomeOrderCard order={item} />}
        />
      </View>

      <IncomePeriodPickerSheet
        visible={pickerPeriod != null}
        period={pickerPeriod}
        options={pickerOptions}
        selectedKey={
          pickerPeriod === 'day'
            ? keys.dayKey
            : pickerPeriod === 'week'
              ? keys.weekKey
              : keys.monthKey
        }
        onClose={() => setPickerPeriod(null)}
        onSelect={handleSelectOption}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#6d32c5',
  },
  safeLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  headerSpacer: {
    width: 40,
  },
  body: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  headerBlock: {
    gap: 12,
    marginBottom: 4,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
