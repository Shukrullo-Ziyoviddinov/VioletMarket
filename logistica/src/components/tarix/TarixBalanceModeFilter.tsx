import { Pressable, StyleSheet, Text, View } from 'react-native';

export type TarixBalanceMode = 'month' | 'week';

type Props = {
  value: TarixBalanceMode;
  onChange: (value: TarixBalanceMode) => void;
};

const OPTIONS: Array<{ key: TarixBalanceMode; label: string }> = [
  { key: 'month', label: 'Oy' },
  { key: 'week', label: 'Hafta' },
];

export function TarixBalanceModeFilter({ value, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {OPTIONS.map((item) => {
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
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
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
    gap: 6,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  option: {
    flex: 1,
    minHeight: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: '#7C3AED',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B21A8',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
});
