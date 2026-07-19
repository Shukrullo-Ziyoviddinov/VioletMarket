import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CourierNoteModal } from '@/components/home/CourierNoteModal';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

type AcceptedOrderCardProps = {
  order: DeliveryAcceptedOrder;
  onBuildRoute?: (order: DeliveryAcceptedOrder) => void;
  onOpenDetails?: (order: DeliveryAcceptedOrder) => void;
};

function formatAmount(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

function DetailCell({ label, value }: { label: string; value?: string }) {
  const text = String(value || '').trim() || '—';
  return (
    <View style={styles.detailCell}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export function AcceptedOrderCard({
  order,
  onBuildRoute,
  onOpenDetails,
}: AcceptedOrderCardProps) {
  const [noteOpen, setNoteOpen] = useState(false);
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
  const courierNote = String(address.courierNote || '').trim();

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

        <View style={styles.detailsRow}>
          <DetailCell label="Uy" value={address.placeType} />
          <DetailCell label="Yo‘lak" value={address.entrance} />
          <DetailCell label="Qavat" value={address.floor} />
          <DetailCell label="Domofon" value={address.domofon} />
        </View>
      </View>

      {courierNote ? (
        <Pressable
          style={({ pressed }) => [
            styles.noteTrigger,
            pressed && styles.pressed,
          ]}
          onPress={() => setNoteOpen(true)}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color="#6D28D9"
          />
          <Text style={styles.noteTriggerText}>Kuryer uchun izoh</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </Pressable>
      ) : null}

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

      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.routeButton,
            pressed && styles.pressed,
          ]}
          onPress={() => onBuildRoute?.(order)}>
          <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
          <Text style={styles.routeText}>Mashrut tuzish</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.infoButton,
            pressed && styles.pressed,
          ]}
          onPress={() => onOpenDetails?.(order)}>
          <Ionicons name="information-circle-outline" size={18} color="#6D28D9" />
          <Text style={styles.infoText}>Ma'lumot</Text>
        </Pressable>
      </View>

      <CourierNoteModal
        visible={noteOpen}
        note={courierNote}
        onClose={() => setNoteOpen(false)}
      />
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
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  detailCell: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  noteTrigger: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteTriggerText: {
    flex: 1,
    color: '#6D28D9',
    fontSize: 14,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  routeButton: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#6D28D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  routeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  infoButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#6D28D9',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  infoText: {
    color: '#6D28D9',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
  },
});
