import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/providers/AuthProvider';
import {
  completeRegistration,
  sendLoginCode,
  sendRegistrationCode,
  verifyLogin,
} from '@/services/logistica-auth';
import { setHasRegistered } from '@/services/auth-storage';
import type { LogisticaCountry } from '@/types/logistica';

const ACCENT = '#7c3aed';

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default function OtpScreen() {
  const router = useRouter();
  const { signIn, markRegistered } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{
    mode?: string;
    email?: string;
    companyName?: string;
    logisticaCountry?: string;
  }>();
  const mode = stringParam(params.mode) === 'register' ? 'register' : 'login';
  const email = stringParam(params.email);
  const companyName = stringParam(params.companyName);
  const logisticaCountry = stringParam(
    params.logisticaCountry,
  ) as LogisticaCountry;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function verifyCode() {
    const verificationCode = code.replace(/\D/g, '');
    if (isSubmitting || verificationCode.length !== 6) {
      setError('6 xonali kodni kiriting');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const result = await verifyLogin(email, verificationCode);
        await signIn(result);
        router.replace('/asosiy');
        return;
      }

      await completeRegistration({
        email,
        code: verificationCode,
        companyName,
        logisticaCountry,
      });
      await markRegistered();
      await setHasRegistered();
      router.replace({
        pathname: '/pending-approval',
        params: { email },
      });
    } catch (requestError) {
      setCode('');
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Kod tasdiqlanmadi',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateCode(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    setError('');
  }

  async function resendCode() {
    if (isResending || isSubmitting) return;
    setError('');
    setIsResending(true);
    try {
      if (mode === 'register') {
        await sendRegistrationCode({
          email,
          companyName,
          logisticaCountry,
        });
      } else {
        await sendLoginCode(email);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Kod qayta yuborilmadi',
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>

        <View style={styles.centerWrap}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={35} color={ACCENT} />
            </View>
            <Text style={styles.title}>Tasdiqlash kodi</Text>
            <Text style={styles.description}>
              <Text style={styles.email}>{email}</Text> manziliga yuborilgan 6
              xonali kodni kiriting.
            </Text>

            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={updateCode}
              keyboardType="number-pad"
              maxLength={6}
              style={[styles.codeInput, error ? styles.codeInputError : null]}
              placeholder="______"
              placeholderTextColor="#9CA3AF"
              textAlign="center"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              disabled={isSubmitting || code.length !== 6}
              style={({ pressed }) => [
                styles.verifyBtn,
                pressed && styles.pressed,
                (isSubmitting || code.length !== 6) && styles.disabled,
              ]}
              onPress={verifyCode}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyText}>Tasdiqlash</Text>
              )}
            </Pressable>

            <Pressable
              disabled={isResending}
              style={styles.resendBtn}
              onPress={resendCode}
            >
              <Text style={[styles.resendText, isResending && styles.resendDisabled]}>
                {isResending ? 'Yuborilmoqda...' : 'Kodni qayta yuborish'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ACCENT },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  description: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
  },
  email: {
    color: ACCENT,
    fontWeight: '700',
  },
  codeInput: {
    marginTop: 22,
    width: '100%',
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 10,
    paddingHorizontal: 16,
  },
  codeInputError: {
    borderColor: '#DC2626',
  },
  error: {
    marginTop: 12,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  verifyBtn: {
    marginTop: 18,
    alignSelf: 'stretch',
    backgroundColor: ACCENT,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.55 },
  resendBtn: {
    marginTop: 16,
  },
  resendText: {
    color: ACCENT,
    fontWeight: '700',
  },
  resendDisabled: {
    color: '#9CA3AF',
  },
});
