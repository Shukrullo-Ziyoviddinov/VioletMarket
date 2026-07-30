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
import { useTranslation } from 'react-i18next';

import { ScreenShell } from '@/components/ScreenShell';
import { TarixBalancePanel } from '@/components/tarix/TarixBalancePanel';
import { localeForLanguage } from '@/i18n';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import { fetchCargoHistory } from '@/services/logistica-shipments';

const ACCENT = '#7c3aed';
const GREEN = '#16A34A';
const RED = '#DC2626';
const PAGE_SIZE = 30;

type HistoryItem = {
  id: string;
  kind: 'handed_over' | 'returned';
  kindLabel: string;
  requestCode: string;
  storeName: string;
  productTitle: string;
  productCode: string;
  orderId: number;
  amount: number;
  cargoCountryLabel: string;
  at: string | null;
};

function mergeUnique(prev: HistoryItem[], next: HistoryItem[]) {
  const map = new Map<string, HistoryItem>();
  for (const row of prev) map.set(row.id, row);
  for (const row of next) map.set(row.id, row);
  return [...map.values()];
}

export default function TarixScreen() {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.language);
  const { token } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  const formatWhen = (value: string | null) => {
    if (!value) return t('account.dash');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('account.dash');
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (value: number) =>
    `${Math.max(0, value || 0).toLocaleString(locale)} ${t('common.sum')}`;

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!token) {
        setItems([]);
        setLoading(false);
        setError(t('account.authRequired'));
        return;
      }

      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setError('');

      try {
        const data = await fetchCargoHistory(token, 1, PAGE_SIZE);
        setItems(data.items as HistoryItem[]);
        setPage(data.page);
        setTotalPages(data.totalPages);
        if (mode === 'refresh') {
          setBalanceRefreshKey((prev) => prev + 1);
        }
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : t('history.loadFailed'),
        );
        if (mode === 'initial') setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t, token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = async () => {
    if (!token || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchCargoHistory(token, nextPage, PAGE_SIZE);
      setItems((prev) => mergeUnique(prev, data.items as HistoryItem[]));
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t('account.loadMoreFailed'),
      );
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <ScreenShell title={t('history.title')}>
      <TarixBalancePanel refreshKey={balanceRefreshKey} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>{t('account.loadFailed')}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
            onPress={() => {
              void load();
            }}
          >
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="time-outline" size={58} color="#C4B5FD" />
          </View>
          <Text style={styles.emptyTitle}>{t('history.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('history.emptyText')}</Text>
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
          {items.map((item) => {
            const isReturned = item.kind === 'returned';
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  isReturned ? styles.cardReturned : styles.cardHanded,
                ]}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.code} numberOfLines={1}>
                    {item.requestCode || item.productCode || t('account.dash')}
                  </Text>
                  <Text
                    style={[
                      styles.badge,
                      isReturned ? styles.badgeReturned : styles.badgeHanded,
                    ]}
                  >
                    {isReturned
                      ? t('history.statusReturned')
                      : t('history.statusHandedOver')}
                  </Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {item.productTitle}
                </Text>
                <Text style={styles.meta}>
                  {item.storeName || t('account.sellerFallback')} · #
                  {item.orderId}
                </Text>
                <Text style={styles.meta}>
                  {item.cargoCountryLabel || t('account.cargoFallback')}
                  {item.amount > 0 ? ` · ${formatMoney(item.amount)}` : ''}
                </Text>
                <Text style={styles.when}>{formatWhen(item.at)}</Text>
              </View>
            );
          })}
          {page < totalPages ? (
            <Pressable
              style={({ pressed }) => [
                styles.moreBtn,
                pressed && !loadingMore && styles.pressed,
              ]}
              disabled={loadingMore}
              onPress={() => {
                void loadMore();
              }}
            >
              {loadingMore ? (
                <ActivityIndicator color={ACCENT} />
              ) : (
                <Text style={styles.moreText}>{t('account.loadMore')}</Text>
              )}
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    marginTop: 4,
  },
  moreText: {
    color: ACCENT,
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  cardHanded: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cardReturned: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
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
  badgeHanded: {
    backgroundColor: '#DCFCE7',
    color: GREEN,
  },
  badgeReturned: {
    backgroundColor: '#FEE2E2',
    color: RED,
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
  when: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  pressed: {
    opacity: 0.88,
  },
});
