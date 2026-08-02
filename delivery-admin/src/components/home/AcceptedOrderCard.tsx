import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DeliveryStepBadge } from '@/components/delivery-steps/DeliveryStepBadge';
import { OrderPaymentAmount } from '@/components/payment/OrderPaymentAmount';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';
import { isSellerPhase } from '@/utils/deliveryOrderSteps';

type AcceptedOrderCardProps = {
  order: DeliveryAcceptedOrder;
  onStartWork: (order: DeliveryAcceptedOrder) => void;
};

export function AcceptedOrderCard({
  order,
  onStartWork,
}: AcceptedOrderCardProps) {
  const sellerPhase = isSellerPhase(order);
  const seller = order.sellerPickup;
  const isGroup = Boolean(order.isGroup) || (order.productCount || 1) > 1;
  const productCodes = Array.isArray(order.productCodes)
    ? order.productCodes.filter(Boolean)
    : String(order.barcode || order.productCode || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
  const address = order.deliveryAddress || {
    city: '',
    district: '',
    addressLine: '',
  };

  const addressTitle = sellerPhase
    ? String(seller?.address || '').trim() ||
      String(seller?.name || '').trim() ||
      (order.pickupKind === 'warehouse' ||
      seller?.pickupKind === 'warehouse'
        ? 'Ombor manzili ko‘rsatilmagan'
        : 'Sotuvchi manzili ko‘rsatilmagan')
    : address.addressLine ||
      [address.city, address.district].filter(Boolean).join(', ') ||
      'Manzil ko‘rsatilmagan';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onStartWork(order)}>
      <View style={styles.topRow}>
        <View style={styles.codesWrap}>
          {isGroup && productCodes.length > 1 ? (
            productCodes.map((code) => (
              <Text key={code} style={styles.barcode}>
                {code}
              </Text>
            ))
          ) : (
            <Text style={styles.barcode} numberOfLines={1}>
              {productCodes[0] || order.barcode || order.productCode}
            </Text>
          )}
        </View>
        <OrderPaymentAmount
          amount={order.amount}
          isPaid={order.isPaid}
          paymentMethod={order.paymentMethod}
          paymentStatus={order.paymentStatus}
          size="sm"
        />
      </View>

      {isGroup ? (
        <Text style={styles.productCount}>
          {order.productCount || productCodes.length || 1} ta mahsulot
        </Text>
      ) : null}

      <DeliveryStepBadge order={order} />

      {sellerPhase && seller?.name ? (
        <Text style={styles.sellerName} numberOfLines={1}>
          {seller.name}
        </Text>
      ) : null}

      <View style={styles.addressRow}>
        <Ionicons
          name={
            sellerPhase
              ? order.pickupKind === 'warehouse' ||
                seller?.pickupKind === 'warehouse'
                ? 'business-outline'
                : 'storefront-outline'
              : 'location-outline'
          }
          size={15}
          color="#6d32c5"
        />
        <Text style={styles.addressText} numberOfLines={2}>
          {addressTitle}
        </Text>
      </View>

      <View style={styles.startButton}>
        <Text style={styles.startText}>Ishni boshlash</Text>
        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    shadowColor: '#4C1D95',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  codesWrap: {
    flex: 1,
    gap: 2,
  },
  barcode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  productCount: {
    color: '#6d32c5',
    fontSize: 13,
    fontWeight: '700',
  },
  sellerName: {
    color: '#56337d',
    fontSize: 13,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  addressText: {
    flex: 1,
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  startButton: {
    marginTop: 2,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#6d32c5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.92,
  },
});
