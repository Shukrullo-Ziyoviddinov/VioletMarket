import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
  weekBalance: number;
  monthBalance: number;
  weekLabel: string;
  monthLabel: string;
  loading?: boolean;
};

function formatMoney(value: number) {
  return `${Math.max(0, value || 0).toLocaleString('uz-UZ')} so‘m`;
}

export function BalanceAmountCards({
  weekBalance,
  monthBalance,
  weekLabel,
  monthLabel,
  loading = false,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.card, styles.weekCard]}>
        <View style={[styles.icon, styles.weekIcon]}>
          <Ionicons name="calendar-outline" size={20} color="#2563EB" />
        </View>
        <Text style={styles.label}>Haftalik balans</Text>
        {loading ? (
          <ActivityIndicator color="#2563EB" />
        ) : (
          <Text style={styles.amount}>{formatMoney(weekBalance)}</Text>
        )}
        <Text style={styles.period} numberOfLines={2}>
          {weekLabel || 'Joriy hafta'}
        </Text>
      </View>

      <View style={[styles.card, styles.monthCard]}>
        <View style={[styles.icon, styles.monthIcon]}>
          <Ionicons name="wallet-outline" size={20} color="#7C3AED" />
        </View>
        <Text style={styles.label}>Oylik balans</Text>
        {loading ? (
          <ActivityIndicator color="#7C3AED" />
        ) : (
          <Text style={styles.amount}>{formatMoney(monthBalance)}</Text>
        )}
        <Text style={styles.period} numberOfLines={2}>
          {monthLabel || 'Joriy oy'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    minHeight: 154,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 7,
  },
  weekCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  monthCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekIcon: {
    backgroundColor: '#DBEAFE',
  },
  monthIcon: {
    backgroundColor: '#EDE9FE',
  },
  label: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  amount: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '900',
  },
  period: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});
