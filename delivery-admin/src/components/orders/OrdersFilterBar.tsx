import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type FilterChipProps = {
  label: string;
  onPress: () => void;
};

export function FilterChip({ label, onPress }: FilterChipProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
      onPress={onPress}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-down" size={16} color="#6B7280" />
    </Pressable>
  );
}

type OrdersFilterBarProps = {
  cityLabel: string;
  districtLabel: string;
  distanceLabel: string;
  onCityPress: () => void;
  onDistrictPress: () => void;
  onDistancePress: () => void;
  total: number;
};

export function OrdersFilterBar({
  cityLabel,
  districtLabel,
  distanceLabel,
  onCityPress,
  onDistrictPress,
  onDistancePress,
  total,
}: OrdersFilterBarProps) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <FilterChip label={cityLabel} onPress={onCityPress} />
        <FilterChip label={districtLabel} onPress={onDistrictPress} />
        <FilterChip label={distanceLabel} onPress={onDistancePress} />
      </View>
      <Text style={styles.count}>Topilgan buyurtmalar: {total} ta</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  label: {
    flex: 1,
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
  count: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
});
