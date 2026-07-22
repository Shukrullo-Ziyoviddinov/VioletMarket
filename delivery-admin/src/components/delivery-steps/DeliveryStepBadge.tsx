import { StyleSheet, Text, View } from 'react-native';

import {
  getStepBadgeLabel,
  isSellerPhase,
} from '@/utils/deliveryOrderSteps';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

type DeliveryStepBadgeProps = {
  order: DeliveryAcceptedOrder;
};

export function DeliveryStepBadge({ order }: DeliveryStepBadgeProps) {
  const sellerPhase = isSellerPhase(order);
  return (
    <View
      style={[
        styles.badge,
        sellerPhase ? styles.badgeSeller : styles.badgeCustomer,
      ]}>
      <Text
        style={[
          styles.text,
          sellerPhase ? styles.textSeller : styles.textCustomer,
        ]}>
        {getStepBadgeLabel(order)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeSeller: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  badgeCustomer: {
    backgroundColor: '#EDF9F0',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
  textSeller: {
    color: '#C2410C',
  },
  textCustomer: {
    color: '#15803D',
  },
});
