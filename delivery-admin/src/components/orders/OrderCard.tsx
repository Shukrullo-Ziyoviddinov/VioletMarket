import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DeliveryAvailableOrder } from '@/types/delivery-order';

type OrderCardProps = {
  order: DeliveryAvailableOrder;
  accepting?: boolean;
  onAccept?: (order: DeliveryAvailableOrder) => void;
};

function formatAmount(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

function formatTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDistance(value: number | null) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value} km`;
}

export function OrderCard({ order, accepting = false, onAccept }: OrderCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.barcode}>{order.barcode || order.productCode}</Text>
        <View style={styles.districtWrap}>
          <Ionicons name="location" size={14} color="#6D28D9" />
          <Text style={styles.district} numberOfLines={1}>
            {order.district}
          </Text>
        </View>
        <View style={styles.distanceWrap}>
          <Ionicons name="navigate" size={13} color="#6D28D9" />
          <Text style={styles.distance}>{formatDistance(order.distanceKm)}</Text>
        </View>
      </View>

      <View style={styles.middleRow}>
        <View style={styles.countWrap}>
          <Ionicons name="cube-outline" size={16} color="#6D28D9" />
          <Text style={styles.count}>{order.productCount} mahsulot</Text>
        </View>
        <Text style={styles.amount}>{formatAmount(order.amount)}</Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.time}>
          Buyurtma vaqti: {formatTime(order.orderedAt)}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.acceptButton,
            (pressed || accepting) && styles.pressed,
          ]}
          disabled={accepting}
          onPress={() => onAccept?.(order)}>
          {accepting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.acceptText}>Qabul qilish</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: '#4C1D95',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barcode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  districtWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  district: {
    flex: 1,
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  distanceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distance: {
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '700',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  count: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  time: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  acceptButton: {
    minWidth: 110,
    minHeight: 40,
    backgroundColor: '#6D28D9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
