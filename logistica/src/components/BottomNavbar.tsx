import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#7c3aed';
const MUTED = '#9CA3AF';

const items = [
  {
    labelKey: 'navigation.home',
    icon: 'home-outline',
    activeIcon: 'home',
    href: '/asosiy',
  },
  {
    labelKey: 'navigation.shipments',
    icon: 'cube-outline',
    activeIcon: 'cube',
    href: '/yuklarim',
  },
  {
    labelKey: 'navigation.inUzbekistan',
    icon: 'business-outline',
    activeIcon: 'business',
    href: '/uzbda',
  },
  {
    labelKey: 'navigation.returns',
    icon: 'return-down-back-outline',
    activeIcon: 'return-down-back',
    href: '/qaytarish',
  },
  {
    labelKey: 'navigation.history',
    icon: 'time-outline',
    activeIcon: 'time',
    href: '/tarix',
  },
  {
    labelKey: 'navigation.profile',
    icon: 'person-outline',
    activeIcon: 'person',
    href: '/profil',
  },
] as const;

export function BottomNavbar() {
  const { t } = useTranslation();
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
            key={item.labelKey}
            style={styles.item}
            onPress={() => {
              if (active) return;
              router.replace(item.href);
            }}
          >
            <Ionicons
              name={active ? item.activeIcon : item.icon}
              size={22}
              color={active ? ACCENT : MUTED}
            />
            <Text
              style={[styles.label, active && styles.activeLabel]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {t(item.labelKey)}
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
    width: '100%',
    color: MUTED,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeLabel: {
    color: ACCENT,
    fontWeight: '800',
  },
});
