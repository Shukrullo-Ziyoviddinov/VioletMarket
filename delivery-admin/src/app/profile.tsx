import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavbar } from '@/components/navigation/BottomNavbar';
import { resolveMediaUrl } from '@/config/env';
import { useAuth } from '@/providers/AuthProvider';

type MenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  danger?: boolean;
};

function MenuRow({ icon, label, detail, danger }: MenuRowProps) {
  const color = danger ? '#DC2626' : '#4B5563';
  return (
    <View style={styles.menuRow}>
      <View
        style={[
          styles.menuIcon,
          danger ? styles.dangerIcon : styles.defaultIcon,
        ]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.dangerText]}>
        {label}
      </Text>
      {detail ? <Text style={styles.menuDetail}>{detail}</Text> : null}
      {!danger && (
        <Ionicons name="chevron-forward" size={21} color="#C4B5FD" />
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { delivery, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !delivery) router.replace('/auth');
  }, [delivery, isLoading, router]);

  if (isLoading || !delivery) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={25} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: resolveMediaUrl(delivery.profileImage) }}
              style={styles.avatar}
            />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.identity}>
            <Text style={styles.name}>
              {delivery.firstName} {delivery.lastName}
            </Text>
            <Text style={styles.phone}>{delivery.phone}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>

          <Switch
            disabled
            value={delivery.isOnline}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={delivery.isOnline ? '#16A34A' : '#F3F4F6'}
          />
        </View>

        <View style={styles.menuCard}>
          <MenuRow icon="person-outline" label="Mening ma’lumotlarim" />
          <View style={styles.divider} />
          <MenuRow
            icon="car-outline"
            label="Transport"
            detail="Hali kiritilmagan"
          />
          <View style={styles.divider} />
          <MenuRow
            icon="help-circle-outline"
            label="Yordam va qo‘llab-quvvatlash"
          />
        </View>

        <View style={styles.logoutCard}>
          <MenuRow icon="log-out-outline" label="Chiqish" danger />
        </View>

        <Text style={styles.version}>Violet Delivery · 1.0.0</Text>
      </ScrollView>

      <BottomNavbar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6D28D9',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 26,
  },
  profileCard: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: '#EDE9FE',
    backgroundColor: '#E5E7EB',
  },
  cameraBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#6D28D9',
  },
  identity: {
    flex: 1,
  },
  name: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '900',
  },
  phone: {
    marginTop: 5,
    color: '#6B7280',
    fontSize: 14,
  },
  onlineRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  onlineText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '800',
  },
  menuCard: {
    marginTop: 18,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  menuRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultIcon: {
    backgroundColor: '#F5F3FF',
  },
  dangerIcon: {
    backgroundColor: '#FEF2F2',
  },
  menuLabel: {
    flex: 1,
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '800',
  },
  menuDetail: {
    maxWidth: 110,
    color: '#9CA3AF',
    fontSize: 12,
  },
  dangerText: {
    color: '#DC2626',
  },
  divider: {
    height: 1,
    marginLeft: 55,
    backgroundColor: '#F3F4F6',
  },
  logoutCard: {
    marginTop: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  version: {
    marginTop: 24,
    textAlign: 'center',
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600',
  },
});
