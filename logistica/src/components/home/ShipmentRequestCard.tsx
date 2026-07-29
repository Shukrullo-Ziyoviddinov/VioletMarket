import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ShipmentRequest = {
  id: string;
  requestCode: string;
  storeName: string;
  dateTime: string;
  productCount: number;
  weightKg: number;
  weightLabel: 'Taxminiy og\'irlik' | 'Og\'irlik';
  cargoFeePaymentRequired?: boolean;
  adminCargoFeeConfirmedAt?: string | null;
};

const CARDBOARD = '#C4A484';

type Props = {
  item: ShipmentRequest;
  hrefBase?: '/shipment/[id]' | '/ish-stoli/[id]';
  showCargoPaymentStatus?: boolean;
};

export function ShipmentRequestCard({
  item,
  hrefBase = '/shipment/[id]',
  showCargoPaymentStatus = false,
}: Props) {
  const router = useRouter();
  const showPaymentBadge =
    showCargoPaymentStatus && item.cargoFeePaymentRequired;
  const isCargoPaymentConfirmed = Boolean(item.adminCargoFeeConfirmedAt);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() =>
        router.push({
          pathname: hrefBase,
          params: { id: item.id },
        })
      }
    >
      <View style={styles.left}>
        <View style={styles.boxIconWrap}>
          <Ionicons name="cube" size={36} color={CARDBOARD} />
        </View>
      </View>

      <View style={styles.middle}>
        <Text style={styles.requestCode} numberOfLines={1}>
          {item.requestCode}
        </Text>
        <Text style={styles.storeName} numberOfLines={1}>
          {item.storeName}
        </Text>
        <Text style={styles.dateTime}>{item.dateTime}</Text>
        <View style={styles.productBadge}>
          <Text style={styles.productBadgeText}>
            {item.productCount} ta mahsulot
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {showPaymentBadge ? (
          <View
            style={[
              styles.paymentBadge,
              isCargoPaymentConfirmed
                ? styles.paymentBadgePaid
                : styles.paymentBadgeUnpaid,
            ]}
          >
            <Text
              style={[
                styles.paymentBadgeText,
                isCargoPaymentConfirmed
                  ? styles.paymentBadgeTextPaid
                  : styles.paymentBadgeTextUnpaid,
              ]}
            >
              {isCargoPaymentConfirmed ? 'To‘landi' : 'To‘lanmagan'}
            </Text>
          </View>
        ) : null}
        <Text style={styles.weightLabel}>{item.weightLabel}</Text>
        <Text style={styles.weightValue}>{item.weightKg} kg</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    minHeight: 96,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
  left: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minWidth: 0,
  },
  requestCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A5F',
  },
  storeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  dateTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  productBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#F3E8FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  productBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  right: {
    width: 100,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  paymentBadge: {
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 2,
  },
  paymentBadgePaid: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  paymentBadgeUnpaid: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  paymentBadgeTextPaid: {
    color: '#15803D',
  },
  paymentBadgeTextUnpaid: {
    color: '#B91C1C',
  },
  weightLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  weightValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'right',
  },
});
