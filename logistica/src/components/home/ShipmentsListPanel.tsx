import { useCallback, useEffect, useState } from 'react';
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
import type { ShipmentListItem } from '@/types/shipment';

const ACCENT = '#7c3aed';

type Props = {
  loadShipments: (token: string) => Promise<{ shipments: ShipmentListItem[] }>;
  hrefBase?: '/shipment/[id]' | '/ish-stoli/[id]';
  emptyTitle: string;
  emptyText: string;
};

export function ShipmentsListPanel({
  loadShipments,
  hrefBase = '/shipment/[id]',
  emptyTitle,
  emptyText,
}: Props) {
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
        setError('Avtorizatsiya talab qilinadi');
        return;
      }

      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setError('');

      try {
        const data = await loadShipments(token);
        setItems(
          data.shipments.map((row) => ({
            id: row.id,
            requestCode: row.requestCode,
            storeName: row.storeName,
            dateTime: row.dateTime,
            productCount: row.productCount,
            weightKg: row.weightKg,
            weightLabel: row.weightLabel,
          })),
        );
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'So‘rovlarni yuklab bo‘lmadi';
        setError(message);
        if (mode === 'initial') setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadShipments, token],
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
        <Text style={styles.errorTitle}>Yuklanmadi</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
          onPress={() => {
            void load('initial');
          }}
        >
          <Text style={styles.retryText}>Qayta urinish</Text>
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
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        items.map((item) => (
          <ShipmentRequestCard key={item.id} item={item} hrefBase={hrefBase} />
        ))
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
