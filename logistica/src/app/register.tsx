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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/auth/FormField';
import { ApiError } from '@/services/api';
import { sendRegistrationCode } from '@/services/logistica-auth';
import {
  LOGISTICA_COUNTRY_OPTIONS,
  type LogisticaCountry,
} from '@/types/logistica';

const ACCENT = '#7c3aed';

export default function RegisterScreen() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState<LogisticaCountry | null>(null);
  const [email, setEmail] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryLabel =
    LOGISTICA_COUNTRY_OPTIONS.find((item) => item.key === country)?.label ||
    'Davlatni tanlang';

  async function onNext() {
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Ro‘yxatdan o‘tish</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
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
            onPress={onNext}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Keyingisi</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)}>
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
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: { width: 40 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 12,
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
