import { Pressable, StyleSheet, Text, View } from 'react-native';

export type UzbCargoPaymentFilterValue = 'all' | 'paid' | 'unpaid';

type Props = {
  value: UzbCargoPaymentFilterValue;
  onChange: (value: UzbCargoPaymentFilterValue) => void;
};

const FILTERS: Array<{
  key: UzbCargoPaymentFilterValue;
  label: string;
}> = [
  { key: 'all', label: 'Barchasi' },
  { key: 'paid', label: 'To‘langan' },
  { key: 'unpaid', label: 'To‘lanmagan' },
];

export function UzbCargoPaymentFilter({ value, onChange }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.filter} accessibilityRole="tablist">
        {FILTERS.map((item) => {
          const active = item.key === value;

          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(item.key)}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 2,
    backgroundColor: '#F8FAFC',
  },
  filter: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    backgroundColor: '#F3E8FF',
  },
  option: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: '#7C3AED',
  },
  optionPressed: {
    opacity: 0.82,
  },
  label: {
    color: '#6B21A8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
