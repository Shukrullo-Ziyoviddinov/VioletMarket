import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { OrderReturnReasonModal } from '@/components/home/OrderReturnReasonModal';
import { DeliveryStepActions } from '@/components/delivery-steps/DeliveryStepActions';
import { DeliveryStepProgress } from '@/components/delivery-steps/DeliveryStepProgress';
import { OrderPaymentNotice } from '@/components/payment/OrderPaymentNotice';
import { MiniGlobalModal } from '@/components/MiniGlobalModal';
import { useAuth } from '@/providers/AuthProvider';
import {
  advanceDeliveryOrderStep,
  deliverDeliveryOrder,
  fetchAcceptedDeliveryOrder,
  pickUpDeliveryOrder,
  returnDeliveryOrder,
  type ReturnReasonType,
} from '@/services/delivery-orders';
import { requestCourierLocation } from '@/services/courier-location';
import { openYandexRoute } from '@/services/open-yandex-route';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';
import {
  getPrimaryAction,
  isSellerPhase,
  shouldOpenRouteOnAdvance,
  type DeliveryAdvanceAction,
} from '@/utils/deliveryOrderSteps';

function productTitle(order: DeliveryAcceptedOrder) {
  return (
    String(order.title?.uz || '').trim() ||
    String(order.title?.ru || '').trim() ||
    order.barcode ||
    order.productCode ||
    'Mahsulot'
  );
}

