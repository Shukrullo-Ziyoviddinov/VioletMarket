import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  formatIncomeAmount,
  type IncomePeriod,
} from '@/components/income/income-period';

type IncomeSummaryCardsProps = {
  period: IncomePeriod;
  dayIncome: number;
  weekIncome: number;
  monthIncome: number;
  onSelectPeriod?: (period: IncomePeriod) => void;
};

const CARDS: {
  key: IncomePeriod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    key: 'day',
    label: 'Kun daromati',
    icon: 'today-outline',
    color: '#16A34A',
  },
  {
    key: 'week',
    label: 'Hafta daromati',
    icon: 'calendar-outline',
    color: '#2563EB',
  },
  {
    key: 'month',
    label: 'Oy daromati',
    icon: 'calendar-number-outline',
    color: '#EA580C',
  },
];

export function IncomeSummaryCards({
  period,
  dayIncome,
  weekIncome,
  monthIncome,
  onSelectPeriod,
}: IncomeSummaryCardsProps) {
  const values: Record<IncomePeriod, number> = {
    day: dayIncome,
    week: weekIncome,
    month: monthIncome,
  };

  return (
    <View style={styles.grid}>
      {CARDS.map((card) => {
        const active = card.key === period;
        return (
          <Pressable
            key={card.key}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => onSelectPeriod?.(card.key)}>
            <View style={[styles.icon, { backgroundColor: `${card.color}18` }]}>
              <Ionicons name={card.icon} size={18} color={card.color} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.label}>{card.label}</Text>
              <Text style={styles.value} numberOfLines={1}>
                {formatIncomeAmount(values[card.key])}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  cardActive: {
    borderColor: '#6d32c5',
    backgroundColor: '#FAF5FF',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  value: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '900',
  },
});
