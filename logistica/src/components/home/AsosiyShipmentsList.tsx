import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ShipmentRequestCard,
  type ShipmentRequest,
} from '@/components/home/ShipmentRequestCard';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import { fetchPendingShipments } from '@/services/logistica-shipments';

const ACCENT = '#7c3aed';

export function AsosiyShipmentsList() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [items, setItems] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!token) {
        setItems([]);
        setLoading(false);
        setError(t('shipments.errors.authRequired'));
        return;
      }

      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setError('');

      try {
        const data = await fetchPendingShipments(token);
        setItems(
          data.shipments.map((row) => ({
            id: row.id,
            requestCode: row.requestCode,
            storeName: row.storeName,
            dateTime: row.dateTime,
            productCount: row.productCount,
            weightKg: row.weightKg,
            weightLabel: row.weightLabel,
            cargoServiceType: row.cargoServiceType,
            cargoLaneCounts: row.cargoLaneCounts,
          })),
        );
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : t('shipments.errors.loadListFailed');
        setError(message);
        if (mode === 'initial') setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t, token],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={ACCENT} size="large" />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>
          {t('shipments.errors.loadFailedTitle')}
        </Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          onPress={() => {
            void load('initial');
          }}
        >
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        items.length === 0 ? styles.contentEmpty : null,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void load('refresh');
          }}
          tintColor={ACCENT}
          colors={[ACCENT]}
        />
      }
    >
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {t('shipments.empty.pendingTitle')}
          </Text>
          <Text style={styles.emptyText}>
            {t('shipments.empty.pendingText')}
          </Text>
        </View>
      ) : (
        items.map((item) => <ShipmentRequestCard key={item.id} item={item} />)
      )}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 10,
  },
  contentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  bottomSpace: {
    height: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
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
