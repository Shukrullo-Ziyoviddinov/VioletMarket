import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
  balance: number;
  count: number;
  periodLabel: string;
  loading?: boolean;
};

function formatMoney(value: number) {
  return `${Math.max(0, value || 0).toLocaleString('uz-UZ')} so'm`;
}

export function TarixBalanceSummary({
  balance,
  count,
  periodLabel,
  loading = false,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Balans</Text>
      {loading ? (
        <ActivityIndicator color="#7C3AED" style={styles.loader} />
      ) : (
        <>
          <Text style={styles.amount}>{formatMoney(balance)}</Text>
          <Text style={styles.meta}>
            {periodLabel}
            {count > 0 ? ` · ${count} ta topshirilgan` : ''}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  amount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  loader: {
    marginVertical: 10,
    alignSelf: 'flex-start',
  },
});
