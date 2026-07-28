import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import { ShipmentActionButtons } from '@/components/shipment-detail/ShipmentActionButtons';
import { ShipmentDetailSummary } from '@/components/shipment-detail/ShipmentDetailSummary';
import { ShipmentProductsList } from '@/components/shipment-detail/ShipmentProductsList';
import { ShipmentRequestInfo } from '@/components/shipment-detail/ShipmentRequestInfo';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import {
  acceptShipment,
  fetchShipmentDetail,
  returnShipmentToSeller,
} from '@/services/logistica-shipments';
import type { ShipmentDetail } from '@/types/shipment';

const ACCENT = '#7c3aed';

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

/** Asosiy — faqat pending qabul / qaytarish */
export default function ShipmentDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = stringParam(params.id);

  const [detail, setDetail] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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
      if (data.status === 'accepted') {
        router.replace({
          pathname: '/ish-stoli/[id]',
          params: { id: data.id },
        });
      }
    } catch (err) {
      setDetail(null);
      setError(
        err instanceof ApiError ? err.message : 'So‘rovni yuklab bo‘lmadi',
      );
    } finally {
      setLoading(false);
    }
  }, [id, router, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const isPending = detail?.status === 'pending';
  const busy = actionLoading || loading;

  const handleAccept = async () => {
    if (!token || !id || busy) return;
    setActionLoading(true);
    try {
      const result = await acceptShipment(token, id);
      Alert.alert('Qabul qilindi', 'So‘rov Yuklarim sahifasiga o‘tdi');
      router.replace('/yuklarim');
      return result;
    } catch (err) {
      Alert.alert(
        'Xato',
        err instanceof ApiError ? err.message : 'Qabul qilib bo‘lmadi',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = () => {
    if (!token || !id || busy) return;
    Alert.alert(
      'Sotuvchiga qaytarish',
      'Asosiy adminga so‘rov yuborilsinmi? Tasdiqlangach «Qaytarish» sahifasida yakunlaysiz.',
      [
        { text: 'Bekor', style: 'cancel' },
        {
          text: 'Yuborish',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setActionLoading(true);
              try {
                await returnShipmentToSeller(token, id);
                Alert.alert(
                  'So‘rov yuborildi',
                  'Asosiy admin tasdiqlashini kuting. Tasdiqdan keyin «Qaytarish» sahifasiga o‘tadi.',
                );
                router.back();
              } catch (err) {
                Alert.alert(
                  'Xato',
                  err instanceof ApiError
                    ? err.message
                    : 'So‘rov yuborib bo‘lmadi',
                );
              } finally {
                setActionLoading(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {detail?.requestCode || 'Yuk so‘rovi'}
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

          {isPending ? (
            <ShipmentActionButtons
              onAccept={!busy ? () => void handleAccept() : undefined}
              onReturnToSeller={!busy ? handleReturn : undefined}
            />
          ) : null}
        </ScrollView>
      )}
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
  pressed: {
    opacity: 0.9,
  },
});
