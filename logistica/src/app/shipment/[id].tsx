import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import type { ReturnUnitSelection } from '@/components/shipment-detail/ShipmentProductsList';
import { ShipmentRequestInfo } from '@/components/shipment-detail/ShipmentRequestInfo';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import {
  acceptShipment,
  fetchShipmentDetail,
  returnShipmentToSeller,
} from '@/services/logistica-shipments';
import type { ShipmentDetail, ShipmentProduct } from '@/types/shipment';

const ACCENT = '#7c3aed';

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function unitKey(shipmentId: string, unitIndex: number) {
  return `${shipmentId}:${unitIndex}`;
}

function isReturnableProduct(product: ShipmentProduct) {
  const status = String(product.returnStatus || 'active').toLowerCase();
  return status === 'active';
}

function listReturnableUnits(detail: ShipmentDetail | null): ReturnUnitSelection[] {
  if (!detail) return [];
  const products = Array.isArray(detail.products) ? detail.products : [];
  return products
    .filter(isReturnableProduct)
    .map((product) => ({
      shipmentId: String(product.shipmentId || detail.id || '').trim(),
      unitIndex: Number(product.unitIndex) || 0,
    }))
    .filter((row) => Boolean(row.shipmentId));
}

/** Asosiy — faqat pending qabul / qaytarish */
export default function ShipmentDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = stringParam(params.id);

  const [detail, setDetail] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<ReturnUnitSelection[]>([]);

  const load = useCallback(async () => {
    if (!token || !id) {
      setDetail(null);
      setError(
        !id
          ? t('shipments.errors.notFound')
          : t('shipments.errors.authRequired'),
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchShipmentDetail(token, id);
      setDetail(data);
      setSelectedUnits([]);
      if (data.status === 'accepted') {
        router.replace({
          pathname: '/ish-stoli/[id]',
          params: { id: data.id },
        });
      }
    } catch (err) {
      setDetail(null);
      setError(
        err instanceof ApiError
          ? err.message
          : t('shipments.errors.loadFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, [id, router, t, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const isPending = detail?.status === 'pending';
  const busy = actionLoading || loading;
  const returnableUnits = useMemo(() => listReturnableUnits(detail), [detail]);
  const canSelectReturn = returnableUnits.length > 1;

  const toggleUnit = useCallback((shipmentId: string, unitIndex: number) => {
    const key = unitKey(shipmentId, unitIndex);
    setSelectedUnits((prev) => {
      const exists = prev.some(
        (row) => unitKey(row.shipmentId, row.unitIndex) === key,
      );
      if (exists) {
        return prev.filter(
          (row) => unitKey(row.shipmentId, row.unitIndex) !== key,
        );
      }
      return [...prev, { shipmentId, unitIndex }];
    });
  }, []);

  const handleAccept = async () => {
    if (!token || !id || busy) return;
    setActionLoading(true);
    try {
      const result = await acceptShipment(token, id);
      Alert.alert(
        t('shipments.alerts.acceptedTitle'),
        t('shipments.alerts.acceptedMessage'),
      );
      router.replace('/yuklarim');
      return result;
    } catch (err) {
      Alert.alert(
        t('common.error'),
        err instanceof ApiError
          ? err.message
          : t('shipments.alerts.acceptFailed'),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = () => {
    if (!token || !id || busy) return;

    // Guruh: tanlov bo‘sh → barcha returnable unitlar (siblinglar qolmasin)
    const unitsToReturn =
      selectedUnits.length > 0
        ? selectedUnits
        : returnableUnits.length
          ? returnableUnits
          : [{ shipmentId: id, unitIndex: 0 }];

    if (unitsToReturn.length === 0) {
      Alert.alert(t('common.error'), t('shipments.alerts.returnSelectRequired'));
      return;
    }

    if (canSelectReturn && selectedUnits.length === 0) {
      setSelectedUnits(unitsToReturn);
    }

    Alert.alert(
      t('shipments.alerts.returnTitle'),
      t('shipments.alerts.returnMessage'),
      [
        { text: t('shipments.actions.cancel'), style: 'cancel' },
        {
          text: t('shipments.actions.send'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setActionLoading(true);
              try {
                await returnShipmentToSeller(token, id, {
                  selections: unitsToReturn,
                });
                Alert.alert(
                  t('shipments.alerts.returnSentTitle'),
                  t('shipments.alerts.returnSentMessage'),
                );
                router.back();
              } catch (err) {
                Alert.alert(
                  t('common.error'),
                  err instanceof ApiError
                    ? err.message
                    : t('shipments.alerts.returnFailed'),
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
          {detail?.requestCode || t('shipments.detail.requestTitle')}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : error || !detail ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>
            {t('shipments.errors.loadFailedTitle')}
          </Text>
          <Text style={styles.errorText}>
            {error || t('shipments.errors.notFound')}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
            onPress={() => {
              void load();
            }}
          >
            <Text style={styles.retryText}>{t('common.retry')}</Text>
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

          <ShipmentProductsList
            products={detail.products}
            selectable={isPending && canSelectReturn}
            selectedUnits={selectedUnits}
            onToggleUnit={toggleUnit}
            showTotalWeight
            totalWeightKg={detail.weightKg}
          />

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
