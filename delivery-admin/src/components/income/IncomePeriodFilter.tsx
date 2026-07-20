import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  INCOME_PERIODS,
  type IncomePeriod,
} from '@/components/income/income-period';

type IncomePeriodFilterProps = {
  value: IncomePeriod;
  onChange: (period: IncomePeriod) => void;
};

export function IncomePeriodFilter({ value, onChange }: IncomePeriodFilterProps) {
  return (
    <View style={styles.row}>
      {INCOME_PERIODS.map((item) => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(item.key)}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: '#6d32c5',
    backgroundColor: '#F3E8FF',
  },
  chipText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#6d32c5',
    fontWeight: '800',
  },
});
