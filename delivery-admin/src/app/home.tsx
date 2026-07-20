import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
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
import { openYandexRoute } from '@/services/open-yandex-route';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

async function handleBuildRoute(order: DeliveryAcceptedOrder) {
  const address = order.deliveryAddress || {};
  const opened = await openYandexRoute({
    coords: address.coords,
    addressLine: address.addressLine,
    city: address.city,
    district: address.district,
  });
  if (!opened) {
    Alert.alert('Mashrut', 'Manzil topilmadi yoki xarita ochilmadi');
  }
}

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
      </View>

      <View style={styles.body}>
        <PullRefreshFlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            orders.length === 0 && styles.listContentEmpty,
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
                yerda chiqadi.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AcceptedOrderCard
              order={item}
              onBuildRoute={() => {
                void handleBuildRoute(item);
              }}
              onOpenDetails={() =>
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
    textAlign: 'center',
    paddingHorizontal: 12,
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
