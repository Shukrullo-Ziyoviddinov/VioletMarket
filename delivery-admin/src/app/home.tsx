import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AcceptedOrderCard } from '@/components/home/AcceptedOrderCard';
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

  const loadAccepted = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAcceptedDeliveryOrders(token);
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadAccepted();
    }, [loadAccepted]),
  );

  if (isLoading || !delivery) {
    return (
      <SafeAreaView style={styles.safeLoading}>
        <ActivityIndicator color="#6D28D9" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Qabul qilingan buyurtmalar</Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#6D28D9" />
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Hali qabul qilinmagan</Text>
                <Text style={styles.emptyText}>
                  Buyurtmalar sahifasidan “Qabul qilish” bosilgan mahsulotlar
                  shu yerda chiqadi.
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
        )}
      </View>

      <BottomNavbar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#6D28D9',
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingTop: 64,
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
});
