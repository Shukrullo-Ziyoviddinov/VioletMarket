import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlobalBottomSheet } from '@/components/GlobalBottomSheet';
import { BottomNavbar } from '@/components/navigation/BottomNavbar';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrdersFilterBar } from '@/components/orders/OrdersFilterBar';
import { useAuth } from '@/providers/AuthProvider';
import {
  requestCourierLocation,
  type CourierCoords,
} from '@/services/courier-location';
import {
  acceptDeliveryOrder,
  fetchAvailableDeliveryOrders,
} from '@/services/delivery-orders';
import {
  DISTANCE_FILTERS,
  TASHKENT_CITY,
  type DeliveryAvailableOrder,
} from '@/types/delivery-order';

type FilterSheet = 'city' | 'district' | 'distance' | null;

export default function OrdersScreen() {
  const router = useRouter();
  const { token, delivery, isLoading } = useAuth();
  const [allOrders, setAllOrders] = useState<DeliveryAvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [city, setCity] = useState(TASHKENT_CITY);
  const [district, setDistrict] = useState<string>('Barchasi');
  const [maxDistanceKm, setMaxDistanceKm] = useState(0);
  const [filterSheet, setFilterSheet] = useState<FilterSheet>(null);
  const [courierCoords, setCourierCoords] = useState<CourierCoords | null>(
    null,
  );
  const [locationDenied, setLocationDenied] = useState(false);
  const askedLocationRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !delivery) router.replace('/auth');
  }, [delivery, isLoading, router]);

  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    for (const order of allOrders) {
      const name = String(order.district || '').trim();
      if (!name || name === "Noma’lum tuman" || name === "Noma'lum tuman") {
        continue;
      }
      set.add(name);
    }
    return [
      'Barchasi',
      ...Array.from(set).sort((a, b) => a.localeCompare(b, 'uz')),
    ];
  }, [allOrders]);

  const availableDistanceFilters = useMemo(() => {
    const source =
      district === 'Barchasi'
        ? allOrders
        : allOrders.filter((order) => order.district === district);

    const distances = source
      .map((order) => order.distanceKm)
      .filter(
        (value): value is number => value != null && Number.isFinite(value),
      );

    if (!distances.length) return [];

    return DISTANCE_FILTERS.filter((item) => {
      if (item.value === 0) return true;
      return distances.some((distance) => distance <= item.value);
    });
  }, [allOrders, district]);

  const orders = useMemo(() => {
    let list = allOrders;

    if (district !== 'Barchasi') {
      list = list.filter((order) => order.district === district);
    }

    if (maxDistanceKm > 0) {
      list = list.filter(
        (order) =>
          order.distanceKm != null &&
          Number(order.distanceKm) <= maxDistanceKm,
      );
    }

    return list;
  }, [allOrders, district, maxDistanceKm]);

  const total = orders.length;

  const distanceLabel = useMemo(() => {
    if (!availableDistanceFilters.length) return 'Masofa';
    return (
      availableDistanceFilters.find((item) => item.value === maxDistanceKm)
        ?.label || 'Barchasi'
    );
  }, [availableDistanceFilters, maxDistanceKm]);

  useEffect(() => {
    if (district === 'Barchasi') return;
    if (!availableDistricts.includes(district)) {
      setDistrict('Barchasi');
    }
  }, [availableDistricts, district]);

  useEffect(() => {
    if (maxDistanceKm <= 0) return;
    const stillValid = availableDistanceFilters.some(
      (item) => item.value === maxDistanceKm,
    );
    if (!stillValid) setMaxDistanceKm(0);
  }, [availableDistanceFilters, maxDistanceKm]);

  const ensureCourierLocation = useCallback(
    async (forceAsk = false) => {
      if (courierCoords && !forceAsk) return courierCoords;

      const result = await requestCourierLocation();
      if (result.coords) {
        setCourierCoords(result.coords);
        setLocationDenied(false);
        return result.coords;
      }

      setLocationDenied(Boolean(result.denied));
      if (result.errorMessage) {
        Alert.alert('Joylashuv', result.errorMessage);
      }
      return null;
    },
    [courierCoords],
  );

  const loadOrders = useCallback(
    async (coords?: CourierCoords | null) => {
      if (!token) return;
      setLoading(true);
      try {
        const activeCoords = coords === undefined ? courierCoords : coords;
        const data = await fetchAvailableDeliveryOrders(token, {
          city,
          courierLat: activeCoords?.latitude,
          courierLng: activeCoords?.longitude,
        });
        setAllOrders(data.orders || []);
      } catch {
        setAllOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [token, city, courierCoords],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function boot() {
        let coords = courierCoords;
        if (!askedLocationRef.current) {
          askedLocationRef.current = true;
          coords = await ensureCourierLocation(true);
        }
        if (cancelled) return;
        await loadOrders(coords);
      }

      boot();

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]),
  );

  useEffect(() => {
    if (!token || !askedLocationRef.current) return;
    setDistrict('Barchasi');
    setMaxDistanceKm(0);
    loadOrders();
  }, [city, token]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectDistrict(value: string) {
    setDistrict(value);
    setMaxDistanceKm(0);
    setFilterSheet(null);
  }

  function handleSelectDistance(value: number) {
    setMaxDistanceKm(value);
    setFilterSheet(null);

    if (value > 0 && !courierCoords) {
      void ensureCourierLocation(true).then((coords) => {
        if (coords) void loadOrders(coords);
      });
    }
  }

  function openDistrictFilter() {
    if (availableDistricts.length <= 1) {
      Alert.alert(
        'Tuman',
        'Hozircha tumanli buyurtma yo‘q. Buyurtma chiqqanda tumanlar shu yerda paydo bo‘ladi.',
      );
      return;
    }
    setFilterSheet('district');
  }

  function openDistanceFilter() {
    if (!availableDistanceFilters.length) {
      Alert.alert(
        'Masofa',
        'Hozircha buyurtma yo‘q yoki joylashuv olinmagan. Buyurtma chiqqanda real km filtrlari paydo bo‘ladi.',
      );
      return;
    }
    setFilterSheet('distance');
  }

  async function handleAccept(order: DeliveryAvailableOrder) {
    if (!token || acceptingId) return;
    setAcceptingId(order.id);
    try {
      await acceptDeliveryOrder(token, {
        orderId: order.orderId,
        itemIndex: order.itemIndex,
        unitIndex: order.unitIndex,
      });
      setAllOrders((prev) => prev.filter((item) => item.id !== order.id));
      Alert.alert('Qabul qilindi', 'Buyurtma bosh sahifaga o‘tdi.', [
        {
          text: 'Bosh sahifa',
          onPress: () => router.push('/home'),
        },
        { text: 'OK' },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Qabul qilib bo‘lmadi';
      Alert.alert('Xatolik', message);
    } finally {
      setAcceptingId(null);
    }
  }

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
        <Text style={styles.headerTitle}>Buyurtmalar</Text>
      </View>

      <View style={styles.body}>
        <OrdersFilterBar
          cityLabel={city}
          districtLabel={district === 'Barchasi' ? 'Tuman' : district}
          distanceLabel={maxDistanceKm > 0 ? distanceLabel : 'Masofa'}
          onCityPress={() => setFilterSheet('city')}
          onDistrictPress={openDistrictFilter}
          onDistancePress={openDistanceFilter}
          total={total}
        />

        {locationDenied ? (
          <Pressable
            style={styles.locationBanner}
            onPress={async () => {
              const coords = await ensureCourierLocation(true);
              if (coords) await loadOrders(coords);
            }}>
            <Text style={styles.locationBannerText}>
              GPS ruxsati yo‘q. Masofa filtri uchun joylashuvni yoqing.
            </Text>
          </Pressable>
        ) : null}

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
                <Text style={styles.emptyTitle}>Buyurtma yo‘q</Text>
                <Text style={styles.emptyText}>
                  Seller kuryerga topshirgan mahsulotlar shu yerda chiqadi.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                accepting={acceptingId === item.id}
                onAccept={handleAccept}
              />
            )}
          />
        )}
      </View>

      <BottomNavbar />

      <GlobalBottomSheet
        visible={filterSheet === 'city'}
        title="Shahar"
        onClose={() => setFilterSheet(null)}>
        <Pressable
          style={styles.option}
          onPress={() => {
            setCity(TASHKENT_CITY);
            setFilterSheet(null);
          }}>
          <Text style={styles.optionText}>{TASHKENT_CITY}</Text>
        </Pressable>
      </GlobalBottomSheet>

      <GlobalBottomSheet
        visible={filterSheet === 'district'}
        title="Tuman"
        onClose={() => setFilterSheet(null)}>
        {availableDistricts.map((item) => (
          <Pressable
            key={item}
            style={styles.option}
            onPress={() => handleSelectDistrict(item)}>
            <Text
              style={[
                styles.optionText,
                district === item && styles.optionTextActive,
              ]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </GlobalBottomSheet>

      <GlobalBottomSheet
        visible={filterSheet === 'distance'}
        title="Masofa"
        onClose={() => setFilterSheet(null)}>
        {availableDistanceFilters.length ? (
          availableDistanceFilters.map((item) => (
            <Pressable
              key={item.label}
              style={styles.option}
              onPress={() => handleSelectDistance(item.value)}>
              <Text
                style={[
                  styles.optionText,
                  maxDistanceKm === item.value && styles.optionTextActive,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyFilterText}>
            Hozircha buyurtma yo‘q — km filtri chiqmaydi.
          </Text>
        )}
      </GlobalBottomSheet>
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
    fontSize: 22,
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
  locationBanner: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationBannerText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
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
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#6D28D9',
    fontWeight: '800',
  },
  emptyFilterText: {
    paddingVertical: 18,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
