import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const items = [
  { label: 'Bosh sahifa', icon: 'home-outline', href: '/orders' },
  { label: 'Buyurtmalar', icon: 'receipt-outline', href: '/orders' },
  { label: 'Tarix', icon: 'clipboard-outline', href: '/orders' },
  { label: 'Profil', icon: 'person', href: '/profile' },
] as const;

function resolveActiveLabel(pathname: string) {
  if (pathname.includes('/profile') || pathname.includes('/support')) {
    return 'Profil';
  }
  if (pathname.includes('/orders')) {
    return 'Buyurtmalar';
  }
  return 'Buyurtmalar';
}

export function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeLabel = resolveActiveLabel(pathname || '');

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active = item.label === activeLabel;
        const isPlaceholder =
          item.label === 'Bosh sahifa' || item.label === 'Tarix';

        return (
          <Pressable
            key={item.label}
            style={styles.item}
            disabled={isPlaceholder}
            onPress={() => {
              if (item.label === 'Profil') {
                router.push('/profile');
                return;
              }
              if (item.label === 'Buyurtmalar') {
                router.push('/orders');
              }
            }}>
            <Ionicons
              name={item.icon}
              size={25}
              color={active ? '#6D28D9' : '#9CA3AF'}
            />
            <Text style={[styles.label, active && styles.activeLabel]}>
              {item.label}
            </Text>
          </Pressable>
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
