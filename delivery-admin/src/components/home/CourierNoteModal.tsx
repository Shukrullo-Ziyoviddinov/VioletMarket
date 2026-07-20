import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type CourierNoteModalProps = {
  visible: boolean;
  note: string;
  onClose: () => void;
};

export function CourierNoteModal({
  visible,
  note,
  onClose,
}: CourierNoteModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.head}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color="#6d32c5"
            />
            <Text style={styles.title}>Kuryer uchun izoh</Text>
          </View>
          <Text style={styles.note}>
            {String(note || '').trim() || 'Izoh yo‘q'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            onPress={onClose}>
            <Text style={styles.closeText}>Yopish</Text>
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
    paddingHorizontal: 24,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    gap: 14,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    color: '#312E81',
    fontSize: 17,
    fontWeight: '800',
  },
  note: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  closeBtn: {
    marginTop: 4,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#6d32c5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
