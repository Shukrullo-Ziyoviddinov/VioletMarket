import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { MiniGlobalModal } from '@/components/MiniGlobalModal';

type OrderReturnReasonModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function OrderReturnReasonModal({
  visible,
  onClose,
}: OrderReturnReasonModalProps) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!visible) setComment('');
  }, [visible]);

  return (
    <MiniGlobalModal
      visible={visible}
      title="Mahsulot nima sababdan qaytarilmoqda"
      onCancel={onClose}
      footer={
        <>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              pressed && styles.secondaryPressed,
            ]}
            onPress={() => {
              // Keyingi qadam
            }}>
            <Text style={styles.secondaryText}>Javob bermadi</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.primaryButton,
              pressed && styles.primaryPressed,
            ]}
            onPress={() => {
              // Keyingi qadam
            }}>
            <Text style={styles.primaryText}>Qaytarish</Text>
          </Pressable>
        </>
      }>
      <Text style={styles.hint}>Izoh</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
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
});
