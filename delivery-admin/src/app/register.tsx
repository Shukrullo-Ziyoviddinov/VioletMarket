import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { sendRegistrationCode } from '@/services/delivery-auth';

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(stringParam(params.email));
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegistration() {
    if (isSubmitting) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('To‘g‘ri Gmail manzilini kiriting');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Ism va familiyangizni kiriting');
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setError('Telefon raqamini to‘liq kiriting');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await sendRegistrationCode(email);
      router.push({
        pathname: '/otp',
        params: {
          mode: 'register',
          email: email.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Ro‘yxatdan o‘tish</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
          <Text style={styles.title}>Yetkazib berish profilingiz</Text>
          <Text style={styles.subtitle}>
            Ro‘yxatdan o‘tish uchun ma’lumotlaringizni to‘ldiring.
          </Text>

          <View style={styles.form}>
            <FormField
              label="Ism"
              icon="person-outline"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ismingiz"
              autoCapitalize="words"
            />
            <FormField
              label="Familiya"
              icon="person-outline"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Familiyangiz"
              autoCapitalize="words"
            />
            <FormField
              label="Telefon"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              placeholder="+998 90 123 45 67"
              keyboardType="phone-pad"
            />
            <FormField
              label="Gmail"
              icon="mail-outline"
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
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={submitRegistration}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>Kod yuborish</Text>
                <Ionicons name="mail-unread-outline" size={21} color="#FFFFFF" />
              </>
            )}
          </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: '#6D28D9',
  },
  header: {
    height: 62,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  headerSpacer: { width: 42 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 24,
  },
  content: {
    gap: 18,
    padding: 22,
    paddingBottom: 22,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#111827',
    fontSize: 25,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: -10,
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 15,
  },
  error: {
    padding: 12,
    borderRadius: 12,
    color: '#B91C1C',
    backgroundColor: '#FEF2F2',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    minHeight: 56,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 17,
    backgroundColor: '#6D28D9',
  },
  buttonPressed: {
    backgroundColor: '#5B21B6',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
