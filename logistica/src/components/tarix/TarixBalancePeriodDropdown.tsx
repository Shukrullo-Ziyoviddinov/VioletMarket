import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

export type TarixBalancePeriodOption = {
  key: string;
  label: string;
};

type Props = {
  open: boolean;
  options: TarixBalancePeriodOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
};

export function TarixBalancePeriodDropdown({
  open,
  options,
  selectedKey,
  onSelect,
}: Props) {
  if (!open) return null;

  return (
    <ScrollView
      style={styles.dropdown}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {options.map((option) => {
        const active = option.key === selectedKey;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            style={({ pressed }) => [
              styles.option,
              active && styles.optionActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.optionText, active && styles.optionTextActive]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  optionActive: {
    backgroundColor: '#F5F3FF',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  optionTextActive: {
    color: '#6D28D9',
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.88,
  },
});
