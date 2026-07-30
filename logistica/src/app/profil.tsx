import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MyLogisticaInfoBottomSheet } from '@/components/profile/MyLogisticaInfoBottomSheet';
import { LanguageModal } from '@/components/profile/LanguageModal';
import { localeForLanguage } from '@/i18n';
import { useAuth } from '@/providers/AuthProvider';
import { useAppLanguage } from '@/providers/LanguageProvider';
import { fetchLogisticaChatUnreadCount } from '@/services/logistica-chat';
import {
  connectLogisticaChatSocket,
  onLogisticaChatThreadsUpdated,
} from '@/services/logistica-chat-socket';
import { fetchCargoHistoryBalance } from '@/services/logistica-shipments';
import { LOGISTICA_COUNTRY_OPTIONS } from '@/types/logistica';
import { ScreenShell } from '@/components/ScreenShell';
import type { LogisticaProfile } from '@/types/logistica';

export default function ProfilScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile, token } = useAuth();
  const { language } = useAppLanguage();
  const [displayProfile, setDisplayProfile] =
    useState<LogisticaProfile | null>(profile);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [monthlyBalance, setMonthlyBalance] = useState(0);

  useEffect(() => {
    setDisplayProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!token) {
      setUnreadChatCount(0);
      return undefined;
    }

    let cancelled = false;

    const loadUnreadCount = async () => {
      try {
        const data = await fetchLogisticaChatUnreadCount(token);
        if (!cancelled) {
          setUnreadChatCount(data.unread || 0);
        }
      } catch {
        // Profil ishlashiga chat hisoblagichi xatosi ta’sir qilmasin.
      }
    };

    loadUnreadCount();
    connectLogisticaChatSocket(token);
    const unsubscribe = onLogisticaChatThreadsUpdated((payload) => {
      if (payload.logisticaId && payload.logisticaId !== profile?.id) return;
      loadUnreadCount();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [token, profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setMonthlyBalance(0);
        return undefined;
      }

      let cancelled = false;
      const now = new Date();

      fetchCargoHistoryBalance(token, {
        mode: 'month',
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      })
        .then((data) => {
          if (!cancelled) setMonthlyBalance(data.balance || 0);
        })
        .catch(() => {
          // Profil ishlashiga balans xatosi ta’sir qilmasin.
        });

      return () => {
        cancelled = true;
      };
    }, [token]),
  );

  const companyName = profile?.companyName || profile?.name || '—';

  const countryOption = LOGISTICA_COUNTRY_OPTIONS.find(
    (item) => item.key === profile?.logisticaCountry,
  );
  const countryLabel = profile?.logisticaCountry
    ? t(`countries.${profile.logisticaCountry}`, {
        defaultValue: countryOption?.label || profile.logisticaCountry,
      })
    : '—';
  const selectedLanguageLabel = t(`language.${language}`);

  const initial = String(companyName || 'L').trim().charAt(0).toUpperCase();
  const hasInfo = Boolean(
    displayProfile?.chinaAddress && displayProfile?.chinaPhone,
  );

  return (
    <ScreenShell title={t('profile.title')}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.wrap}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="cube-outline" size={14} color="#6D28D9" />
              <Text style={styles.roleText}>{t('profile.partner')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, styles.iconBoxCompany]}>
              <Ionicons name="business-outline" size={22} color="#7C3AED" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.label}>{t('profile.companyName')}</Text>
              <Text style={styles.value} numberOfLines={2}>
                {companyName}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, styles.iconBoxEmail]}>
              <Ionicons name="mail-outline" size={22} color="#2563EB" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.label}>{t('profile.email')}</Text>
              <Text style={styles.value} numberOfLines={2}>
                {profile?.email || '—'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, styles.iconBoxCountry]}>
              <Ionicons name="location-outline" size={22} color="#059669" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.label}>{t('profile.country')}</Text>
              <Text style={styles.value} numberOfLines={2}>
                {countryLabel}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => setInfoModalOpen(true)}
          style={({ pressed }) => [
            styles.myInfoButton,
            pressed && styles.myInfoButtonPressed,
          ]}
        >
          <View style={styles.myInfoIcon}>
            <Ionicons name="person-outline" size={22} color="#7C3AED" />
          </View>
          <View style={styles.myInfoText}>
            <Text style={styles.myInfoTitle}>{t('profile.myInfo')}</Text>
            <Text style={styles.myInfoSubtitle} numberOfLines={1}>
              {hasInfo
                ? displayProfile?.chinaAddress
                : t('profile.enterChinaDetails')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color="#A78BFA" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/yordam')}
          style={({ pressed }) => [
            styles.myInfoButton,
            pressed && styles.myInfoButtonPressed,
          ]}
        >
          <View style={[styles.myInfoIcon, styles.helpIcon]}>
            <Ionicons name="chatbubbles-outline" size={22} color="#2563EB" />
          </View>
          <View style={styles.myInfoText}>
            <Text style={styles.myInfoTitle}>{t('profile.help')}</Text>
            <Text style={styles.myInfoSubtitle} numberOfLines={1}>
              {t('profile.helpSubtitle')}
            </Text>
          </View>
          {unreadChatCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={21} color="#A78BFA" />
        </Pressable>

        <Pressable
          onPress={() => setLanguageModalOpen(true)}
          style={({ pressed }) => [
            styles.myInfoButton,
            pressed && styles.myInfoButtonPressed,
          ]}
        >
          <View style={[styles.myInfoIcon, styles.languageIcon]}>
            <Ionicons name="language-outline" size={22} color="#D97706" />
          </View>
          <View style={styles.myInfoText}>
            <Text style={styles.myInfoTitle}>{t('profile.appLanguage')}</Text>
            <Text style={styles.myInfoSubtitle} numberOfLines={1}>
              {selectedLanguageLabel}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color="#A78BFA" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/balans')}
          style={({ pressed }) => [
            styles.myInfoButton,
            pressed && styles.myInfoButtonPressed,
          ]}
        >
          <View style={[styles.myInfoIcon, styles.balanceIcon]}>
            <Ionicons name="wallet-outline" size={22} color="#059669" />
          </View>
          <View style={styles.myInfoText}>
            <Text style={styles.myInfoTitle}>{t('profile.balance')}</Text>
            <Text style={styles.myInfoSubtitle} numberOfLines={1}>
              {t('profile.balanceSubtitle')}
            </Text>
          </View>
          <Text style={styles.monthlyBalanceText} numberOfLines={1}>
            {monthlyBalance.toLocaleString(localeForLanguage(language))}{' '}
            {t('common.sum')}
          </Text>
          <Ionicons name="chevron-forward" size={21} color="#A78BFA" />
        </Pressable>
      </ScrollView>

      <MyLogisticaInfoBottomSheet
        visible={infoModalOpen}
        token={token}
        profile={displayProfile}
        onClose={() => setInfoModalOpen(false)}
        onSaved={setDisplayProfile}
      />
      <LanguageModal
        visible={languageModalOpen}
        onClose={() => setLanguageModalOpen(false)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 22,
    gap: 10,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderWidth: 5,
    borderColor: '#EDE9FE',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 5,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    gap: 7,
  },
  companyName: {
    color: '#24123D',
    fontSize: 19,
    fontWeight: '800',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: '#EDE9FE',
  },
  roleText: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxCompany: {
    backgroundColor: '#F3E8FF',
  },
  iconBoxEmail: {
    backgroundColor: '#DBEAFE',
  },
  iconBoxCountry: {
    backgroundColor: '#D1FAE5',
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 21,
  },
  divider: {
    height: 1,
    marginLeft: 52,
    backgroundColor: '#F1F5F9',
  },
  myInfoButton: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myInfoButtonPressed: {
    opacity: 0.88,
  },
  myInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
  },
  helpIcon: {
    backgroundColor: '#DBEAFE',
  },
  languageIcon: {
    backgroundColor: '#FEF3C7',
  },
  balanceIcon: {
    backgroundColor: '#D1FAE5',
  },
  myInfoText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  myInfoTitle: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '800',
  },
  myInfoSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  monthlyBalanceText: {
    maxWidth: 108,
    color: '#059669',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
});
