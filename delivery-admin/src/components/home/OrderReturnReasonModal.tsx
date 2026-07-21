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

type OrderReturnReasonModalProps = {
  visible: boolean;
  isPaid: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: { reasonType: ReturnReasonType; comment: string }) => void;
};

export function OrderReturnReasonModal({
  visible,
  isPaid,
  submitting = false,
  onClose,
  onSubmit,
}: OrderReturnReasonModalProps) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!visible) setComment('');
  }, [visible]);

  const handleSubmit = (reasonType: ReturnReasonType) => {
    if (submitting) return;
    if (reasonType === 'no_answer' && !isPaid) return;
    onSubmit({ reasonType, comment: comment.trim() });
  };

  return (
    <MiniGlobalModal
      visible={visible}
      title="Mahsulot nima sababdan qaytarilmoqda"
      onCancel={() => {
        if (!submitting) onClose();
      }}
      footer={
        <>
          <Pressable
            disabled={submitting || !isPaid}
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              (!isPaid || submitting) && styles.disabledButton,
              pressed && isPaid && !submitting && styles.secondaryPressed,
            ]}
            onPress={() => handleSubmit('no_answer')}>
            {submitting ? (
              <ActivityIndicator color="#DC2626" />
            ) : (
              <Text
                style={[
                  styles.secondaryText,
                  !isPaid && styles.disabledText,
                ]}>
                Javob bermadi
              </Text>
            )}
          </Pressable>
          <Pressable
            disabled={submitting}
            style={({ pressed }) => [
              styles.button,
              styles.primaryButton,
              submitting && styles.disabledButton,
              pressed && !submitting && styles.primaryPressed,
            ]}
            onPress={() => handleSubmit('return')}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Qaytarish</Text>
            )}
          </Pressable>
        </>
      }>
      {!isPaid ? (
        <Text style={styles.paidHint}>
          To‘lov qilinmagan buyurtmada faqat «Qaytarish» ishlaydi. «Javob
          bermadi» faqat to‘lov qilingan buyurtmada.
        </Text>
      ) : null}
      <Text style={styles.hint}>Izoh</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        editable={!submitting}
        placeholder="Nima sababdan javob bermadi / qaytarilmoqda..."
        placeholderTextColor="#9CA3AF"
        multiline
        textAlignVertical="top"
        style={styles.input}
      />
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
  disabledText: {
    color: '#9CA3AF',
  },
});
