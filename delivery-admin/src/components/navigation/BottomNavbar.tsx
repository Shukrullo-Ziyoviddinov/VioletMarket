import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const items = [
  { label: 'Bosh sahifa', icon: 'home-outline' },
  { label: 'Buyurtmalar', icon: 'receipt-outline' },
  { label: 'Tarix', icon: 'clipboard-outline' },
  { label: 'Profil', icon: 'person' },
] as const;

export function BottomNavbar() {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = item.label === 'Profil';
        return (
          <View key={item.label} style={styles.item}>
            <Ionicons
              name={item.icon}
              size={25}
              color={active ? '#6D28D9' : '#9CA3AF'}
            />
            <Text style={[styles.label, active && styles.activeLabel]}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#6D28D9',
    fontWeight: '800',
  },
});
