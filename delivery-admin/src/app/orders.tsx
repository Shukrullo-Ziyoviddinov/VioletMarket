import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlobalBottomSheet } from '@/components/GlobalBottomSheet';
import {
  BrandLoader,
  PullRefreshFlatList,
  usePageRefresh,
  useRefreshState,
} from '@/components/loading/PageRefresh';
import { BottomNavbar } from '@/components/navigation/BottomNavbar';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrdersFilterBar } from '@/components/orders/OrdersFilterBar';
import { useAuth } from '@/providers/AuthProvider';
import {
  canonicalizeDeliveryRegion,
  FALLBACK_DELIVERY_REGIONS,
} from '@/constants/deliveryRegions';
import { ApiError } from '@/services/api';
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
  type DeliveryAvailableOrder,
} from '@/types/delivery-order';
type FilterSheet = 'district' | 'distance' | null;

const REGION_REQUIRED_MESSAGE =
  'Buyurtmalar tanlash uchun mos region tanlang';

export default function OrdersScreen() {
  const router = useRouter();
  const { token, delivery, isLoading } = useAuth();
  const [allOrders, setAllOrders] = useState<DeliveryAvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [district, setDistrict] = useState<string>('Barchasi');
  const [maxDistanceKm, setMaxDistanceKm] = useState(0);
  const [filterSheet, setFilterSheet] = useState<FilterSheet>(null);
  const [courierCoords, setCourierCoords] = useState<CourierCoords | null>(
    null,
  );
  const [locationDenied, setLocationDenied] = useState(false);
  const [regionRequired, setRegionRequired] = useState(false);
  const askedLocationRef = useRef(false);
  const courierCoordsRef = useRef<CourierCoords | null>(null);
  const loadSeqRef = useRef(0);
  const locationInFlightRef = useRef<Promise<CourierCoords | null> | null>(
    null,
  );

  courierCoordsRef.current = courierCoords;

  const selectedRegion = useMemo(() => {
    return (
      canonicalizeDeliveryRegion(
        delivery?.region,
        FALLBACK_DELIVERY_REGIONS,
      ) || null
    );
  }, [delivery?.region]);

  const hasRegion = Boolean(selectedRegion) && !regionRequired;

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

  const ensureCourierLocation = useCallback(async (forceAsk = false) => {
    if (courierCoordsRef.current && !forceAsk) {
      return courierCoordsRef.current;
    }

    if (locationInFlightRef.current) {
      return locationInFlightRef.current;
    }

    const request = (async () => {
      const result = await requestCourierLocation({
        preferFresh: forceAsk,
      });
      if (result.coords) {
        courierCoordsRef.current = result.coords;
        setCourierCoords(result.coords);
        setLocationDenied(false);
        return result.coords;
      }

      setLocationDenied(Boolean(result.denied));
      if (result.denied) {
        courierCoordsRef.current = null;
        setCourierCoords(null);
      }
      if (result.errorMessage) {
        Alert.alert('Joylashuv', result.errorMessage);
      }
      // Force refresh failed: keep last known coords if still available.
      return forceAsk ? courierCoordsRef.current : null;
    })();

    locationInFlightRef.current = request;
    try {
      return await request;
    } finally {
      if (locationInFlightRef.current === request) {
        locationInFlightRef.current = null;
      }
    }
  }, []);

  const loadOrders = useCallback(
    async (
      coords: CourierCoords | null = null,
      options?: { seq?: number },
    ) => {
      if (!token) return;
      if (!selectedRegion) {
        setAllOrders([]);
        setRegionRequired(true);
        return;
      }

      const seq = options?.seq ?? ++loadSeqRef.current;
      try {
        const data = await fetchAvailableDeliveryOrders(token, {
          courierLat: coords?.latitude,
          courierLng: coords?.longitude,
        });
        if (seq !== loadSeqRef.current) return;
        setRegionRequired(false);
        setAllOrders(data.orders || []);
      } catch (error) {
        if (seq !== loadSeqRef.current) return;
        if (
          error instanceof ApiError &&
          error.code === 'DELIVERY_REGION_REQUIRED'
        ) {
          setRegionRequired(true);
          setAllOrders([]);
          return;
        }
        // Soft failure: keep previous list, show message.
        const message =
          error instanceof Error
            ? error.message
            : 'Buyurtmalarni yuklab bo‘lmadi';
        Alert.alert('Xatolik', message);
      }
    },
    [token, selectedRegion],
  );

  const { refreshing, onRefresh } = useRefreshState(async () => {
    if (!selectedRegion) {
      setAllOrders([]);
      setRegionRequired(true);
      return;
    }
    const coords = await ensureCourierLocation(false);
    await loadOrders(coords);
  });

  usePageRefresh(onRefresh);

  useFocusEffect(
    useCallback(() => {
      const seqAtStart = ++loadSeqRef.current;

      async function boot() {
        setLoading(true);
        try {
          if (!selectedRegion) {
            if (seqAtStart === loadSeqRef.current) {
              setAllOrders([]);
              setRegionRequired(true);
              setLoading(false);
            }
            return;
          }

          let coords = courierCoordsRef.current;
          if (!askedLocationRef.current) {
            coords = await ensureCourierLocation(true);
            askedLocationRef.current = true;
          } else if (!coords) {
            coords = await ensureCourierLocation(false);
          }

          if (seqAtStart !== loadSeqRef.current) return;
          await loadOrders(coords, { seq: seqAtStart });
        } catch (error) {
          if (seqAtStart !== loadSeqRef.current) return;
          if (
            error instanceof ApiError &&
            error.code === 'DELIVERY_REGION_REQUIRED'
          ) {
            setRegionRequired(true);
            setAllOrders([]);
          } else {
            const message =
              error instanceof Error
                ? error.message
                : 'Buyurtmalarni yuklab bo‘lmadi';
            Alert.alert('Xatolik', message);
          }
        } finally {
          if (seqAtStart === loadSeqRef.current) setLoading(false);
        }
      }

      void boot();

      return () => {
        loadSeqRef.current += 1;
      };
    }, [token, selectedRegion, ensureCourierLocation, loadOrders]),
  );

  useEffect(() => {
    setDistrict('Barchasi');
    setMaxDistanceKm(0);
    setRegionRequired(false);
  }, [selectedRegion]);

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
    if (!hasRegion) {
      Alert.alert('Region', REGION_REQUIRED_MESSAGE);
      return;
    }
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
    if (!hasRegion) {
      Alert.alert('Region', REGION_REQUIRED_MESSAGE);
      return;
    }
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
    if (!hasRegion) {
      Alert.alert('Region', REGION_REQUIRED_MESSAGE);
      return;
    }
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
        <BrandLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buyurtmalar</Text>
      </View>

      <View style={styles.body}>
        {!hasRegion ? (
          <Pressable
            style={styles.regionBanner}
            onPress={() => router.push('/profile')}>
            <Text style={styles.regionBannerTitle}>Region tanlanmagan</Text>
            <Text style={styles.regionBannerText}>
              {REGION_REQUIRED_MESSAGE}
            </Text>
          </Pressable>
        ) : null}

        <OrdersFilterBar
          districtLabel={district === 'Barchasi' ? 'Tuman' : district}
          distanceLabel={maxDistanceKm > 0 ? distanceLabel : 'Masofa'}
          onDistrictPress={openDistrictFilter}
          onDistancePress={openDistanceFilter}
          total={total}
        />

        {locationDenied && hasRegion ? (
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

        <PullRefreshFlatList
          data={hasRegion ? orders : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          loading={loading && hasRegion}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {hasRegion ? 'Buyurtma yo‘q' : 'Region tanlang'}
              </Text>
              <Text style={styles.emptyText}>
                {hasRegion
                  ? 'Seller kuryerga topshirgan mahsulotlar shu yerda chiqadi.'
                  : REGION_REQUIRED_MESSAGE}
              </Text>
              {!hasRegion ? (
                <Pressable
                  style={styles.regionCta}
                  onPress={() => router.push('/profile')}>
                  <Text style={styles.regionCtaText}>Profilga o‘tish</Text>
                </Pressable>
              ) : null}
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
      </View>

      <BottomNavbar />

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
  regionBanner: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  regionBannerTitle: {
    color: '#5B21B6',
    fontSize: 14,
    fontWeight: '800',
  },
  regionBannerText: {
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  regionCta: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#6d32c5',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
    color: '#6d32c5',
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
