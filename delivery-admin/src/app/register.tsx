import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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

import { CameraPhotoCapture } from '@/components/auth/CameraPhotoCapture';
import { FormField } from '@/components/auth/FormField';
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
  const [photoUri, setPhotoUri] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
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
    if (!photoUri) {
      setError('Kamerada real profil suratini oling');
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
          photoUri,
        },
      });
    } catch (requestError) {
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Delivery profilingiz</Text>
          <Text style={styles.subtitle}>
            Ma’lumotlarni to‘ldiring va kamerada aniq surat oling.
          </Text>

          <Pressable
            style={styles.photoCard}
            onPress={() => setCameraOpen(true)}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={34} color="#6D28D9" />
              </View>
            )}
            <View style={styles.photoText}>
              <Text style={styles.photoTitle}>
                {photoUri ? 'Surat tayyor' : 'Real surat olish'}
              </Text>
              <Text style={styles.photoHint}>
                {photoUri
                  ? 'Qayta olish uchun bosing'
                  : 'Kamerani ochish uchun bosing'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </Pressable>

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
        </ScrollView>
      </KeyboardAvoidingView>

      {cameraOpen && (
        <CameraPhotoCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(uri) => {
            setPhotoUri(uri);
            setCameraOpen(false);
            setError('');
          }}
        />
      )}
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
  content: {
    flexGrow: 1,
    gap: 18,
    padding: 22,
    paddingBottom: 36,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
  photoCard: {
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
  },
  photo: {
    width: 68,
    height: 68,
    borderRadius: 22,
  },
  photoPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  photoText: {
    flex: 1,
    gap: 4,
  },
  photoTitle: {
    color: '#4C1D95',
    fontSize: 16,
    fontWeight: '800',
  },
  photoHint: {
    color: '#7C3AED',
    fontSize: 13,
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
