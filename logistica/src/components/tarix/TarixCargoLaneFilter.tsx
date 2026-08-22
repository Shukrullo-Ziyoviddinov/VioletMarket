import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export type TarixCargoLaneFilterValue = 'all' | 'standard' | 'express';

type Props = {
  value: TarixCargoLaneFilterValue;
  onChange: (next: TarixCargoLaneFilterValue) => void;
};

const OPTIONS: TarixCargoLaneFilterValue[] = ['all', 'standard', 'express'];

export function TarixCargoLaneFilter({ value, onChange }: Props) {
  const { t } = useTranslation();

  const labelFor = (option: TarixCargoLaneFilterValue) => {
    if (option === 'standard') return t('history.filterStandard');
    if (option === 'express') return t('history.filterExpress');
    return t('history.filterAll');
  };

  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = value === option;
        return (
          <Pressable
            key={option}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.pressed,
            ]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {labelFor(option)}
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
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  chipText: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.88,
  },
});
