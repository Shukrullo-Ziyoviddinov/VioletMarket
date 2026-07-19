import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

type AcceptedOrderCardProps = {
  order: DeliveryAcceptedOrder;
  onBuildRoute?: (order: DeliveryAcceptedOrder) => void;
};

function formatAmount(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  const text = String(value || '').trim();
  if (!text) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

export function AcceptedOrderCard({
  order,
  onBuildRoute,
}: AcceptedOrderCardProps) {
  const address = order.deliveryAddress || {
    city: '',
    district: '',
    addressLine: '',
    placeType: '',
    entrance: '',
    floor: '',
    domofon: '',
    courierNote: '',
    coords: null,
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.barcode}>{order.barcode || order.productCode}</Text>
        <Text style={styles.amount}>{formatAmount(order.amount)}</Text>
      </View>

      <View style={styles.addressBlock}>
        <View style={styles.addressHead}>
          <Ionicons name="location" size={16} color="#6D28D9" />
          <Text style={styles.addressTitle} numberOfLines={2}>
            {address.addressLine ||
              [address.city, address.district].filter(Boolean).join(', ') ||
              'Manzil ko‘rsatilmagan'}
          </Text>
        </View>

        <View style={styles.detailsGrid}>
          <DetailRow label="Uy" value={address.placeType} />
          <DetailRow label="Yo‘lak" value={address.entrance} />
          <DetailRow label="Qavat" value={address.floor} />
          <DetailRow label="Domofon" value={address.domofon} />
        </View>

        {address.courierNote ? (
          <DetailRow label="Izoh" value={address.courierNote} />
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.countWrap}>
          <Ionicons name="cube-outline" size={16} color="#6D28D9" />
          <Text style={styles.count}>{order.productCount} mahsulot</Text>
        </View>
        {address.district ? (
          <Text style={styles.district} numberOfLines={1}>
            {address.district}
          </Text>
        ) : null}
      </View>

      <Pressable
        style={({ pressed }) => [styles.routeButton, pressed && styles.pressed]}
        onPress={() => onBuildRoute?.(order)}>
        <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
        <Text style={styles.routeText}>Mashrut tuzish</Text>
      </Pressable>
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
    justifyContent: 'space-between',
    gap: 12,
  },
  barcode: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  amount: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  addressBlock: {
    gap: 10,
    backgroundColor: '#F8F5FF',
    borderRadius: 14,
    padding: 12,
  },
  addressHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressTitle: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailLabel: {
    width: 72,
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  district: {
    flex: 1,
    textAlign: 'right',
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '700',
  },
  routeButton: {
    marginTop: 2,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#6D28D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  routeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
  },
});
