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
  sendRegistrationCode,
  startEmailAuth,
  verifyLogin,
} from '@/services/delivery-auth';

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default function OtpScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{
    mode?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    photoUri?: string;
  }>();
  const mode = stringParam(params.mode) === 'register' ? 'register' : 'login';
  const email = stringParam(params.email);
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
      const result =
        mode === 'login'
          ? await verifyLogin(email, verificationCode)
          : await completeRegistration({
              email,
              code: verificationCode,
              firstName: stringParam(params.firstName),
              lastName: stringParam(params.lastName),
              phone: stringParam(params.phone),
              photoUri: stringParam(params.photoUri),
            });

      await signIn(result);
      router.replace('/profile');
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
        const result = await sendRegistrationCode(email);
        setCooldown(result.resendAfterSeconds);
      } else {
        const result = await startEmailAuth(email);
        if (result.mode !== 'login') {
          throw new Error('Delivery akkaunt topilmadi');
        }
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={35} color="#6D28D9" />
          </View>
          <Text style={styles.title}>Tasdiqlash kodi</Text>
          <Text style={styles.description}>
            <Text style={styles.email}>{email}</Text> manziliga yuborilgan 6
            xonali kodni kiriting.
          </Text>

          <Pressable
            style={styles.otpRow}
            onPress={() => inputRef.current?.focus()}>
            {Array.from({ length: 6 }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  code.length === index && styles.otpBoxActive,
                  error && styles.otpBoxError,
                ]}>
                <Text style={styles.otpDigit}>{code[index] || ''}</Text>
              </View>
            ))}
            <TextInput
              ref={inputRef}
              autoFocus
              value={code}
              onChangeText={updateCode}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={6}
              style={styles.hiddenInput}
              editable={!isSubmitting}
            />
          </Pressable>

          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#6D28D9" />
              <Text style={styles.loadingText}>Tekshirilmoqda...</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable disabled={cooldown > 0} onPress={resendCode}>
            <Text
              style={[
                styles.resendText,
                cooldown > 0 && styles.resendDisabled,
              ]}>
              {cooldown > 0
                ? `Kodni qayta yuborish: ${cooldown} soniya`
                : 'Kodni qayta yuborish'}
            </Text>
          </Pressable>

          <Text style={styles.autoHint}>
            Kod to‘liq kiritilganda avtomatik tasdiqlanadi
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6D28D9',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  card: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  title: {
    marginTop: 18,
    color: '#111827',
    fontSize: 25,
    fontWeight: '900',
  },
  description: {
    marginTop: 10,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
  },
  email: {
    color: '#4C1D95',
    fontWeight: '800',
  },
  otpRow: {
    width: '100%',
    marginTop: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpBox: {
    width: 43,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  otpBoxActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  otpBoxError: {
    borderColor: '#EF4444',
  },
  otpDigit: {
    color: '#111827',
    fontSize: 23,
    fontWeight: '900',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  loadingRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  loadingText: {
    color: '#6D28D9',
    fontWeight: '700',
  },
  error: {
    width: '100%',
    marginTop: 18,
    padding: 12,
    textAlign: 'center',
    borderRadius: 12,
    color: '#B91C1C',
    backgroundColor: '#FEF2F2',
    fontSize: 14,
    fontWeight: '600',
  },
  resendText: {
    marginTop: 22,
    color: '#6D28D9',
    fontSize: 15,
    fontWeight: '800',
  },
  resendDisabled: {
    color: '#9CA3AF',
  },
  autoHint: {
    marginTop: 20,
    color: '#9CA3AF',
    fontSize: 12,
  },
});
