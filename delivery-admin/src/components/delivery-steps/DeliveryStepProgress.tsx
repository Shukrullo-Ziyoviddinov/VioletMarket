import { StyleSheet, Text, View } from 'react-native';

import { DeliveryStepBadge } from '@/components/delivery-steps/DeliveryStepBadge';
import {
  getStepProgress,
  isReturnPhase,
  isSellerPhase,
} from '@/utils/deliveryOrderSteps';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

type DeliveryStepProgressProps = {
  order: DeliveryAcceptedOrder;
  /** Badge + progress bir blokda */
  withBadge?: boolean;
};

const SELLER_STEPS = ['Ketdim', 'Keldim', 'Oldim'] as const;
const CUSTOMER_STEPS = ['Ketdim', 'Keldim', 'Topshirish'] as const;
const RETURN_STEPS = ['Ketdim', 'Keldim', 'Qaytardim'] as const;

export function DeliveryStepProgress({
  order,
  withBadge = false,
}: DeliveryStepProgressProps) {
  const returnActive = isReturnPhase(order);
  const sellerActive = !returnActive && isSellerPhase(order);
  const { sellerDone, customerDone, returnDone } = getStepProgress(order);

  const labels = returnActive
    ? RETURN_STEPS
    : sellerActive
      ? SELLER_STEPS
      : CUSTOMER_STEPS;
  const done = returnActive
    ? returnDone
    : sellerActive
      ? sellerDone
      : customerDone;
  const activeColor = returnActive
    ? '#DC2626'
    : sellerActive
      ? '#C2410C'
      : '#15803D';
  const currentIndex = Math.min(done, labels.length - 1);

  const progress = (
    <View style={styles.wrap}>
      {labels.map((label, index) => {
        const completed = index < done;
        const current = index === currentIndex && done < labels.length;
        const filled = completed || current;

        return (
          <View key={`${label}-${index}`} style={styles.step}>
            <View
              style={[
                styles.dot,
                filled ? { backgroundColor: activeColor } : styles.dotIdle,
                current && !completed ? styles.dotCurrent : null,
              ]}
            />
            <Text
              style={[
                styles.label,
                filled ? { color: activeColor } : styles.labelIdle,
              ]}
              numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  if (!withBadge) return progress;

  return (
    <View style={styles.block}>
      <DeliveryStepBadge order={order} />
      {progress}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  dotIdle: {
    backgroundColor: '#E5E7EB',
  },
  dotCurrent: {
    width: 10,
    height: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  labelIdle: {
    color: '#9CA3AF',
  },
});
