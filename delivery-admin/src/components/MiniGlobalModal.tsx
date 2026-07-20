import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function MiniGlobalModal({
  visible,
  title,
  message,
  confirmText = 'Ha',
  cancelText = 'Yo‘q',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.confirmButtonPressed,
                loading && styles.disabledButton,
              ]}
              onPress={onConfirm}>
              <Text style={styles.confirmText}>
                {loading ? 'Chiqilmoqda...' : confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(17, 24, 39, 0.48)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 18,
  },
  title: {
    textAlign: 'center',
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
  },
  message: {
    marginTop: 10,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
  },
  cancelButtonPressed: {
    backgroundColor: '#EDE9FE',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
  },
  confirmButtonPressed: {
    backgroundColor: '#B91C1C',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelText: {
    color: '#6d32c5',
    fontSize: 15,
    fontWeight: '800',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
