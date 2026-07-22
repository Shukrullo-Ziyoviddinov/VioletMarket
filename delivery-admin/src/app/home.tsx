import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AcceptedOrderCard } from '@/components/home/AcceptedOrderCard';
import {
  BrandLoader,
  PullRefreshFlatList,
  usePageRefresh,
  useRefreshState,
} from '@/components/loading/PageRefresh';
import { BottomNavbar } from '@/components/navigation/BottomNavbar';
import { useAuth } from '@/providers/AuthProvider';
import { fetchAcceptedDeliveryOrders } from '@/services/delivery-orders';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';
import { isReturnPhase, isSellerPhase } from '@/utils/deliveryOrderSteps';

type HomeListRow =
  | { type: 'section'; key: string; title: string; count: number }
  | { type: 'order'; key: string; order: DeliveryAcceptedOrder };

export default function HomeScreen() {
  const router = useRouter();
  const { token, delivery, isLoading } = useAuth();
  const [orders, setOrders] = useState<DeliveryAcceptedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !delivery) router.replace('/auth');
  }, [delivery, isLoading, router]);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    const data = await fetchAcceptedDeliveryOrders(token);
    setOrders(data.orders || []);
  }, [token]);

  const { refreshing, onRefresh } = useRefreshState(async () => {
    try {
      await fetchOrders();
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
          const data = await fetchAcceptedDeliveryOrders(token);
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

  const pickupOrders = useMemo(
    () =>
      orders.filter(
        (order) => isSellerPhase(order) && !isReturnPhase(order),
      ),
    [orders],
  );
  const deliverOrders = useMemo(
    () =>
      orders.filter(
        (order) => !isSellerPhase(order) && !isReturnPhase(order),
      ),
    [orders],
  );
  const returnOrders = useMemo(
    () => orders.filter((order) => isReturnPhase(order)),
    [orders],
  );

  const listRows = useMemo(() => {
    const rows: HomeListRow[] = [];
    if (pickupOrders.length) {
      rows.push({
        type: 'section',
        key: 'section-pickup',
        title: 'Sotuvchidan olish',
        count: pickupOrders.length,
      });
      pickupOrders.forEach((order) => {
        rows.push({ type: 'order', key: order.id, order });
      });
    }
    if (deliverOrders.length) {
      rows.push({
        type: 'section',
        key: 'section-deliver',
        title: 'Mijozga yetkazish',
        count: deliverOrders.length,
      });
      deliverOrders.forEach((order) => {
        rows.push({ type: 'order', key: order.id, order });
      });
    }
    if (returnOrders.length) {
      rows.push({
        type: 'section',
        key: 'section-return',
        title: 'Sotuvchiga qaytarish',
        count: returnOrders.length,
      });
      returnOrders.forEach((order) => {
        rows.push({ type: 'order', key: order.id, order });
      });
    }
    return rows;
  }, [deliverOrders, pickupOrders, returnOrders]);

  const openWorkDesk = useCallback(
    (order: DeliveryAcceptedOrder) => {
      router.push({
        pathname: '/order-details',
        params: { id: order.id },
      });
    },
    [router],
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
        <Text style={styles.headerTitle}>Qabul qilingan buyurtmalar</Text>
        {orders.length > 0 ? (
          <Text style={styles.headerSub}>
            Olish: {pickupOrders.length} · Yetkazish: {deliverOrders.length}
            {returnOrders.length
              ? ` · Qaytarish: ${returnOrders.length}`
              : ''}
          </Text>
        ) : null}
      </View>

      <View style={styles.body}>
        <PullRefreshFlatList
          data={listRows}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[
            styles.listContent,
            listRows.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="file-tray-outline" size={42} color="#6d32c5" />
              </View>
              <Text style={styles.emptyTitle}>Hali qabul qilinmagan</Text>
              <Text style={styles.emptyText}>
                Buyurtmalar sahifasidan “Qabul qilish” bosilgan mahsulotlar shu
                yerda chiqadi. Ishlash uchun buyurtmani tanlang.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'section') {
              return (
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                  <View style={styles.sectionCount}>
                    <Text style={styles.sectionCountText}>{item.count}</Text>
                  </View>
                </View>
              );
            }
            return (
              <AcceptedOrderCard
                order={item.order}
                onStartWork={openWorkDesk}
              />
            );
          }}
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
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
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
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 2,
  },
  sectionTitle: {
    color: '#312E81',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionCount: {
    minWidth: 28,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sectionCountText: {
    color: '#6d32c5',
    fontSize: 12,
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#312E81',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
});
