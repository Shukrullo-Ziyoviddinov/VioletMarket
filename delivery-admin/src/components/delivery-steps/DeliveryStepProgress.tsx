import { StyleSheet, Text, View } from 'react-native';

import {
  getStepProgress,
  isSellerPhase,
} from '@/utils/deliveryOrderSteps';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

type DeliveryStepProgressProps = {
  order: DeliveryAcceptedOrder;
};

const SELLER_STEPS = ['Ketaman', 'Keldim', 'Oldim'] as const;
const CUSTOMER_STEPS = ['Ketaman', 'Keldim', 'Topshir'] as const;

export function DeliveryStepProgress({ order }: DeliveryStepProgressProps) {
  const sellerActive = isSellerPhase(order);
  const { sellerDone, customerDone } = getStepProgress(order);
  const labels = sellerActive ? SELLER_STEPS : CUSTOMER_STEPS;
  const done = sellerActive ? sellerDone : customerDone;
  const activeColor = sellerActive ? '#C2410C' : '#15803D';
  const currentIndex = Math.min(done, labels.length - 1);

  return (
    <View style={styles.wrap}>
      {labels.map((label, index) => {
        const completed = index < done;
        const current = index === currentIndex && done < labels.length;
        const filled = completed || current;

        return (
          <View key={label} style={styles.step}>
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
}

const styles = StyleSheet.create({
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
