import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BrandLoader,
  PullRefreshFlatList,
  usePageRefresh,
  useRefreshState,
} from '@/components/loading/PageRefresh';
import { BottomNavbar } from '@/components/navigation/BottomNavbar';
import { useAuth } from '@/providers/AuthProvider';
import { fetchDeliveredHistory } from '@/services/delivery-orders';
import type {
  DeliveryAcceptedOrder,
  DeliveryHistoryStats,
} from '@/types/delivery-order';

const EMPTY_STATS: DeliveryHistoryStats = {
  totalDelivered: 0,
  todayCount: 0,
  weekCount: 0,
  totalIncome: 0,
};

function formatAmount(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

function formatDateTime(value: string | null) {
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

function customerLabel(order: DeliveryAcceptedOrder) {
  const name = [order.customer?.firstName, order.customer?.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  const phone = String(order.customer?.phone || '').trim();
  if (name && phone) return `${name}, ${phone}`;
  return name || phone || 'Mijoz';
}

function addressLabel(order: DeliveryAcceptedOrder) {
  const address = order.deliveryAddress;
  return (
    address?.addressLine ||
    [address?.city, address?.district].filter(Boolean).join(', ') ||
    'Manzil ko‘rsatilmagan'
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  onPress,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.statHead}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.statTextCol}>
        <Text style={styles.statLabel} numberOfLines={2}>
          {label}
        </Text>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.statCard,
          pressed && styles.pressed,
        ]}
        onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.statCard}>{content}</View>;
}

function HistoryCard({
  order,
  onPress,
}: {
  order: DeliveryAcceptedOrder;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.historyCard, pressed && styles.pressed]}
      onPress={onPress}>
      <View style={styles.historyTop}>
        <View style={styles.historyIdWrap}>
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.historyId}>#{order.orderId}</Text>
            <Text style={styles.historyAccepted}>
              {formatDateTime(order.acceptedAt)}
            </Text>
          </View>
        </View>
        <View style={styles.historyRight}>
          <View style={styles.deliveredBadge}>
            <Text style={styles.deliveredBadgeText}>Topshirilgan</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </View>

      <View style={styles.historyRow}>
        <Ionicons name="location-outline" size={15} color="#6d32c5" />
        <Text style={styles.historyText} numberOfLines={2}>
          {addressLabel(order)}
        </Text>
      </View>
      <View style={styles.historyRow}>
        <Ionicons name="person-outline" size={15} color="#6d32c5" />
        <Text style={styles.historyText} numberOfLines={1}>
          {customerLabel(order)}
        </Text>
      </View>
      <View style={styles.historyMeta}>
        <View style={styles.historyRow}>
          <Ionicons name="cube-outline" size={15} color="#6B7280" />
          <Text style={styles.metaText}>{order.productCount} ta mahsulot</Text>
        </View>
        <View style={styles.historyRow}>
          <Ionicons name="cash-outline" size={15} color="#6B7280" />
          <Text style={styles.metaText}>
            {formatAmount(order.courierPayment ?? 0)}
          </Text>
        </View>
      </View>
      <View style={styles.historyRow}>
        <Ionicons name="time-outline" size={15} color="#6B7280" />
        <Text style={styles.metaText}>
          Topshirilgan: {formatDateTime(order.deliveredAt)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { token, delivery, isLoading } = useAuth();
  const [orders, setOrders] = useState<DeliveryAcceptedOrder[]>([]);
  const [stats, setStats] = useState<DeliveryHistoryStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !delivery) router.replace('/auth');
  }, [delivery, isLoading, router]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    const data = await fetchDeliveredHistory(token);
    setOrders(data.orders || []);
    setStats(data.stats || EMPTY_STATS);
  }, [token]);

  const { refreshing, onRefresh } = useRefreshState(async () => {
    try {
      await fetchHistory();
    } catch {
      setOrders([]);
      setStats(EMPTY_STATS);
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
          if (!cancelled) {
            setOrders(data.orders || []);
            setStats(data.stats || EMPTY_STATS);
          }
        } catch {
          if (!cancelled) {
            setOrders([]);
            setStats(EMPTY_STATS);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [token]),
  );

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
        <Text style={styles.headerTitle}>Tarix</Text>
      </View>

      <View style={styles.body}>
        <PullRefreshFlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={
            <View style={styles.statsGrid}>
              <StatCard
                label="Jami topshirilgan"
                value={`${stats.totalDelivered} ta`}
                icon="cube-outline"
                color="#6d32c5"
              />
              <StatCard
                label="Bugun"
                value={`${stats.todayCount} ta`}
                icon="calendar-outline"
                color="#16A34A"
              />
              <StatCard
                label="Bu hafta"
                value={`${stats.weekCount} ta`}
                icon="calendar-outline"
                color="#2563EB"
              />
              <StatCard
                label="Jami daromad"
                value={formatAmount(stats.totalIncome)}
                icon="wallet-outline"
                color="#EA580C"
                onPress={() => router.push('/income')}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Hali topshirilgan yo‘q</Text>
              <Text style={styles.emptyText}>
                “Topshirdim” bosilgan buyurtmalar shu yerda chiqadi.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <HistoryCard
              order={item}
              onPress={() =>
                router.push({
                  pathname: '/order-details',
                  params: { id: item.id },
                })
              }
            />
          )}
        />
      </View>

      <BottomNavbar />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
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
    paddingBottom: 20,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
  },
  statHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  statValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  historyIdWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyId: {
    color: '#6d32c5',
    fontSize: 16,
    fontWeight: '900',
  },
  historyAccepted: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveredBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deliveredBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '800',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  historyText: {
    flex: 1,
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  historyMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  metaText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    paddingTop: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#312E81',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.92,
  },
});
