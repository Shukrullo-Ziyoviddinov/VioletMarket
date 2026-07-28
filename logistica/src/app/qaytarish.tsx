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

import { GlobalConfirmModal } from '@/components/GlobalConfirmModal';
import { ScreenShell } from '@/components/ScreenShell';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import {
  confirmCargoReturn,
  fetchApprovedCargoReturns,
} from '@/services/logistica-shipments';

const ACCENT = '#7c3aed';

type ReturnItem = {
  id: string;
  requestCode: string;
  storeName: string;
  productTitle: string;
  productCode: string;
  orderId: number;
  amount: number;
  cargoCountryLabel: string;
};

function formatMoney(value: number) {
  return `${Math.max(0, value || 0).toLocaleString('uz-UZ')} so'm`;
}

export default function QaytarishScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ReturnItem | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

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
        const data = await fetchApprovedCargoReturns(token);
        setItems(data.items);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Ro‘yxatni yuklab bo‘lmadi',
        );
        if (mode === 'initial') setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleConfirm = async () => {
    if (!token || !selected || confirmLoading) return;
    setConfirmLoading(true);
    try {
      await confirmCargoReturn(token, selected.id);
      setSelected(null);
      await load('refresh');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Qaytarib bo‘lmadi',
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <ScreenShell title="Qaytarish">
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Yuklanmadi</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
            onPress={() => {
              void load();
            }}
          >
            <Text style={styles.retryText}>Qayta urinish</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Qaytarish yo‘q</Text>
          <Text style={styles.emptyText}>
            Asosiy admin «Yaroqsiz» tasdiqlagach, mahsulotlar shu yerda chiqadi.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void load('refresh');
              }}
              tintColor={ACCENT}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {error ? <Text style={styles.inlineError}>{error}</Text> : null}
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() => setSelected(item)}
            >
              <Text style={styles.code} numberOfLines={1}>
                {item.requestCode || item.productCode || '—'}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {item.productTitle}
              </Text>
              <Text style={styles.meta}>
                {item.storeName || 'Siller'} · #{item.orderId}
              </Text>
              <Text style={styles.meta}>
                {item.cargoCountryLabel || 'Cargo'} · {formatMoney(item.amount)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <GlobalConfirmModal
        open={Boolean(selected)}
        title="Qaytarishni tasdiqlaysizmi?"
        message={
          selected
            ? `${selected.productTitle} sillerga qaytariladi (Yaroqsiz — omborga kirmaydi).`
            : ''
        }
        confirmText="Ha"
        cancelText="Yo'q"
        loading={confirmLoading}
        onConfirm={() => {
          void handleConfirm();
        }}
        onCancel={() => {
          if (!confirmLoading) setSelected(null);
        }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  inlineError: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 8,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  code: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  meta: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.88,
  },
});
