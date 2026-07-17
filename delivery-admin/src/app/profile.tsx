import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/auth/FormField';
import { GlobalBottomSheet } from '@/components/GlobalBottomSheet';
import { MiniGlobalModal } from '@/components/MiniGlobalModal';
import { BottomNavbar } from '@/components/navigation/BottomNavbar';
import { resolveMediaUrl } from '@/config/env';
import { useAuth } from '@/providers/AuthProvider';

type MenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  danger?: boolean;
  onPress?: () => void;
};

function MenuRow({ icon, label, detail, danger, onPress }: MenuRowProps) {
  const color = danger ? '#DC2626' : '#4B5563';
  return (
    <Pressable
      disabled={!onPress}
      style={({ pressed }) => [
        styles.menuRow,
        pressed && styles.menuRowPressed,
      ]}
      onPress={onPress}>
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
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { delivery, isLoading, signOut, updateProfile } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !delivery) router.replace('/auth');
  }, [delivery, isLoading, router]);

  function openProfileModal() {
    if (!delivery) return;
    setFirstName(delivery.firstName);
    setLastName(delivery.lastName);
    setPhone(delivery.phone);
    setEmail(delivery.email);
    setSaveError('');
    setProfileModalOpen(true);
  }

  async function saveProfile() {
    if (isSaving) return;
    setSaveError('');
    setIsSaving(true);
    try {
      await updateProfile({ firstName, lastName, phone, email });
      setProfileModalOpen(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Ma’lumotlar saqlanmadi',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      setLogoutModalOpen(false);
      router.replace('/auth');
    } finally {
      setIsSigningOut(false);
    }
  }

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
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {delivery.profileImage ? (
              <Image
                source={{ uri: resolveMediaUrl(delivery.profileImage) }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={44} color="#8B5CF6" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.identity}>
            <Text style={styles.name}>
              {delivery.firstName} {delivery.lastName}
            </Text>
            <Text style={styles.phone}>{delivery.phone}</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          <MenuRow
            icon="person-outline"
            label="Mening ma’lumotlarim"
            onPress={openProfileModal}
          />
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
          <MenuRow
            icon="log-out-outline"
            label="Chiqish"
            danger
            onPress={() => setLogoutModalOpen(true)}
          />
        </View>

        <Text style={styles.version}>Violet Delivery · 1.0.0</Text>
      </ScrollView>

      <BottomNavbar />

      <GlobalBottomSheet
        visible={profileModalOpen}
        title="Mening ma’lumotlarim"
        onClose={() => setProfileModalOpen(false)}>
        <View style={styles.modalForm}>
          <FormField
            label="Ism"
            icon="person-outline"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <FormField
            label="Familiya"
            icon="person-outline"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          <FormField
            label="Telefon"
            icon="call-outline"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <FormField
            label="Gmail"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}

          <Pressable
            disabled={isSaving}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
              isSaving && styles.saveButtonDisabled,
            ]}
            onPress={saveProfile}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Saqlash</Text>
            )}
          </Pressable>
        </View>
      </GlobalBottomSheet>

      <MiniGlobalModal
        visible={logoutModalOpen}
        title="Hisobdan chiqish"
        message="Chindan ham hisobdan chiqmoqchimisiz?"
        loading={isSigningOut}
        onConfirm={confirmSignOut}
        onCancel={() => setLogoutModalOpen(false)}
      />
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
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
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
  menuRowPressed: {
    opacity: 0.65,
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
  modalForm: {
    gap: 14,
    paddingBottom: 4,
  },
  saveError: {
    padding: 12,
    borderRadius: 12,
    color: '#B91C1C',
    backgroundColor: '#FEF2F2',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    minHeight: 56,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#6D28D9',
  },
  saveButtonPressed: {
    backgroundColor: '#5B21B6',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
