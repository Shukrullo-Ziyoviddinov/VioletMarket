import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlobalConfirmModal } from '@/components/GlobalConfirmModal';
import { ShipmentActionButtons } from '@/components/shipment-detail/ShipmentActionButtons';
import { ShipmentDetailSummary } from '@/components/shipment-detail/ShipmentDetailSummary';
import { ShipmentProductsList } from '@/components/shipment-detail/ShipmentProductsList';
import { ShipmentRequestInfo } from '@/components/shipment-detail/ShipmentRequestInfo';
import { PROCESS_STEPS } from '@/constants/shipmentProcess';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import {
  fetchShipmentDetail,
  markShipmentPaid,
  returnShipmentToSeller,
  saveShipmentProcessStep,
} from '@/services/logistica-shipments';
import type { ProcessStepKey, ShipmentDetail } from '@/types/shipment';

const ACCENT = '#7c3aed';

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default function IshStoliScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = stringParam(params.id);

  const [detail, setDetail] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [paidModalOpen, setPaidModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || !id) {
      setDetail(null);
      setError(!id ? 'So‘rov topilmadi' : 'Avtorizatsiya talab qilinadi');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchShipmentDetail(token, id);
      setDetail(data);
    } catch (err) {
      setDetail(null);
      setError(
        err instanceof ApiError ? err.message : 'So‘rovni yuklab bo‘lmadi',
      );
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const isAccepted = detail?.status === 'accepted';
  const isToshkent = detail?.activeProcessStep === 'toshkent_omborida';
  const isPaid = Boolean(detail?.paidAt);
  const showProcessButtons = isAccepted && !isToshkent && !isPaid;
  const showPaidButton = isAccepted && isToshkent && !isPaid;
  /** Accepted + to‘lanmagan — admin ga qaytarish so‘rovi (Asosiydagi bilan bir xil zanjir) */
  const showReturnRequest = isAccepted && !isPaid;
  const productCode = useMemo(() => {
    const first = detail?.products?.[0];
    if (!first?.productId) return detail?.requestCode || '—';
    return `#${String(first.productId).padStart(4, '0')}`;
  }, [detail]);

  const handleProcessStep = async (step: ProcessStepKey) => {
    if (!token || !id || actionLoading) return;
    setActionLoading(true);
    try {
      const shipment = await saveShipmentProcessStep(token, id, step);
      setDetail(shipment);
      if (step === 'toshkent_omborida') {
        Alert.alert('Toshkent omborida', 'Mahsulot UZBda sahifasiga o‘tdi');
        router.replace('/uzbda');
        return;
      }
      Alert.alert('Saqlandi', 'Jarayon holati yangilandi');
    } catch (err) {
      Alert.alert(
        'Xato',
        err instanceof ApiError ? err.message : 'Saqlab bo‘lmadi',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPaid = async () => {
    if (!token || !id || actionLoading) return;
    setActionLoading(true);
    try {
      const result = await markShipmentPaid(token, id);
      setDetail(result.shipment);
      setPaidModalOpen(false);
      Alert.alert(
        'To‘landi',
        result.alreadyPaid
          ? 'Allaqachon to‘langan'
          : 'Mahsulot asosiy admin «Xorij → UZB» ga chiqadi',
      );
      router.replace('/uzbda');
    } catch (err) {
      Alert.alert(
        'Xato',
        err instanceof ApiError ? err.message : 'Belgilab bo‘lmadi',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReturnRequest = async () => {
    if (!token || !id || actionLoading) return;
    setActionLoading(true);
    try {
      await returnShipmentToSeller(token, id);
      setReturnModalOpen(false);
      Alert.alert(
        'So‘rov yuborildi',
        'Asosiy admin tasdiqlashini kuting. Tasdiqdan keyin «Qaytarish» sahifasiga o‘tadi.',
      );
      router.replace(isToshkent ? '/uzbda' : '/yuklarim');
    } catch (err) {
      Alert.alert(
        'Xato',
        err instanceof ApiError ? err.message : 'So‘rov yuborib bo‘lmadi',
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Ish stoli
        </Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : error || !detail ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Yuklanmadi</Text>
          <Text style={styles.errorText}>{error || 'So‘rov topilmadi'}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
            onPress={() => {
              void load();
            }}
          >
            <Text style={styles.retryText}>Qayta urinish</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 40 + Math.max(insets.bottom, 12) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ShipmentDetailSummary
            storeName={detail.storeName}
            dateTime={detail.dateTime}
          />

          <ShipmentRequestInfo
            productCount={detail.productCount}
            weightLabel={detail.weightLabel}
            weightKg={detail.weightKg}
            warehouseAddress={detail.warehouseAddress}
            note={detail.note}
          />

          <ShipmentProductsList products={detail.products} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tasdiqlash</Text>

            <View style={styles.statusRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={isAccepted ? '#16A34A' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.statusText,
                  isAccepted && styles.statusTextDone,
                ]}
              >
                Qabul qilindi
              </Text>
            </View>

            {showProcessButtons ? (
              <View style={styles.steps}>
                {PROCESS_STEPS.map((step) => {
                  const done =
                    detail.activeProcessStep != null &&
                    PROCESS_STEPS.findIndex(
                      (row) => row.key === detail.activeProcessStep,
                    ) >=
                      PROCESS_STEPS.findIndex((row) => row.key === step.key);
                  return (
                    <Pressable
                      key={step.key}
                      style={({ pressed }) => [
                        styles.stepBtn,
                        done && styles.stepBtnDone,
                        pressed && !actionLoading && styles.pressed,
                      ]}
                      disabled={actionLoading}
                      onPress={() => {
                        void handleProcessStep(step.key);
                      }}
                    >
                      <Ionicons
                        name={step.icon}
                        size={18}
                        color={done ? '#FFFFFF' : ACCENT}
                      />
                      <Text
                        style={[
                          styles.stepBtnText,
                          done && styles.stepBtnTextDone,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {showPaidButton ? (
              <Pressable
                style={({ pressed }) => [
                  styles.paidBtn,
                  pressed && !actionLoading && styles.pressed,
                ]}
                disabled={actionLoading}
                onPress={() => setPaidModalOpen(true)}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.paidBtnText}>To‘landi</Text>
                )}
              </Pressable>
            ) : null}

            {isPaid ? (
              <Text style={styles.paidHint}>
                To‘lov belgilangan — asosiy admin «Xorij → UZB» da ko‘rinadi.
              </Text>
            ) : null}

            {showReturnRequest ? (
              <View style={styles.returnWrap}>
                <ShipmentActionButtons
                  onReturnToSeller={() => {
                    if (!actionLoading) setReturnModalOpen(true);
                  }}
                />
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}

      <GlobalConfirmModal
        open={paidModalOpen}
        title="To‘lovni tasdiqlash"
        message={`Chindan ham ${productCode} shtrix kodidagi mahsulotga to‘lov qilindimi?`}
        confirmText="Ha"
        cancelText="Yo'q"
        loading={actionLoading}
        onCancel={() => {
          if (!actionLoading) setPaidModalOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmPaid();
        }}
      />

      <GlobalConfirmModal
        open={returnModalOpen}
        title="Sotuvchiga qaytarish"
        message="Asosiy adminga so‘rov yuborilsinmi? Tasdiqlangach «Qaytarish» sahifasida yakunlaysiz."
        confirmText="Yuborish"
        cancelText="Bekor"
        loading={actionLoading}
        onCancel={() => {
          if (!actionLoading) setReturnModalOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmReturnRequest();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  errorText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 6,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  statusTextDone: {
    color: '#16A34A',
  },
  steps: {
    gap: 8,
  },
  stepBtn: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ACCENT,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  stepBtnDone: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  stepBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },
  stepBtnTextDone: {
    color: '#FFFFFF',
  },
  paidBtn: {
    marginTop: 4,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  paidHint: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
    lineHeight: 18,
  },
  returnWrap: {
    marginTop: 4,
  },
  pressed: {
    opacity: 0.9,
  },
});
