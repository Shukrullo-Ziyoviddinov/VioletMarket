import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  requestCode: string;
  productCode: string;
  productTitle: string;
  storeName: string;
  orderId: number;
  amount: number;
  at: string | null;
};

function formatMoney(value: number) {
  return `${Math.max(0, value || 0).toLocaleString('uz-UZ')} so‘m`;
}

function formatWhen(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BalancePaymentCard({
  requestCode,
  productCode,
  productTitle,
  storeName,
  orderId,
  amount,
  at,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.codeWrap}>
          <Ionicons name="barcode-outline" size={18} color="#7C3AED" />
          <Text style={styles.code} numberOfLines={1}>
            {requestCode || productCode || '—'}
          </Text>
        </View>
        <Text style={styles.amount}>{formatMoney(amount)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {productTitle || 'Mahsulot'}
      </Text>
      <Text style={styles.meta}>
        {storeName || 'Siller'} · #{orderId || 0}
      </Text>

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
