import { StyleSheet, Text, View } from 'react-native';

import {
  formatOrderMoney,
  resolveOrderPaid,
} from '@/utils/orderPayment';

type OrderPaymentNoticeProps = {
  amount: number;
  isPaid?: boolean;
  paymentStatus?: string;
  /** seller = olish bosqichi; customer = yetkazish bosqichi */
  variant: 'seller' | 'customer';
};

/**
 * Ish stoli: to‘lov eslatmasi.
 * seller — to‘langan bo‘lsa yashil matn, aks holda «To'lov qilish» + qizil summa
 * customer — faqat naqd (to‘lanmagan): «To'lovni olish» + yashil summa; to‘langan → yashirin
 */
export function OrderPaymentNotice({
  amount,
  isPaid,
  paymentStatus,
  variant,
}: OrderPaymentNoticeProps) {
  const paid = resolveOrderPaid({ isPaid, paymentStatus });

  if (variant === 'customer') {
    if (paid) return null;
    return (
      <View style={[styles.card, styles.cardCollect]}>
        <Text style={styles.label}>To‘lovni olish</Text>
        <Text style={styles.amountGreen}>{formatOrderMoney(amount)}</Text>
      </View>
    );
  }

  if (paid) {
    return (
      <View style={[styles.card, styles.cardPaid]}>
        <Text style={styles.paidMessage}>
          Buyurtma uchun to‘lov qilish shart emas
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Buyurtma uchun to‘lov</Text>
      <View style={styles.row}>
        <Text style={styles.label}>To‘lov qilish</Text>
        <Text style={styles.amountRed}>{formatOrderMoney(amount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  cardPaid: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  cardCollect: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  amountRed: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '800',
  },
  amountGreen: {
    color: '#15803D',
    fontSize: 15,
    fontWeight: '800',
  },
  paidMessage: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
