import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#7c3aed';
const MUTED = '#9CA3AF';

const items = [
  { label: 'Asosiy', icon: 'home-outline', activeIcon: 'home', href: '/asosiy' },
  {
    label: 'Yuklarim',
    icon: 'cube-outline',
    activeIcon: 'cube',
    href: '/yuklarim',
  },
  {
    label: 'Profil',
    icon: 'person-outline',
    activeIcon: 'person',
    href: '/profil',
  },
] as const;

export function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map((item) => {
        const active =
          pathname === item.href || pathname?.endsWith(item.href) === true;

        return (
          <Pressable
            key={item.label}
            style={styles.item}
            onPress={() => {
              if (active) return;
              router.replace(item.href);
            }}
          >
            <Ionicons
              name={active ? item.activeIcon : item.icon}
              size={24}
              color={active ? ACCENT : MUTED}
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
    minHeight: 64,
    paddingHorizontal: 8,
    paddingTop: 10,
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
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
  },
  activeLabel: {
    color: ACCENT,
    fontWeight: '800',
  },
});
