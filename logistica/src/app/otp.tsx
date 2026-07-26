import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  const [cooldown, setCooldown] = useState(45);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function verifyCode(verificationCode: string) {
    if (isSubmitting || verificationCode.length !== 6) return;
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
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateCode(value: string) {
    const nextCode = value.replace(/\D/g, '').slice(0, 6);
    setCode(nextCode);
    setError('');
    if (nextCode.length === 6) {
      setTimeout(() => void verifyCode(nextCode), 0);
    }
  }

  async function resendCode() {
    if (cooldown > 0 || isSubmitting) return;
    setError('');
    try {
      if (mode === 'register') {
        const result = await sendRegistrationCode({
          email,
          companyName,
          logisticaCountry,
        });
        setCooldown(result.resendAfterSeconds);
      } else {
        const result = await sendLoginCode(email);
        setCooldown(result.resendAfterSeconds);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Kod qayta yuborilmadi',
      );
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

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={35} color={ACCENT} />
          </View>
          <Text style={styles.title}>Tasdiqlash kodi</Text>
          <Text style={styles.description}>
            <Text style={styles.email}>{email}</Text> manziliga yuborilgan 6
            xonali kodni kiriting.
          </Text>

          <Pressable
            style={styles.otpRow}
            onPress={() => inputRef.current?.focus()}
          >
            {Array.from({ length: 6 }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  code.length === index && styles.otpBoxActive,
                  error ? styles.otpBoxError : null,
                ]}
              >
                <Text style={styles.otpDigit}>{code[index] || ''}</Text>
              </View>
            ))}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={updateCode}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.hiddenInput}
            autoFocus
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {isSubmitting ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 12 }} />
          ) : null}

          <Pressable
            disabled={cooldown > 0}
            style={styles.resendBtn}
            onPress={resendCode}
          >
            <Text
              style={[
                styles.resendText,
                cooldown > 0 && styles.resendDisabled,
              ]}
            >
              {cooldown > 0
                ? `Qayta yuborish (${cooldown}s)`
                : 'Kodni qayta yuborish'}
            </Text>
          </Pressable>
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
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginTop: 24,
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
  otpRow: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 8,
  },
  otpBox: {
    width: 42,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  otpBoxActive: {
    borderColor: ACCENT,
  },
  otpBoxError: {
    borderColor: '#DC2626',
  },
  otpDigit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  error: {
    marginTop: 12,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  resendBtn: {
    marginTop: 18,
  },
  resendText: {
    color: ACCENT,
    fontWeight: '700',
  },
  resendDisabled: {
    color: '#9CA3AF',
  },
});
