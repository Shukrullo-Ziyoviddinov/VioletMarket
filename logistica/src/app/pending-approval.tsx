import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApprovalStatus } from '@/services/logistica-auth';

const ACCENT = '#7c3aed';

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default function PendingApprovalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = stringParam(params.email);
  const [message, setMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  async function checkStatus() {
    if (!email || isChecking) return;
    setMessage('');
    setIsChecking(true);
    try {
      const result = await getApprovalStatus(email);
      if (result.status === 'active') {
        setMessage(
          'So‘rovingiz tasdiqlandi. Endi Gmail orqali kirishingiz mumkin.',
        );
        return;
      }
      if (result.status === 'pending') {
        setMessage('Hali ham admin tasdiqlashi kutilmoqda.');
        return;
      }
      setMessage(
        'So‘rov topilmadi yoki bekor qilingan. Qayta ro‘yxatdan o‘tishingiz mumkin.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Holatni tekshirib bo‘lmadi',
      );
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={36} color={ACCENT} />
          </View>
          <Text style={styles.title}>Admin tasdiqlashini kuting</Text>
          <Text style={styles.description}>
            Ro‘yxatdan o‘tish so‘rovingiz asosiy adminga yuborildi. Tasdiqlangach
            shu Gmail orqali hisobingizga kira olasiz.
          </Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            disabled={isChecking || !email}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              (isChecking || !email) && styles.disabled,
            ]}
            onPress={checkStatus}
          >
            {isChecking ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Holatni tekshirish</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.replace('/register')}
          >
            <Text style={styles.secondaryButtonText}>Kirish sahifasiga</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  description: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  email: {
    color: ACCENT,
    fontWeight: '700',
  },
  message: {
    marginTop: 4,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 10,
    alignSelf: 'stretch',
    backgroundColor: ACCENT,
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    alignSelf: 'stretch',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  secondaryButtonText: {
    color: ACCENT,
    fontWeight: '700',
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.7 },
});
