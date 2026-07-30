import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type UzbCargoPaymentFilterValue = 'all' | 'paid' | 'unpaid';

type Props = {
  value: UzbCargoPaymentFilterValue;
  onChange: (value: UzbCargoPaymentFilterValue) => void;
};

const FILTER_KEYS: UzbCargoPaymentFilterValue[] = ['all', 'paid', 'unpaid'];

export function UzbCargoPaymentFilter({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.filter} accessibilityRole="tablist">
        {FILTER_KEYS.map((key) => {
          const active = key === value;

          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(key)}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {t(`shipments.filters.${key}`)}
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
