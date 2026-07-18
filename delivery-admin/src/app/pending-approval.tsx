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

import { getApprovalStatus } from '@/services/delivery-auth';

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={36} color="#6D28D9" />
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
              pressed && styles.buttonPressed,
              (isChecking || !email) && styles.buttonDisabled,
            ]}
            onPress={checkStatus}>
            {isChecking ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Holatni tekshirish</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryPressed,
            ]}
            onPress={() => router.replace('/auth')}>
            <Text style={styles.secondaryButtonText}>Kirish sahifasiga</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.linkButton,
              pressed && styles.secondaryPressed,
            ]}
            onPress={() => router.replace('/register')}>
            <Text style={styles.linkButtonText}>Qayta ro‘yxatdan o‘tish</Text>
          </Pressable>
        </View>
      </View>
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
  card: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  title: {
    marginTop: 18,
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  email: {
    marginTop: 14,
    color: '#4C1D95',
    fontSize: 15,
    fontWeight: '800',
  },
  message: {
    width: '100%',
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    color: '#4C1D95',
    backgroundColor: '#F5F3FF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    minHeight: 54,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#6D28D9',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 50,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  secondaryButtonText: {
    color: '#6D28D9',
    fontSize: 15,
    fontWeight: '800',
  },
  linkButton: {
    marginTop: 14,
    paddingVertical: 8,
  },
  linkButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    backgroundColor: '#5B21B6',
  },
  secondaryPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
