import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { useAuth } from '@/providers/AuthProvider';
import { ApiError } from '@/services/api';
import { startEmailAuth } from '@/services/delivery-auth';

export default function AuthScreen() {
  const router = useRouter();
  const { delivery, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && delivery) router.replace('/profile');
  }, [delivery, isLoading, router]);

  async function continueWithEmail() {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      const result = await startEmailAuth(email);
      if (result.mode === 'login') {
        router.push({
          pathname: '/otp',
          params: { mode: 'login', email: result.email },
        });
        return;
      }
      if (result.mode === 'pending') {
        router.replace({
          pathname: '/pending-approval',
          params: { email: result.email },
        });
        return;
      }
      setError(
        'Bu Gmail bilan akkaunt topilmadi. “Ro‘yxatdan o‘tish” tugmasini bosing.',
      );
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
          : 'Xatolik yuz berdi',
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/images/brand-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.heroTitle}>Delivery kabineti</Text>
            <Text style={styles.heroSubtitle}>Delivery akkauntingizga kiring</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="mail-outline" size={26} color="#6D28D9" />
            </View>
            <Text style={styles.title}>Akkauntga kirish</Text>
            <Text style={styles.description}>
              Ro‘yxatdan o‘tgan Gmail manzilingizga bir martalik kod yuboramiz.
            </Text>

            <FormField
              label="Gmail"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="example@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={continueWithEmail}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={continueWithEmail}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Kirish</Text>
                  <Ionicons name="arrow-forward" color="#FFFFFF" size={20} />
                </>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>yoki</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                pressed && styles.registerButtonPressed,
              ]}
              onPress={() => router.push('/register')}>
              <Ionicons name="person-add-outline" color="#6D28D9" size={21} />
              <Text style={styles.registerButtonText}>Ro‘yxatdan o‘tish</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
  },
  logoCircle: {
    width: 104,
    height: 104,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C1D95',
  },
  logo: {
    width: 100,
    height: 100,
  },
  heroTitle: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: '#DDD6FE',
    fontSize: 15,
  },
  card: {
    gap: 16,
    padding: 22,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
  },
  description: {
    marginTop: -8,
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
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
    marginTop: 4,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    backgroundColor: '#6D28D9',
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  registerButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
  },
  registerButtonPressed: {
    backgroundColor: '#EDE9FE',
  },
  registerButtonText: {
    color: '#6D28D9',
    fontSize: 16,
    fontWeight: '800',
  },
});
