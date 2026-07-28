import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
};

/**
 * Logistica global tasdiqlash modal — Ha / Yo‘q.
 */
export function GlobalConfirmModal({
  open,
  title = 'Tasdiqlash',
  message,
  confirmText = 'Ha',
  cancelText = "Yo'q",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!loading) onCancel?.();
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.cancel,
                pressed && !loading && styles.pressed,
              ]}
              disabled={loading}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.confirm,
                pressed && !loading && styles.pressed,
                loading && styles.disabled,
              ]}
              disabled={loading}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>
                {loading ? '...' : confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    fontWeight: '500',
  },
  actions: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    backgroundColor: '#F3F4F6',
  },
  confirm: {
    backgroundColor: '#7c3aed',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.6,
  },
});
