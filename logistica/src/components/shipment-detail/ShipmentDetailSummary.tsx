import { StyleSheet, Text, View } from 'react-native';

type Props = {
  storeName: string;
  dateTime: string;
};

export function ShipmentDetailSummary({ storeName, dateTime }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.col}>
        <Text style={styles.label}>Seller</Text>
        <Text style={styles.value} numberOfLines={2}>
          {storeName}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.col}>
        <Text style={styles.label}>Sana</Text>
        <Text style={styles.value}>{dateTime}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  col: {
    flex: 1,
    gap: 6,
  },
  divider: {
    width: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 10,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
});
