import { Ionicons } from '@expo/vector-icons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/auth/FormField';
import { ProfileCameraCapture } from '@/components/auth/ProfileCameraCapture';
import { GlobalBottomSheet } from '@/components/GlobalBottomSheet';
import { MiniGlobalModal } from '@/components/MiniGlobalModal';
import { BottomNavbar } from '@/components/navigation/BottomNavbar';
import { usePageRefresh, useRefreshState } from '@/components/loading/PageRefresh';
import {
  formatIncomeAmount,
  incomeForSelection,
  toDayKey,
} from '@/components/income/income-period';
import { resolveMediaUrl } from '@/config/env';
import { useAuth } from '@/providers/AuthProvider';
import { fetchDeliveredHistory } from '@/services/delivery-orders';
import { fetchSupportUnreadCount } from '@/services/support-chat';
import {
  connectSupportChatSocket,
  onSupportChatMessage,
  onSupportChatThreadsUpdated,
} from '@/services/support-chat-socket';
import type { DeliveryTransport } from '@/types/delivery';

const TRANSPORT_OPTIONS: Array<{
  value: DeliveryTransport;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'car', label: 'Mashina', icon: 'car-sport-outline' },
  { value: 'scooter', label: 'Skuterda', icon: 'speedometer-outline' },
  { value: 'bicycle', label: 'Velosipedda', icon: 'bicycle-outline' },
];

function getTransportLabel(transport?: DeliveryTransport | null) {
  return (
    TRANSPORT_OPTIONS.find((option) => option.value === transport)?.label ||
    'Hali kiritilmagan'
  );
}

type MenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  detailColor?: string;
  badgeCount?: number;
  danger?: boolean;
  onPress?: () => void;
};

