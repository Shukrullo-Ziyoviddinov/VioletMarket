import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GlobalBottomSheet } from '@/components/GlobalBottomSheet';
import { calcCashChange, parseMoneyInput } from '@/utils/cashChange';
import { formatOrderMoney } from '@/utils/orderPayment';

export type CollectCashPaymentMode = 'customer' | 'seller';

type CollectCashPaymentSheetProps = {
  visible: boolean;
  dueAmount: number;
  mode?: CollectCashPaymentMode;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    receivedAmount: number;
    changeAmount: number;
  }) => void;
};

const MODE_COPY: Record<
  CollectCashPaymentMode,
  { title: string; inputLabel: string; hint: string }
> = {
  customer: {
    title: 'To‘lovni olish',
    inputLabel: 'Mahsulot narxini kiriting',
    hint: 'Mijozdan olingan summani kiriting. Qaytim avtomatik hisoblanadi.',
  },
  seller: {
    title: 'Sotuvchidan to‘lovni olish',
    inputLabel: 'Mahsulot narxini kiriting',
    hint: 'Sotuvchidan qaytarib olingan summani kiriting. Qaytim avtomatik hisoblanadi.',
  },
};

export function CollectCashPaymentSheet({
  visible,
  dueAmount,
  mode = 'customer',
  loading = false,
  onClose,
  onConfirm,
}: CollectCashPaymentSheetProps) {
  const [rawInput, setRawInput] = useState('');
  const copy = MODE_COPY[mode] || MODE_COPY.customer;

  useEffect(() => {
    if (visible) setRawInput('');
  }, [visible]);

  const received = useMemo(() => parseMoneyInput(rawInput), [rawInput]);
  const result = useMemo(
    () => calcCashChange(dueAmount, received),
    [dueAmount, received],
  );

  const canSubmit = result.canConfirm && !loading && received != null;

  return (
    <GlobalBottomSheet
      visible={visible}
      title={copy.title}
      onClose={() => {
        if (!loading) onClose();
      }}>
      <View style={styles.body}>
        <Text style={styles.inputLabel}>{copy.inputLabel}</Text>
        <TextInput
          style={styles.input}
          value={rawInput}
          onChangeText={setRawInput}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#9CA3AF"
          editable={!loading}
        />

        <View style={styles.summaryRow}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Umumiy</Text>
            <Text style={styles.summaryDue}>
              {formatOrderMoney(result.dueAmount)}
            </Text>
          </View>
          <View style={[styles.summaryCell, styles.summaryRight]}>
            <Text style={styles.summaryLabel}>Qaytarish</Text>
            <Text style={styles.summaryChange}>
              {formatOrderMoney(result.changeAmount)}
            </Text>
          </View>
        </View>

        {result.isShort ? (
          <Text style={styles.hintError}>
            Summa mahsulot narxidan kam bo‘lmasligi kerak
          </Text>
        ) : (
          <Text style={styles.hint}>{copy.hint}</Text>
        )}

        <Pressable
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.confirmBtn,
            pressed && canSubmit && styles.pressed,
            !canSubmit && styles.disabled,
          ]}
          onPress={() => {
            if (!canSubmit || received == null) return;
            onConfirm({
              receivedAmount: result.receivedAmount,
              changeAmount: result.changeAmount,
            });
          }}>
          <Text style={styles.confirmText}>
            {loading ? '...' : 'Tasdiqlash'}
          </Text>
        </Pressable>
      </View>
    </GlobalBottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
    paddingBottom: 8,
  },
  inputLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  summaryCell: {
    flex: 1,
    gap: 4,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryDue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  summaryChange: {
    color: '#15803D',
    fontSize: 15,
    fontWeight: '800',
  },
  hint: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  hintError: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  confirmBtn: {
    marginTop: 4,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#6d32c5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.45,
  },
});
