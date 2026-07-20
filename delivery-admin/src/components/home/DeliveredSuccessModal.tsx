import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type DeliveredSuccessModalProps = {
  visible: boolean;
  barcode: string;
  totalAmount: number;
  deliveredAt: string | null;
  onContinue: () => void;
};

function formatAmount(value: number) {
  return `${Math.round(Number(value) || 0).toLocaleString('uz-UZ')} so'm`;
}

function formatTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DeliveredSuccessModal({
  visible,
  barcode,
  totalAmount,
  deliveredAt,
  onContinue,
}: DeliveredSuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onContinue}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark" size={42} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Buyurtma muvaffaqiyatli yetkazildi!</Text>
          <Text style={styles.orderId}>Buyurtma {barcode || '—'}</Text>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Jami to'lov</Text>
              <Text style={styles.summaryValue}>{formatAmount(totalAmount)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Yetkazish vaqti</Text>
              <Text style={styles.summaryValue}>{formatTime(deliveredAt)}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.pressed,
            ]}
            onPress={onContinue}>
            <Text style={styles.continueText}>Davom etish</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    textAlign: 'center',
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
  },
  orderId: {
    marginTop: 8,
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  summary: {
    width: '100%',
    marginTop: 22,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  summaryRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  continueButton: {
    marginTop: 22,
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#6d32c5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.92,
  },
});