function MenuRow({
  icon,
  label,
  detail,
  detailColor,
  badgeCount,
  danger,
  onPress,
}: MenuRowProps) {
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
      {detail ? (
        <Text style={[styles.menuDetail, detailColor ? { color: detailColor } : null]}>
          {detail}
        </Text>
      ) : null}
      {badgeCount && badgeCount > 0 ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      ) : null}
      {!danger && (
        <Ionicons name="chevron-forward" size={21} color="#C4B5FD" />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    token,
    delivery,
    isLoading,
    signOut,
    updateProfile,
    updateProfileImage,
    updateTransport,
  } = useAuth();
  const [supportUnread, setSupportUnread] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [transportModalOpen, setTransportModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedTransport, setSelectedTransport] =
    useState<DeliveryTransport | null>(null);
  const [isSavingTransport, setIsSavingTransport] = useState(false);
  const [transportError, setTransportError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !delivery) router.replace('/auth');
  }, [delivery, isLoading, router]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cancelled = false;

      Promise.all([
        fetchSupportUnreadCount(token),
        fetchDeliveredHistory(token),
      ])
        .then(([unreadData, historyData]) => {
          if (cancelled) return;
          setSupportUnread(unreadData.unread || 0);
          setTodayIncome(
            incomeForSelection(
              historyData.orders || [],
              'day',
              toDayKey(new Date()),
            ),
          );
        })
        .catch(() => null);

      return () => {
        cancelled = true;
      };
    }, [token]),
  );

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const [unreadData, historyData] = await Promise.all([
        fetchSupportUnreadCount(token),
        fetchDeliveredHistory(token),
      ]);
      setSupportUnread(unreadData.unread || 0);
      setTodayIncome(
        incomeForSelection(
          historyData.orders || [],
          'day',
          toDayKey(new Date()),
        ),
      );
    } catch {
      // ignore
    }
  }, [token]);

  const { onRefresh: onProfileRefresh } = useRefreshState(refreshProfile);
  usePageRefresh(onProfileRefresh);

  useEffect(() => {
    if (!token) return;

    connectSupportChatSocket(token);

    const refreshUnread = () => {
      fetchSupportUnreadCount(token)
        .then((data) => setSupportUnread(data.unread || 0))
        .catch(() => null);
    };

    const unsubscribeMessage = onSupportChatMessage((payload) => {
      if (payload?.message?.sender !== 'admin') return;
      if (delivery?.id && payload.deliveryId !== delivery.id) return;
      setSupportUnread((prev) => prev + 1);
      refreshUnread();
    });

    const unsubscribeThreads = onSupportChatThreadsUpdated((payload) => {
      if (
        delivery?.id &&
        payload?.deliveryId &&
        payload.deliveryId !== delivery.id
      ) {
        return;
      }
      refreshUnread();
    });

    return () => {
      unsubscribeMessage();
      unsubscribeThreads();
    };
  }, [token, delivery?.id]);

  function openProfileModal() {
    if (!delivery) return;
    setFirstName(delivery.firstName);
    setLastName(delivery.lastName);
    setPhone(delivery.phone);
    setEmail(delivery.email);
    setSaveError('');
    setProfileModalOpen(true);
  }

  function openTransportModal() {
    if (!delivery) return;
    setSelectedTransport(delivery.transport || null);
    setTransportError('');
    setTransportModalOpen(true);
  }

  async function saveTransport() {
    if (!selectedTransport || isSavingTransport) return;
    setTransportError('');
    setIsSavingTransport(true);
    try {
      await updateTransport(selectedTransport);
      setTransportModalOpen(false);
    } catch (error) {
      setTransportError(
        error instanceof Error ? error.message : 'Transport saqlanmadi',
      );
    } finally {
      setIsSavingTransport(false);
    }
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

  async function uploadCapturedPhoto(photoUri: string) {
    if (isUploadingPhoto) return;
    setIsUploadingPhoto(true);
    try {
      const context = ImageManipulator.manipulate(photoUri);
      context.resize({ width: 512, height: 512 });
      const imageRef = await context.renderAsync();
      const saved = await imageRef.saveAsync({
        compress: 0.7,
        format: SaveFormat.JPEG,
        base64: true,
      });

      if (!saved.base64) {
        throw new Error('Suratni o‘qib bo‘lmadi');
      }

      await updateProfileImage(`data:image/jpeg;base64,${saved.base64}`);
      setCameraOpen(false);
    } catch (error) {
      Alert.alert(
        'Xato',
        error instanceof Error ? error.message : 'Profil rasmi yuklanmadi',
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  if (isLoading || !delivery) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6d32c5" />
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
          <Pressable
            disabled={isUploadingPhoto}
            style={({ pressed }) => [
              styles.avatarWrap,
              pressed && styles.avatarPressed,
            ]}
            onPress={() => setCameraOpen(true)}>
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
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              )}
            </View>
          </Pressable>

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
            detail={getTransportLabel(delivery.transport)}
            onPress={openTransportModal}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="help-circle-outline"
            label="Yordam"
            badgeCount={supportUnread}
            onPress={() => {
              setSupportUnread(0);
              router.push('/support');
            }}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="wallet-outline"
            label="Daromat"
            detail={formatIncomeAmount(todayIncome)}
            detailColor="#16A34A"
            onPress={() => router.push('/income')}
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

      <GlobalBottomSheet
        visible={transportModalOpen}
        title="Transport turini tanlang"
        onClose={() => setTransportModalOpen(false)}>
        <View style={styles.transportForm}>
          {TRANSPORT_OPTIONS.map((option) => {
            const selected = selectedTransport === option.value;
            return (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.transportOption,
                  selected && styles.transportOptionSelected,
                  pressed && styles.transportOptionPressed,
                ]}
                onPress={() => setSelectedTransport(option.value)}>
                <View
                  style={[
                    styles.transportIcon,
                    selected && styles.transportIconSelected,
                  ]}>
                  <Ionicons
                    name={option.icon}
                    size={25}
                    color={selected ? '#FFFFFF' : '#6d32c5'}
                  />
                </View>
                <Text
                  style={[
                    styles.transportLabel,
                    selected && styles.transportLabelSelected,
                  ]}>
                  {option.label}
                </Text>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={25}
                  color={selected ? '#6d32c5' : '#D1D5DB'}
                />
              </Pressable>
            );
          })}

          {transportError ? (
            <Text style={styles.saveError}>{transportError}</Text>
          ) : null}

          <Pressable
            disabled={!selectedTransport || isSavingTransport}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
              (!selectedTransport || isSavingTransport) &&
                styles.saveButtonDisabled,
            ]}
            onPress={saveTransport}>
            {isSavingTransport ? (
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

      <ProfileCameraCapture
        visible={cameraOpen}
        uploading={isUploadingPhoto}
        onClose={() => setCameraOpen(false)}
        onUpload={uploadCapturedPhoto}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6d32c5',
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
  avatarPressed: {
    opacity: 0.75,
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
    backgroundColor: '#6d32c5',
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
    maxWidth: 150,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  menuBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#6d32c5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  transportForm: {
    gap: 12,
    paddingBottom: 4,
  },
  transportOption: {
    minHeight: 70,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: '#FFFFFF',
  },
  transportOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  transportOptionPressed: {
    opacity: 0.75,
  },
  transportIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  transportIconSelected: {
    backgroundColor: '#6d32c5',
  },
  transportLabel: {
    flex: 1,
    color: '#374151',
    fontSize: 16,
    fontWeight: '800',
  },
  transportLabelSelected: {
    color: '#5B21B6',
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
    backgroundColor: '#6d32c5',
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
