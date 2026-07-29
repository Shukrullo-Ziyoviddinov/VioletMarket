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
import { Ionicons } from '@expo/vector-icons';

import { GlobalConfirmModal } from '@/components/GlobalConfirmModal';
import { ScreenShell } from '@/components/ScreenShell';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import {
  confirmCargoReturn,
  fetchCargoReturnsBoard,
} from '@/services/logistica-shipments';

const ACCENT = '#7c3aed';
const PAGE_SIZE = 30;

type ReturnItem = {
  id: string;
  requestCode: string;
  storeName: string;
  productTitle: string;
  productCode: string;
  orderId: number;
  amount: number;
  cargoCountryLabel: string;
  status: string;
};

function formatMoney(value: number) {
  return `${Math.max(0, value || 0).toLocaleString('uz-UZ')} so'm`;
}

function mergeUnique(prev: ReturnItem[], next: ReturnItem[]) {
  const map = new Map<string, ReturnItem>();
  for (const row of prev) map.set(row.id, row);
  for (const row of next) map.set(row.id, row);
  return [...map.values()];
}

function ReturnCard({
  item,
  tone,
  onPress,
}: {
  item: ReturnItem;
  tone: 'pending' | 'approved';
  onPress?: () => void;
}) {
  const interactive = Boolean(onPress);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        tone === 'pending' ? styles.cardPending : styles.cardApproved,
        interactive && pressed && styles.pressed,
      ]}
      disabled={!interactive}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <Text style={styles.code} numberOfLines={1}>
          {item.requestCode || item.productCode || '—'}
        </Text>
        <Text
          style={[
            styles.badge,
            tone === 'pending' ? styles.badgePending : styles.badgeApproved,
          ]}
        >
          {tone === 'pending' ? 'Admin kutmoqda' : 'Tasdiqlangan'}
        </Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.productTitle}
      </Text>
      <Text style={styles.meta}>
        {item.storeName || 'Siller'} · #{item.orderId}
      </Text>
      <Text style={styles.meta}>
        {item.cargoCountryLabel || 'Cargo'} · {formatMoney(item.amount)}
      </Text>
      {tone === 'approved' ? (
        <Text style={styles.hint}>Bosib «Ha» bilan yakunlang</Text>
      ) : (
        <Text style={styles.hint}>Asosiy admin tasdiqlashini kuting</Text>
      )}
    </Pressable>
  );
}

export default function QaytarishScreen() {
  const { token } = useAuth();
  const [pending, setPending] = useState<ReturnItem[]>([]);
  const [approved, setApproved] = useState<ReturnItem[]>([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [approvedTotalPages, setApprovedTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMorePending, setLoadingMorePending] = useState(false);
  const [loadingMoreApproved, setLoadingMoreApproved] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ReturnItem | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!token) {
        setPending([]);
        setApproved([]);
        setLoading(false);
        setError('Avtorizatsiya talab qilinadi');
        return;
      }

      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setError('');

      try {
        const data = await fetchCargoReturnsBoard(token, {
          pendingPage: 1,
          approvedPage: 1,
          limit: PAGE_SIZE,
        });
        setPending(data.pending.items);
        setApproved(data.approved.items);
        setPendingPage(data.pending.page);
        setApprovedPage(data.approved.page);
        setPendingTotalPages(data.pending.totalPages);
        setApprovedTotalPages(data.approved.totalPages);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Ro‘yxatni yuklab bo‘lmadi',
        );
        if (mode === 'initial') {
          setPending([]);
          setApproved([]);
        }
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

  const loadMorePending = async () => {
    if (!token || loadingMorePending || pendingPage >= pendingTotalPages) return;
    setLoadingMorePending(true);
    try {
      const nextPage = pendingPage + 1;
      const data = await fetchCargoReturnsBoard(token, {
        pendingPage: nextPage,
        approvedPage: 1,
        limit: PAGE_SIZE,
      });
      setPending((prev) => mergeUnique(prev, data.pending.items));
      setPendingPage(data.pending.page);
      setPendingTotalPages(data.pending.totalPages);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Yana yuklab bo‘lmadi',
      );
    } finally {
      setLoadingMorePending(false);
    }
  };

  const loadMoreApproved = async () => {
    if (!token || loadingMoreApproved || approvedPage >= approvedTotalPages) {
      return;
    }
    setLoadingMoreApproved(true);
    try {
      const nextPage = approvedPage + 1;
      const data = await fetchCargoReturnsBoard(token, {
        pendingPage: 1,
        approvedPage: nextPage,
        limit: PAGE_SIZE,
      });
      setApproved((prev) => mergeUnique(prev, data.approved.items));
      setApprovedPage(data.approved.page);
      setApprovedTotalPages(data.approved.totalPages);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Yana yuklab bo‘lmadi',
      );
    } finally {
      setLoadingMoreApproved(false);
    }
  };

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

  const empty = pending.length === 0 && approved.length === 0;

  return (
    <ScreenShell title="Qaytarish">
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : error && empty ? (
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
      ) : empty ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="return-down-back-outline" size={58} color="#C4B5FD" />
          </View>
          <Text style={styles.emptyTitle}>Qaytarish yo‘q</Text>
          <Text style={styles.emptyText}>
            So‘rov yuborilganda «Admin kutmoqda»da, tasdiqdan keyin yakunlash
            uchun shu yerda chiqadi.
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

          <Text style={styles.sectionTitle}>Admin kutmoqda</Text>
          {pending.length === 0 ? (
            <Text style={styles.sectionEmpty}>Kutilayotgan so‘rov yo‘q</Text>
          ) : (
            pending.map((item) => (
              <ReturnCard key={`p-${item.id}`} item={item} tone="pending" />
            ))
          )}
          {pendingPage < pendingTotalPages ? (
            <Pressable
              style={({ pressed }) => [
                styles.moreBtn,
                pressed && !loadingMorePending && styles.pressed,
              ]}
              disabled={loadingMorePending}
              onPress={() => {
                void loadMorePending();
              }}
            >
              {loadingMorePending ? (
                <ActivityIndicator color={ACCENT} />
              ) : (
                <Text style={styles.moreText}>Yana yuklash</Text>
              )}
            </Pressable>
          ) : null}

          <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
            Tasdiqlangan
          </Text>
          {approved.length === 0 ? (
            <Text style={styles.sectionEmpty}>
              Yakunlash uchun tasdiqlangan mahsulot yo‘q
            </Text>
          ) : (
            approved.map((item) => (
              <ReturnCard
                key={`a-${item.id}`}
                item={item}
                tone="approved"
                onPress={() => setSelected(item)}
              />
            ))
          )}
          {approvedPage < approvedTotalPages ? (
            <Pressable
              style={({ pressed }) => [
                styles.moreBtn,
                pressed && !loadingMoreApproved && styles.pressed,
              ]}
              disabled={loadingMoreApproved}
              onPress={() => {
                void loadMoreApproved();
              }}
            >
              {loadingMoreApproved ? (
                <ActivityIndicator color={ACCENT} />
              ) : (
                <Text style={styles.moreText}>Yana yuklash</Text>
              )}
            </Pressable>
          ) : null}
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  sectionTitleSpaced: {
    marginTop: 14,
  },
  sectionEmpty: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
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
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    marginBottom: 2,
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
  moreBtn: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  moreText: {
    color: ACCENT,
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  cardPending: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  cardApproved: {
    borderColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  code: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  badgeApproved: {
    backgroundColor: '#EDE9FE',
    color: '#6D28D9',
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
  hint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  pressed: {
    opacity: 0.88,
  },
});
