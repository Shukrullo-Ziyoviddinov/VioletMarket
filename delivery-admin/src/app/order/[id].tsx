import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeliveredSuccessModal } from '@/components/home/DeliveredSuccessModal';
import { useAuth } from '@/providers/AuthProvider';
import {
  deliverDeliveryOrder,
  fetchAcceptedDeliveryOrder,
} from '@/services/delivery-orders';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

function formatAmount(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

function productTitle(order: DeliveryAcceptedOrder) {
  return (
    String(order.title?.uz || '').trim() ||
    String(order.title?.ru || '').trim() ||
    order.barcode ||
    order.productCode ||
    'Mahsulot'
  );
}

function customerName(order: DeliveryAcceptedOrder) {
  const name = [order.customer?.firstName, order.customer?.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  return name || 'Mijoz';
}

function addressText(order: DeliveryAcceptedOrder) {
  const address = order.deliveryAddress;
  return (
    address?.addressLine ||
    [address?.city, address?.district].filter(Boolean).join(', ') ||
    'Manzil ko‘rsatilmagan'
  );
}

function openRoute(order: DeliveryAcceptedOrder) {
  const coords = order.deliveryAddress?.coords;
  if (Array.isArray(coords) && coords.length >= 2) {
    const [lng, lat] = coords;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      );
      return;
    }
  }
  const query = encodeURIComponent(addressText(order));
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}`);
}

function callCustomer(phone: string) {
  const cleaned = String(phone || '').replace(/[^\d+]/g, '');
  if (!cleaned) {
    Alert.alert('Telefon', 'Mijoz telefon raqami topilmadi');
    return;
  }
  Linking.openURL(`tel:${cleaned}`);
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const assignmentId = String(id || '').trim();
  const { token, delivery, isLoading } = useAuth();

  const [order, setOrder] = useState<DeliveryAcceptedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [delivering, setDelivering] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [deliveredSnapshot, setDeliveredSnapshot] =
    useState<DeliveryAcceptedOrder | null>(null);

  const load = useCallback(async () => {
    if (!token || !assignmentId) return;
    setLoading(true);
    try {
      const data = await fetchAcceptedDeliveryOrder(token, assignmentId);
      setOrder(data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, token]);

  useEffect(() => {
    if (!isLoading && !delivery) router.replace('/auth');
  }, [delivery, isLoading, router]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const amount = Math.max(0, Number(order?.amount) || 0);
    const deliveryFee = Math.max(0, Number(order?.deliveryFee) || 0);
    return {
      amount,
      deliveryFee,
      total: amount + deliveryFee,
    };
  }, [order]);

  const handleDeliver = async () => {
    if (!token || !order || delivering) return;
    setDelivering(true);
    try {
      const data = await deliverDeliveryOrder(token, {
        assignmentId: order.id,
      });
      setDeliveredSnapshot(data);
      setSuccessOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Topshirish amalga oshmadi';
      Alert.alert('Xatolik', message);
    } finally {
      setDelivering(false);
    }
  };

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
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>
          Buyurtma #{order?.orderId || '—'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#6D28D9" />
          </View>
        ) : !order ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Buyurtma topilmadi</Text>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}>
              <View style={styles.statusWrap}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {order.status === 'delivered'
                      ? 'Topshirildi'
                      : 'Qabul qilindi'}
                  </Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Mijoz ma'lumotlari</Text>
                <View style={styles.customerRow}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customerName(order)}</Text>
                    <Text style={styles.customerPhone}>
                      {order.customer?.phone || 'Telefon yo‘q'}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.iconButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => callCustomer(order.customer?.phone || '')}>
                    <Ionicons name="call" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Manzil</Text>
                <View style={styles.addressRow}>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressText}>{addressText(order)}</Text>
                    {order.deliveryAddress?.courierNote ? (
                      <Text style={styles.landmark}>
                        Mo'ljal: {order.deliveryAddress.courierNote}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.iconButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => openRoute(order)}>
                    <Ionicons name="location" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Mahsulotlar</Text>
                <View style={styles.productRow}>
                  <Text style={styles.productName} numberOfLines={2}>
                    1. {productTitle(order)}
                  </Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.productQty}>
                      {order.productCount} dona
                    </Text>
                    <Text style={styles.productPrice}>
                      {formatAmount(totals.amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.totals}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Buyurtma summasi</Text>
                    <Text style={styles.totalValue}>
                      {formatAmount(totals.amount)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Yetkazish narxi</Text>
                    <Text style={styles.totalValue}>
                      {formatAmount(totals.deliveryFee)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabelBold}>Jami</Text>
                    <Text style={styles.totalValueGreen}>
                      {formatAmount(totals.total)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {order.status !== 'delivered' ? (
              <View style={styles.footer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.footerButton,
                    styles.routeFooter,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => openRoute(order)}>
                  <Text style={styles.routeFooterText}>Mashrut</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.footerButton,
                    styles.ajdaniyaFooter,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    // Keyingi qadam: Ajdaniya
                  }}>
                  <Text style={styles.ajdaniyaText}>Ajdaniya</Text>
                </Pressable>
                <Pressable
                  disabled={delivering}
                  style={({ pressed }) => [
                    styles.footerButton,
                    styles.deliverFooter,
                    pressed && styles.pressed,
                    delivering && styles.disabled,
                  ]}
                  onPress={handleDeliver}>
                  <Text style={styles.deliverText}>
                    {delivering ? '...' : 'Topshirdim'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </View>

      <DeliveredSuccessModal
        visible={successOpen}
        orderId={deliveredSnapshot?.orderId || order?.orderId || 0}
        totalAmount={
          Math.max(0, Number(deliveredSnapshot?.amount) || 0) +
          Math.max(0, Number(deliveredSnapshot?.deliveryFee) || 0)
        }
        deliveredAt={deliveredSnapshot?.deliveredAt || null}
        onContinue={() => {
          setSuccessOpen(false);
          router.replace('/home');
        }}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
  },
  statusWrap: {
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerInfo: {
    flex: 1,
    gap: 4,
  },
  customerName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  customerPhone: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6D28D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressInfo: {
    flex: 1,
    gap: 6,
  },
  addressText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  landmark: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  productName: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  productMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  productQty: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  productPrice: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  totals: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 10,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  totalLabelBold: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  totalValueGreen: {
    color: '#16A34A',
    fontSize: 16,
    fontWeight: '900',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  routeFooter: {
    borderWidth: 1.5,
    borderColor: '#6D28D9',
    backgroundColor: '#FFFFFF',
  },
  routeFooterText: {
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '800',
  },
  ajdaniyaFooter: {
    backgroundColor: '#6D28D9',
  },
  ajdaniyaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  deliverFooter: {
    backgroundColor: '#16A34A',
  },
  deliverText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.9,
  },
});
