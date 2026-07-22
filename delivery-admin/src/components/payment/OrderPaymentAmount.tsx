import { StyleSheet, Text } from 'react-native';

import {
  formatOrderMoney,
  resolveOrderPaid,
} from '@/utils/orderPayment';

type OrderPaymentAmountProps = {
  amount: number;
  isPaid?: boolean;
  paymentMethod?: string;
  paymentStatus?: string;
  size?: 'sm' | 'md';
};

/**
 * Kartochkalardagi narx o‘rniga:
 * to‘langan → yashil «To'langan»
 * to‘lanmagan → qizil summa
 */
export function OrderPaymentAmount({
  amount,
  isPaid,
  paymentMethod,
  paymentStatus,
  size = 'md',
}: OrderPaymentAmountProps) {
  const paid = resolveOrderPaid({ isPaid, paymentMethod, paymentStatus });
  const textStyle = size === 'sm' ? styles.textSm : styles.textMd;

  if (paid) {
    return <Text style={[textStyle, styles.paid]}>To‘langan</Text>;
  }

  return (
    <Text style={[textStyle, styles.unpaid]}>{formatOrderMoney(amount)}</Text>
  );
}

const styles = StyleSheet.create({
  textMd: {
    fontSize: 16,
    fontWeight: '800',
  },
  textSm: {
    fontSize: 14,
    fontWeight: '800',
  },
  paid: {
    color: '#15803D',
  },
  unpaid: {
    color: '#DC2626',
  },
});
