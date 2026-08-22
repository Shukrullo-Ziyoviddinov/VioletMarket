import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { localeForLanguage } from '@/i18n';
import { TarixCargoServiceBadge } from '@/components/tarix/TarixCargoServiceBadge';

type Props = {
  requestCode: string;
  productCode: string;
  productTitle: string;
  storeName: string;
  orderId: number;
  amount: number;
  at: string | null;
  cargoServiceType?: 'standard' | 'express' | null;
};

export function BalancePaymentCard({
  requestCode,
  productCode,
  productTitle,
  storeName,
  orderId,
  amount,
  at,
  cargoServiceType,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.language);

  const formatMoney = (value: number) =>
    `${Math.max(0, value || 0).toLocaleString(locale)} ${t('common.sum')}`;

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

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.codeWrap}>
          <Ionicons name="barcode-outline" size={18} color="#7C3AED" />
          <Text style={styles.code} numberOfLines={1}>
            {requestCode || productCode || t('account.dash')}
          </Text>
        </View>
        <Text style={styles.amount}>{formatMoney(amount)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {productTitle || t('common.product')}
      </Text>
      <Text style={styles.meta}>
        {storeName || t('account.sellerFallback')} · #{orderId || 0}
      </Text>
      <TarixCargoServiceBadge value={cargoServiceType} style={styles.laneBadge} />

      <View style={styles.dateRow}>
        <Ionicons name="time-outline" size={15} color="#9CA3AF" />
        <Text style={styles.date}>{formatWhen(at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 7,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  codeWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  code: {
    flex: 1,
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '800',
  },
  amount: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '900',
  },
  title: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  meta: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  laneBadge: {
    alignSelf: 'flex-start',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  date: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
});
