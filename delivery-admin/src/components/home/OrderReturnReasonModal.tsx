import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { MiniGlobalModal } from '@/components/MiniGlobalModal';
import type { ReturnReasonType } from '@/services/delivery-orders';

export type OrderReturnModalMode = 'request' | 'confirm';

type OrderReturnReasonModalProps = {
  visible: boolean;
  isPaid: boolean;
  submitting?: boolean;
  /** request = admin so‘rovi; confirm = admin tanlagan tugma */
  mode?: OrderReturnModalMode;
  /** confirm rejimida faqat shu tur aktiv */
  approvedReasonType?: ReturnReasonType | null;
  onClose: () => void;
  onSubmitRequest?: (payload: { comment: string }) => void;
  onSubmitReason?: (payload: { reasonType: ReturnReasonType }) => void;
};

export function OrderReturnReasonModal({
  visible,
  isPaid,
  submitting = false,
  mode = 'request',
  approvedReasonType = null,
  onClose,
  onSubmitRequest,
  onSubmitReason,
}: OrderReturnReasonModalProps) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!visible) setComment('');
  }, [visible]);

  const isConfirm = mode === 'confirm';
  const title = isConfirm
    ? 'Admin tasdiqlagan qaytarish'
    : 'Qaytarish so‘rovi';

  const reasonEnabled = (reasonType: ReturnReasonType) => {
    if (submitting) return false;
    if (approvedReasonType != null && approvedReasonType !== reasonType) {
      return false;
    }
    if (reasonType === 'no_answer' && !isPaid) return false;
    return true;
  };

  const approvedLabel =
    approvedReasonType === 'no_answer'
      ? 'Javob bermadi'
      : approvedReasonType === 'defective'
        ? 'Yaroqsiz'
        : approvedReasonType === 'return'
          ? 'Qaytarish'
          : '';

  const handleReason = (reasonType: ReturnReasonType) => {
    if (!reasonEnabled(reasonType)) return;
    onSubmitReason?.({ reasonType });
  };

  const handleRequest = () => {
    if (submitting) return;
    onSubmitRequest?.({ comment: comment.trim() });
  };

  return (
    <MiniGlobalModal
      visible={visible}
      title={title}
      onCancel={() => {
        if (!submitting) onClose();
      }}
      footer={
        isConfirm ? (
          <>
            <Pressable
              disabled={!reasonEnabled('no_answer')}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                !reasonEnabled('no_answer') && styles.disabledButton,
                pressed && reasonEnabled('no_answer') && styles.secondaryPressed,
              ]}
              onPress={() => handleReason('no_answer')}>
              {submitting && approvedReasonType === 'no_answer' ? (
                <ActivityIndicator color="#DC2626" />
              ) : (
                <Text
                  style={[
                    styles.secondaryText,
                    !reasonEnabled('no_answer') && styles.disabledText,
                  ]}>
                  Javob bermadi
                </Text>
              )}
            </Pressable>
            <Pressable
              disabled={!reasonEnabled('return')}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                !reasonEnabled('return') && styles.disabledButton,
                pressed && reasonEnabled('return') && styles.primaryPressed,
              ]}
              onPress={() => handleReason('return')}>
              {submitting && approvedReasonType === 'return' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.primaryText,
                    !reasonEnabled('return') && styles.disabledText,
                  ]}>
                  Qaytarish
                </Text>
              )}
            </Pressable>
            <Pressable
              disabled={!reasonEnabled('defective')}
              style={({ pressed }) => [
                styles.button,
                styles.defectiveButton,
                !reasonEnabled('defective') && styles.disabledButton,
                pressed && reasonEnabled('defective') && styles.defectivePressed,
              ]}
              onPress={() => handleReason('defective')}>
              {submitting && approvedReasonType === 'defective' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.defectiveText,
                    !reasonEnabled('defective') && styles.disabledText,
                  ]}>
                  Yaroqsiz
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <Pressable
            disabled={submitting}
            style={({ pressed }) => [
              styles.button,
              styles.primaryButton,
              styles.fullButton,
              submitting && styles.disabledButton,
              pressed && !submitting && styles.primaryPressed,
            ]}
            onPress={handleRequest}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>So‘rov yuborish</Text>
            )}
          </Pressable>
        )
      }>
      {isConfirm ? (
        <Text style={styles.paidHint}>
          Faqat admin tanlagan tugma ishlaydi
          {approvedLabel ? `: ${approvedLabel}` : ''}.
        </Text>
      ) : (
        <>
          <Text style={styles.paidHint}>
            So‘rov asosiy adminga yuboriladi. Tasdiqlanguncha qaytarish
            tugmalari ochilmaydi.
          </Text>
          <Text style={styles.hint}>Izoh</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            editable={!submitting}
            placeholder="Nima sababdan qaytarilishi kerak..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            style={styles.input}
          />
        </>
      )}
    </MiniGlobalModal>
  );
}

const styles = StyleSheet.create({
  paidHint: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hint: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#F9FAFB',
  },
  button: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingHorizontal: 8,
  },
  fullButton: {
    flex: 1,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  secondaryPressed: {
    backgroundColor: '#FEE2E2',
  },
  primaryButton: {
    backgroundColor: '#DC2626',
  },
  primaryPressed: {
    backgroundColor: '#B91C1C',
  },
  defectiveButton: {
    backgroundColor: '#52525B',
  },
  defectivePressed: {
    backgroundColor: '#3F3F46',
  },
  disabledButton: {
    opacity: 0.45,
  },
  secondaryText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  defectiveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabledText: {
    color: '#9CA3AF',
  },
});
