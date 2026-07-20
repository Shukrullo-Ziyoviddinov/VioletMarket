import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import {
  formatDistanceKm,
  formatIncomeAmount,
  formatIncomeDateTime,
  resolveDistrict,
  resolveProductTitle,
} from '@/components/income/income-period';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

type IncomeOrderCardProps = {
  order: DeliveryAcceptedOrder;
};

export function IncomeOrderCard({ order }: IncomeOrderCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.barcode}>
          {order.barcode || order.productCode || '—'}
        </Text>
        <Text style={styles.payment}>
          {formatIncomeAmount(order.courierPayment ?? 0)}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {resolveProductTitle(order)}
      </Text>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={15} color="#6d32c5" />
        <Text style={styles.meta} numberOfLines={1}>
          Toshkent · {resolveDistrict(order)}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.row}>
          <Ionicons name="navigate-outline" size={15} color="#6B7280" />
          <Text style={styles.meta}>{formatDistanceKm(order.distanceKm)}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={15} color="#6B7280" />
          <Text style={styles.meta}>
            {formatIncomeDateTime(order.deliveredAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  barcode: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  payment: {
    color: '#6d32c5',
    fontSize: 15,
    fontWeight: '900',
  },
  title: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  meta: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
});