function orderBarcode(order: DeliveryAcceptedOrder | null) {
  if (!order) return '—';
  return String(order.barcode || order.productCode || '').trim() || '—';
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

function sellerAddressText(order: DeliveryAcceptedOrder) {
  const seller = order.sellerPickup;
  return (
    String(seller?.address || '').trim() ||
    String(seller?.name || '').trim() ||
    'Sotuvchi manzili ko‘rsatilmagan'
  );
}

async function openRoute(order: DeliveryAcceptedOrder) {
  if (isSellerPhase(order)) {
    const seller = order.sellerPickup;
    const opened = await openYandexRoute({
      coords: seller?.coordinates || null,
      addressLine: seller?.address || '',
    });
    if (!opened) {
      Alert.alert('Mashrut', 'Sotuvchi manzili topilmadi yoki xarita ochilmadi');
    }
    return;
  }

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

function callCustomer(phone: string) {
  const cleaned = String(phone || '').replace(/[^\d+]/g, '');
  if (!cleaned) {
    Alert.alert('Telefon', 'Mijoz telefon raqami topilmadi');
    return;
  }
  Linking.openURL(`tel:${cleaned}`);
}

function DetailCell({ label, value }: { label: string; value?: string }) {
  const text = String(value || '').trim() || '—';
  return (
    <View style={styles.detailCell}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function displayOrDash(value?: string) {
  return String(value || '').trim() || '—';
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const assignmentId = String(
    Array.isArray(rawId) ? rawId[0] : rawId || '',
  ).trim();
  const { token, delivery, isLoading } = useAuth();

  const [order, setOrder] = useState<DeliveryAcceptedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pickupConfirmOpen, setPickupConfirmOpen] = useState(false);
  const [deliverConfirmOpen, setDeliverConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returning, setReturning] = useState(false);
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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleAdvance = async (action: DeliveryAdvanceAction) => {
    if (!token || !order || actionLoading) return;
    setActionLoading(true);
    try {
      const data = await advanceDeliveryOrderStep(token, {
        assignmentId: order.id,
        action,
      });
      setOrder(data);
      if (shouldOpenRouteOnAdvance(action)) {
        await openRoute(data);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Bosqichni yangilab bo‘lmadi';
      Alert.alert('Xatolik', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickUp = async () => {
    if (!token || !order || actionLoading) return;
    setActionLoading(true);
    try {
      const data = await pickUpDeliveryOrder(token, {
        assignmentId: order.id,
      });
      setOrder(data);
      setPickupConfirmOpen(false);
      Alert.alert(
        'Mahsulot olindi',
        'Endi mijozga yetkazish mumkin — «Mijozga borish» ni bosing.',
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Mahsulotni olishda xatolik';
      Alert.alert('Xatolik', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!token || !order || actionLoading) return;
    setActionLoading(true);
    try {
      const location = await requestCourierLocation();
      const data = await deliverDeliveryOrder(token, {
        assignmentId: order.id,
        courierLat: location.coords?.latitude,
        courierLng: location.coords?.longitude,
      });
      setDeliverConfirmOpen(false);
      setDeliveredSnapshot(data);
      setSuccessOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Topshirish amalga oshmadi';
      Alert.alert('Xatolik', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async (payload: {
    reasonType: ReturnReasonType;
    comment: string;
  }) => {
    if (!token || !order || returning) return;
    setReturning(true);
    try {
      await returnDeliveryOrder(token, {
        assignmentId: order.id,
        reasonType: payload.reasonType,
        comment: payload.comment,
      });
      setReturnModalOpen(false);
      Alert.alert(
        'Qaytarildi',
        payload.reasonType === 'no_answer'
          ? 'Buyurtma «Javob bermadi» sifatida siller adminiga yuborildi'
          : 'Mahsulot qaytarildi va siller adminiga yuborildi',
        [{ text: 'OK', onPress: () => router.replace('/home') }],
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Qaytarish amalga oshmadi';
      Alert.alert('Xatolik', message);
    } finally {
      setReturning(false);
    }
  };

  if (isLoading || !delivery) {
    return (
      <SafeAreaView style={styles.safeLoading}>
        <ActivityIndicator color="#6d32c5" />
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          Buyurtma {orderBarcode(order)}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#6d32c5" />
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
              <DeliveryStepProgress order={order} withBadge />

              {isSellerPhase(order) ? (
                <>
                <OrderPaymentNotice
                  amount={order.amount}
                  isPaid={order.isPaid}
                  paymentStatus={order.paymentStatus}
                  variant="seller"
                />
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Sotuvchi ma'lumotlari</Text>
                  <Text style={styles.sellerName}>
                    {displayOrDash(order.sellerPickup?.name)}
                  </Text>
                  <View style={styles.customerRow}>
                    <View style={styles.customerInfo}>
                      <Text style={styles.metaLabel}>Telefon</Text>
                      <Text style={styles.customerPhone}>
                        {displayOrDash(order.sellerPickup?.sellerPhone)}
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.iconButton,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        const phone = String(
                          order.sellerPickup?.sellerPhone || '',
                        ).trim();
                        if (!phone) {
                          Alert.alert(
                            'Telefon',
                            'Sotuvchi telefon raqami kiritilmagan. Siller admin → Market haqida dan qo‘shing.',
                          );
                          return;
                        }
                        callCustomer(phone);
                      }}>
                      <Ionicons name="call" size={20} color="#FFFFFF" />
                    </Pressable>
                  </View>
                  <View style={styles.addressRow}>
                    <View style={styles.addressInfo}>
                      <Text style={styles.metaLabel}>Manzil</Text>
                      <Text style={styles.addressText}>
                        {sellerAddressText(order)}
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.iconButton,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        void openRoute(order);
                      }}>
                      <Ionicons name="navigate" size={20} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Mijoz ma'lumotlari</Text>
                  <View style={styles.customerRow}>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>
                        {customerName(order)}
                      </Text>
                      <Text style={styles.customerPhone}>
                        {displayOrDash(order.customer?.phone)}
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.iconButton,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        const phone = String(order.customer?.phone || '').trim();
                        if (!phone) {
                          Alert.alert('Telefon', 'Mijoz telefon raqami topilmadi');
                          return;
                        }
                        callCustomer(phone);
                      }}>
                      <Ionicons name="call" size={20} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
                </>
              ) : (
                <>
              <OrderPaymentNotice
                amount={order.amount}
                isPaid={order.isPaid}
                paymentStatus={order.paymentStatus}
                variant="customer"
              />
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
                <Text style={styles.cardTitle}>Sotuvchi ma'lumotlari</Text>
                <Text style={styles.sellerName}>
                  {displayOrDash(order.sellerPickup?.name)}
                </Text>
                <View style={styles.customerRow}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.metaLabel}>Telefon</Text>
                    <Text style={styles.customerPhone}>
                      {displayOrDash(order.sellerPickup?.sellerPhone)}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.iconButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      const phone = String(
                        order.sellerPickup?.sellerPhone || '',
                      ).trim();
                      if (!phone) {
                        Alert.alert(
                          'Telefon',
                          'Sotuvchi telefon raqami kiritilmagan. Siller admin → Market haqida dan qo‘shing.',
                        );
                        return;
                      }
                      callCustomer(phone);
                    }}>
                    <Ionicons name="call" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Manzil</Text>
                <View style={styles.addressRow}>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressText}>{addressText(order)}</Text>
                    {order.deliveryAddress?.district ? (
                      <Text style={styles.districtText}>
                        {order.deliveryAddress.district}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.iconButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      void openRoute(order);
                    }}>
                    <Ionicons name="location" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>

                <View style={styles.detailsRow}>
                  <DetailCell
                    label="Uy"
                    value={order.deliveryAddress?.placeType}
                  />
                  <DetailCell
                    label="Yo‘lak"
                    value={order.deliveryAddress?.entrance}
                  />
                  <DetailCell
                    label="Qavat"
                    value={order.deliveryAddress?.floor}
                  />
                  <DetailCell
                    label="Domofon"
                    value={order.deliveryAddress?.domofon}
                  />
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.noteHead}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color="#6d32c5"
                  />
                  <Text style={styles.cardTitle}>Kuryer uchun izoh</Text>
                </View>
                <Text style={styles.noteText}>
                  {displayOrDash(order.deliveryAddress?.courierNote)}
                </Text>
              </View>
                </>
              )}

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Mahsulotlar</Text>
                <View style={styles.productRow}>
                  <Text style={styles.productName}>
                    1. {productTitle(order)}
                  </Text>
                  <Text style={styles.productQty}>
                    {order.productCount} dona
                  </Text>
                </View>
                <View style={styles.metaList}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Kod</Text>
                    <Text style={styles.metaValue}>{orderBarcode(order)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Rang</Text>
                    <Text style={styles.metaValue}>
                      {displayOrDash(order.color)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>O‘lcham</Text>
                    <Text style={styles.metaValue}>
                      {displayOrDash(order.size)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Xotira</Text>
                    <Text style={styles.metaValue}>
                      {displayOrDash(order.storage)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Model</Text>
                    <Text style={styles.metaValue}>
                      {displayOrDash(order.model)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {order.status !== 'delivered' ? (
              <View style={styles.footer}>
                <DeliveryStepActions
                  order={order}
                  loading={actionLoading}
                  layout="footer"
                  onAdvance={(action) => {
                    void handleAdvance(action);
                  }}
                  onPickUp={() => setPickupConfirmOpen(true)}
                  onDeliver={() => setDeliverConfirmOpen(true)}
                  onReturn={() => setReturnModalOpen(true)}
                />
              </View>
            ) : null}
          </>
        )}
      </View>

      <MiniGlobalModal
        visible={pickupConfirmOpen}
        title={getPrimaryAction(order).confirmTitle || 'Mahsulotni olish'}
        message={
          getPrimaryAction(order).confirmMessage ||
          'Chindan ham mahsulot olinganligini tasdiqlaysizmi?'
        }
        confirmText="Ha"
        cancelText="Yo‘q"
        loading={actionLoading}
        loadingText="Tasdiqlanmoqda..."
        onCancel={() => {
          if (!actionLoading) setPickupConfirmOpen(false);
        }}
        onConfirm={() => {
          void handlePickUp();
        }}
      />

      <MiniGlobalModal
        visible={deliverConfirmOpen}
        title={getPrimaryAction(order).confirmTitle || 'Mijozga topshirish'}
        message={
          getPrimaryAction(order).confirmMessage ||
          'Chindan ham mahsulotni mijozga topshirganingizni tasdiqlaysizmi?'
        }
        confirmText="Ha"
        cancelText="Yo‘q"
        loading={actionLoading}
        loadingText="Topshirilmoqda..."
        onCancel={() => {
          if (!actionLoading) setDeliverConfirmOpen(false);
        }}
        onConfirm={() => {
          void handleDeliver();
        }}
      />

      <DeliveredSuccessModal
        visible={successOpen}
        barcode={orderBarcode(deliveredSnapshot || order)}
        totalAmount={Math.max(0, Number(deliveredSnapshot?.courierPayment) || 0)}
        deliveredAt={deliveredSnapshot?.deliveredAt || null}
        onContinue={() => {
          setSuccessOpen(false);
          router.replace('/home');
        }}
      />

      <OrderReturnReasonModal
        visible={returnModalOpen}
        isPaid={Boolean(order?.isPaid)}
        submitting={returning}
        onClose={() => {
          if (!returning) setReturnModalOpen(false);
        }}
        onSubmit={handleReturn}
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
  sellerName: {
    color: '#56337d',
    fontSize: 15,
    fontWeight: '700',
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
    backgroundColor: '#6d32c5',
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
  districtText: {
    color: '#6d32c5',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8F5FF',
    borderRadius: 14,
    padding: 12,
  },
  detailCell: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
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
  productQty: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  metaList: {
    gap: 0,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    overflow: 'hidden',
  },
  metaItem: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  metaLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  metaValue: {
    flex: 1,
    textAlign: 'right',
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
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
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.9,
  },
});
