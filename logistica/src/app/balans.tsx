import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalanceAmountCards } from '@/components/balans/BalanceAmountCards';
import { BalancePaymentCard } from '@/components/balans/BalancePaymentCard';
import { BalanceStatusCards } from '@/components/balans/BalanceStatusCards';
import {
  TarixBalanceModeFilter,
  type TarixBalanceMode,
} from '@/components/tarix/TarixBalanceModeFilter';
import { TarixBalancePeriodDropdown } from '@/components/tarix/TarixBalancePeriodDropdown';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import {
  fetchCargoHistory,
  fetchCargoHistoryBalance,
  type CargoHistoryBalanceResponse,
  type CargoHistoryPeriodParams,
} from '@/services/logistica-shipments';

const PAGE_SIZE = 30;

type PaymentItem = {
  id: string;
  requestCode: string;
  productCode: string;
  productTitle: string;
  storeName: string;
  orderId: number;
  amount: number;
  at: string | null;
};

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function currentWeekStartKey() {
  const now = new Date();
  const day = now.getDay();
  const offset = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - offset);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(monday.getDate()).padStart(2, '0')}`;
}

function selectedPeriodParams(
  mode: TarixBalanceMode,
  monthKey: string,
  weekKey: string,
): CargoHistoryPeriodParams {
  if (mode === 'week') {
    return { mode: 'week', weekStart: weekKey, kind: 'handed_over' };
  }
  const [year, month] = monthKey.split('-').map(Number);
  return { mode: 'month', year, month, kind: 'handed_over' };
}

function mergeUnique(prev: PaymentItem[], next: PaymentItem[]) {
  const map = new Map<string, PaymentItem>();
  for (const item of prev) map.set(item.id, item);
  for (const item of next) map.set(item.id, item);
  return [...map.values()];
}

export default function BalansScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [mode, setMode] = useState<TarixBalanceMode>('month');
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [weekKey, setWeekKey] = useState(currentWeekStartKey);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [monthData, setMonthData] =
    useState<CargoHistoryBalanceResponse | null>(null);
  const [weekData, setWeekData] =
    useState<CargoHistoryBalanceResponse | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [counts, setCounts] = useState({ handedOver: 0, returned: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (refresh = false) => {
      if (!token) {
        setLoading(false);
        setError('Avtorizatsiya talab qilinadi');
        return;
      }

      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const [year, month] = monthKey.split('-').map(Number);
        const period = selectedPeriodParams(mode, monthKey, weekKey);
        const [nextMonth, nextWeek, history] = await Promise.all([
          fetchCargoHistoryBalance(token, { mode: 'month', year, month }),
          fetchCargoHistoryBalance(token, {
            mode: 'week',
            weekStart: weekKey,
          }),
          fetchCargoHistory(token, 1, PAGE_SIZE, period),
        ]);

        setMonthData(nextMonth);
        setWeekData(nextWeek);
        setPayments(history.items as PaymentItem[]);
        setPaymentsTotal(history.total);
        setCounts(history.counts);
        setPage(history.page);
        setTotalPages(history.totalPages);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'Balansni yuklab bo‘lmadi',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mode, monthKey, token, weekKey],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const monthOptions = useMemo(
    () =>
      (monthData?.months || []).map((item) => ({
        key: item.key,
        label: item.label,
      })),
    [monthData?.months],
  );

  const weekOptions = useMemo(
    () =>
      (weekData?.weeks || []).map((item) => ({
        key: item.key,
        label: item.label,
      })),
    [weekData?.weeks],
  );

  const activePeriodLabel =
    mode === 'month' ? monthData?.periodLabel : weekData?.periodLabel;

  const handleModeChange = (next: TarixBalanceMode) => {
    if (next === mode) {
      setDropdownOpen((prev) => !prev);
      return;
    }
    setMode(next);
    setDropdownOpen(true);
  };

  const loadMore = async () => {
    if (!token || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const period = selectedPeriodParams(mode, monthKey, weekKey);
      const history = await fetchCargoHistory(
        token,
        nextPage,
        PAGE_SIZE,
        period,
      );
      setPayments((prev) =>
        mergeUnique(prev, history.items as PaymentItem[]),
      );
      setPaymentsTotal(history.total);
      setPage(history.page);
      setTotalPages(history.totalPages);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Yana yuklab bo‘lmadi',
      );
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="arrow-back" size={22} color="#4C1D95" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Balans</Text>
          <Text style={styles.headerSubtitle}>To‘langan cargo mablag‘lari</Text>
        </View>
      </View>

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor="#7C3AED"
          />
        }
      >
        <BalanceAmountCards
          weekBalance={weekData?.balance || 0}
          monthBalance={monthData?.balance || 0}
          weekLabel={weekData?.periodLabel || ''}
          monthLabel={monthData?.periodLabel || ''}
          loading={loading}
        />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Jarayonlar</Text>
          <Text style={styles.sectionPeriod}>{activePeriodLabel || ''}</Text>
        </View>
        <BalanceStatusCards
          returnedCount={counts.returned}
          handedOverCount={counts.handedOver}
        />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>To‘langan buyurtmalar</Text>
          <Text style={styles.sectionPeriod}>{paymentsTotal} ta</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#7C3AED" size="large" />
          </View>
        ) : error && payments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => void load()}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryText}>Qayta urinish</Text>
            </Pressable>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color="#C4B5FD" />
            <Text style={styles.emptyTitle}>To‘lovlar topilmadi</Text>
            <Text style={styles.emptyText}>
              Tanlangan davrda topshirilgan buyurtma yo‘q.
            </Text>
          </View>
        ) : (
          <>
            {error ? <Text style={styles.inlineError}>{error}</Text> : null}
            {payments.map((item) => (
              <BalancePaymentCard key={item.id} {...item} />
            ))}
            {page < totalPages ? (
              <Pressable
                disabled={loadingMore}
                onPress={() => void loadMore()}
                style={({ pressed }) => [
                  styles.moreButton,
                  pressed && !loadingMore && styles.pressed,
                ]}
              >
                {loadingMore ? (
                  <ActivityIndicator color="#7C3AED" />
                ) : (
                  <Text style={styles.moreText}>Yana ko‘rsatish</Text>
                )}
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: '#312E81',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: 2,
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '600',
  },
  filterArea: {
    position: 'relative',
    zIndex: 30,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F8FAFC',
  },
  dropdownRow: {
    position: 'absolute',
    top: 62,
    left: 16,
    right: 16,
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 12,
  },
  sectionHead: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '900',
  },
  sectionPeriod: {
    flexShrink: 1,
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  centered: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    color: '#312E81',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
  },
  inlineError: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  retryButton: {
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  moreButton: {
    minHeight: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
  },
  moreText: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
