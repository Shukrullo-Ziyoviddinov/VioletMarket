import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/auth/FormField';
import { ApiError } from '@/services/api';
import { sendLoginCode } from '@/services/logistica-auth';

const ACCENT = '#7c3aed';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onNext() {
    if (isSubmitting) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('To‘g‘ri Gmail manzilini kiriting');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await sendLoginCode(email.trim().toLowerCase());
      router.push({
        pathname: '/otp',
        params: {
          mode: 'login',
          email: email.trim().toLowerCase(),
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
          <Text style={styles.headerTitle}>Kirish</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Gmail orqali kirish</Text>
          <Text style={styles.subtitle}>
            Gmailingizga kelgan 6 xonali kod bilan kirasiz.
          </Text>

          <FormField
            label="Gmail"
            value={email}
            onChangeText={setEmail}
            placeholder="example@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

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
        </View>
      </KeyboardAvoidingView>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
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
});
