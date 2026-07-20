import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { GlobalBottomSheet } from '@/components/GlobalBottomSheet';
import {
  formatIncomeAmount,
  pickerTitle,
  type IncomePeriod,
  type IncomePeriodOption,
} from '@/components/income/income-period';

type IncomePeriodPickerSheetProps = {
  visible: boolean;
  period: IncomePeriod | null;
  options: IncomePeriodOption[];
  selectedKey: string;
  onClose: () => void;
  onSelect: (key: string) => void;
};

export function IncomePeriodPickerSheet({
  visible,
  period,
  options,
  selectedKey,
  onClose,
  onSelect,
}: IncomePeriodPickerSheetProps) {
  if (!period) return null;

  return (
    <GlobalBottomSheet
      visible={visible}
      title={pickerTitle(period)}
      onClose={onClose}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        bounces
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled">
        {options.map((option) => {
          const active = option.key === selectedKey;
          return (
            <Pressable
              key={option.key}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => onSelect(option.key)}>
              <View style={styles.optionTextCol}>
                <Text
                  style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {option.label}
                </Text>
                <Text style={styles.optionMeta}>
                  {option.count} ta buyurtma
                </Text>
              </View>
              <Text
                style={[styles.optionIncome, active && styles.optionIncomeActive]}>
                {formatIncomeAmount(option.income)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </GlobalBottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 420,
  },
  list: {
    gap: 8,
    paddingBottom: 16,
  },
  option: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionActive: {
    borderColor: '#6d32c5',
    backgroundColor: '#F3E8FF',
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  optionLabelActive: {
    color: '#6d32c5',
  },
  optionMeta: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  optionIncome: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '800',
  },
  optionIncomeActive: {
    color: '#6d32c5',
  },
});
