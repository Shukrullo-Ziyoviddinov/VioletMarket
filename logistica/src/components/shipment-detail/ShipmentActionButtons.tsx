import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onAccept?: () => void;
  onReturnToSeller?: () => void;
};

export function ShipmentActionButtons({ onAccept, onReturnToSeller }: Props) {
  const { t } = useTranslation();

  if (!onAccept && !onReturnToSeller) return null;

  return (
    <View style={styles.row}>
      {onAccept ? (
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            styles.accept,
            pressed && styles.pressed,
          ]}
          onPress={onAccept}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#16A34A" />
          <Text style={[styles.text, styles.acceptText]}>
            {t('shipments.actions.accept')}
          </Text>
        </Pressable>
      ) : null}

      {onReturnToSeller ? (
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            styles.returnBtn,
            pressed && styles.pressed,
          ]}
          onPress={onReturnToSeller}
        >
          <Ionicons name="person-outline" size={18} color="#7c3aed" />
          <Text style={[styles.text, styles.returnText]}>
            {t('shipments.actions.returnToSeller')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  accept: {
    borderColor: '#16A34A',
  },
  returnBtn: {
    borderColor: '#7c3aed',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  acceptText: {
    color: '#16A34A',
  },
  returnText: {
    color: '#7c3aed',
  },
  pressed: {
    opacity: 0.85,
  },
});
