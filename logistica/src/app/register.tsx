import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/auth/FormField';
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import {
  sendLoginCode,
  sendRegistrationCode,
  verifyLogin,
} from '@/services/logistica-auth';
import {
  LOGISTICA_COUNTRY_OPTIONS,
  type LogisticaCountry,
} from '@/types/logistica';

const ACCENT = '#7c3aed';

type Tab = 'register' | 'login';
type LoginStep = 'email' | 'code';

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [tab, setTab] = useState<Tab>('register');

  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState<LogisticaCountry | null>(null);
  const [email, setEmail] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const [loginStep, setLoginStep] = useState<LoginStep>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginCode, setLoginCode] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryLabel =
    LOGISTICA_COUNTRY_OPTIONS.find((item) => item.key === country)?.label ||
    'Davlatni tanlang';

  function switchTab(next: Tab) {
    setTab(next);
    setError('');
    setLoginStep('email');
    setLoginCode('');
  }

  async function onRegisterNext() {
    if (isSubmitting) return;
    if (companyName.trim().length < 2) {
      setError('Kompaniya nomini kiriting');
      return;
    }
    if (!country) {
      setError('Logistica davlatini tanlang');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('To‘g‘ri Gmail manzilini kiriting');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await sendRegistrationCode({
        email: email.trim().toLowerCase(),
        companyName: companyName.trim(),
        logisticaCountry: country,
      });
      router.push({
        pathname: '/otp',
        params: {
          mode: 'register',
          email: email.trim().toLowerCase(),
          companyName: companyName.trim(),
          logisticaCountry: country,
        },
      });
    } catch (requestError) {
      if (
        requestError instanceof ApiError &&
        requestError.code === 'ACCOUNT_PENDING'
      ) {
        router.replace({
          pathname: '/pending-approval',
          params: { email: email.trim().toLowerCase() },
        });
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Kod yuborilmadi',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onLoginNext() {
    if (isSubmitting) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setError('To‘g‘ri Gmail manzilini kiriting');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await sendLoginCode(loginEmail.trim().toLowerCase());
      setLoginStep('code');
      setLoginCode('');
    } catch (requestError) {
      if (
        requestError instanceof ApiError &&
        requestError.code === 'ACCOUNT_PENDING'
      ) {
        router.replace({
          pathname: '/pending-approval',
          params: { email: loginEmail.trim().toLowerCase() },
        });
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Kod yuborilmadi',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onLoginVerify() {
    if (isSubmitting) return;
    const code = loginCode.replace(/\D/g, '');
    if (code.length !== 6) {
      setError('6 xonali kodni kiriting');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const result = await verifyLogin(loginEmail.trim().toLowerCase(), code);
      await signIn(result);
      router.replace('/asosiy');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Kod tasdiqlanmadi',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {tab === 'register' ? "Ro‘yxatdan o‘tish" : 'Kirish'}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
              onPress={() => switchTab('register')}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === 'register' && styles.tabTextActive,
                ]}
              >
                Ro‘yxatdan o‘tish
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
              onPress={() => switchTab('login')}
            >
              <Text
                style={[styles.tabText, tab === 'login' && styles.tabTextActive]}
              >
                Kirish
              </Text>
            </Pressable>
          </View>

          {tab === 'register' ? (
            <>
              <Text style={styles.title}>Logistica profili</Text>
              <Text style={styles.subtitle}>
                Kompaniya, davlat va Gmail ma’lumotlarini kiriting.
              </Text>

              <View style={styles.form}>
                <FormField
                  label="Kompaniya nomi"
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="Kompaniya nomi"
                  autoCapitalize="words"
                />

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Logistica davlati</Text>
                  <Pressable
                    style={styles.select}
                    onPress={() => setPickerOpen(true)}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !country && styles.selectPlaceholder,
                      ]}
                    >
                      {countryLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6B7280" />
                  </Pressable>
                </View>

                <FormField
                  label="Gmail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@gmail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.pressed,
                  isSubmitting && styles.disabled,
                ]}
                onPress={onRegisterNext}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Keyingisi</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                {loginStep === 'email' ? 'Gmail orqali kirish' : 'Parol / kod'}
              </Text>
              <Text style={styles.subtitle}>
                {loginStep === 'email'
                  ? 'Gmailingizni kiriting — kod yuboriladi.'
                  : `${loginEmail.trim().toLowerCase()} manziliga yuborilgan 6 xonali kodni kiriting.`}
              </Text>

              {loginStep === 'email' ? (
                <FormField
                  label="Gmail"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  placeholder="example@gmail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : (
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Parol (kod)</Text>
                  <TextInput
                    style={styles.codeInput}
                    value={loginCode}
                    onChangeText={(value) =>
                      setLoginCode(value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="******"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry
                  />
                </View>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              {loginStep === 'email' ? (
                <Pressable
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed,
                    isSubmitting && styles.disabled,
                  ]}
                  onPress={onLoginNext}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Keyingisi</Text>
                  )}
                </Pressable>
              ) : (
                <>
                  <Pressable
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.pressed,
                      isSubmitting && styles.disabled,
                    ]}
                    onPress={onLoginVerify}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>Tasdiqlash</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.linkBtn}
                    onPress={() => {
                      setLoginStep('email');
                      setLoginCode('');
                      setError('');
                    }}
                  >
                    <Text style={styles.linkText}>Gmailni o‘zgartirish</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPickerOpen(false)}
        >
          <View style={styles.modalCard}>
            {LOGISTICA_COUNTRY_OPTIONS.map((item) => (
              <Pressable
                key={item.key}
                style={styles.modalItem}
                onPress={() => {
                  setCountry(item.key);
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.label}</Text>
                {country === item.key ? (
                  <Ionicons name="checkmark" size={18} color={ACCENT} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  header: {
    backgroundColor: ACCENT,
    minHeight: 56,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 12,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED99',
  },
  tabTextActive: {
    color: ACCENT,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  form: { gap: 14 },
  fieldWrap: { gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  select: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 15,
    color: '#111827',
  },
  selectPlaceholder: {
    color: '#9CA3AF',
  },
  codeInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
    backgroundColor: ACCENT,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: ACCENT,
    fontWeight: '700',
    fontSize: 14,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.7 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
});
