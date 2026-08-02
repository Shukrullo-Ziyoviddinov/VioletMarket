import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WeightLabel } from '@/types/shipment';

export type ShipmentRequest = {
  id: string;
  requestCode: string;
  storeName: string;
  dateTime: string;
  productCount: number;
  weightKg: number;
  weightLabel: WeightLabel;
  cargoFeePaymentRequired?: boolean;
  adminCargoFeeConfirmedAt?: string | null;
  isGroup?: boolean;
  siblingIds?: string[];
};

const CARDBOARD = '#C4A484';

type Props = {
  item: ShipmentRequest;
  hrefBase?: '/shipment/[id]' | '/ish-stoli/[id]';
  showCargoPaymentStatus?: boolean;
};

function weightLabelKey(label: WeightLabel) {
  return label === "Og'irlik"
    ? 'shipments.weight.exact'
    : 'shipments.weight.estimated';
}

export function ShipmentRequestCard({
  item,
  hrefBase = '/shipment/[id]',
  showCargoPaymentStatus = false,
}: Props) {
  const { t } = useTranslation();
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
        <View style={styles.codeRow}>
          <Text style={styles.requestCode} numberOfLines={1}>
            {item.requestCode}
          </Text>
        </View>
        <Text style={styles.storeName} numberOfLines={1}>
          {item.storeName}
        </Text>
        <Text style={styles.dateTime}>{item.dateTime}</Text>
        <View style={styles.productBadge}>
          <Text style={styles.productBadgeText}>
            {t('common.productsCount', { count: item.productCount })}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.right,
          !showPaymentBadge ? styles.rightWithoutPayment : null,
        ]}
      >
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
              {isCargoPaymentConfirmed
                ? t('shipments.payment.paid')
                : t('shipments.payment.unpaid')}
            </Text>
          </View>
        ) : null}
        <Text style={styles.weightLabel}>
          {t(weightLabelKey(item.weightLabel))}
        </Text>
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
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestCode: {
    flexShrink: 1,
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
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    gap: 4,
  },
  rightWithoutPayment: {
    justifyContent: 'center',
  },
  paymentBadge: {
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
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
