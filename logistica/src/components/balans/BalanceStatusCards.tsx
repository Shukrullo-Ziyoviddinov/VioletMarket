import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type Props = {
  returnedCount: number;
  handedOverCount: number;
};

export function BalanceStatusCards({
  returnedCount,
  handedOverCount,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <View style={[styles.card, styles.returnedCard]}>
        <Ionicons name="return-down-back-outline" size={24} color="#DC2626" />
        <Text style={styles.count}>{returnedCount}</Text>
        <Text style={styles.label}>{t('balance.statusReturned')}</Text>
      </View>
      <View style={[styles.card, styles.handedCard]}>
        <Ionicons name="checkmark-done-outline" size={24} color="#16A34A" />
        <Text style={styles.count}>{handedOverCount}</Text>
        <Text style={styles.label}>{t('balance.statusHandedOver')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  returnedCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  handedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  count: {
    color: '#1F2937',
    fontSize: 24,
    fontWeight: '900',
  },
  label: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
});
