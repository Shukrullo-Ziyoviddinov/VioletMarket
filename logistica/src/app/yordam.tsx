import { Ionicons } from '@expo/vector-icons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogisticaChatComposer } from '@/components/yordam/LogisticaChatComposer';
import { LogisticaChatMessageList } from '@/components/yordam/LogisticaChatMessageList';
import { useAuth } from '@/providers/AuthProvider';
import {
  fetchLogisticaChatMessages,
  markLogisticaChatRead,
  sendLogisticaChatImageMessage,
  sendLogisticaChatTextMessage,
} from '@/services/logistica-chat';
import {
  connectLogisticaChatSocket,
  onLogisticaChatMessage,
  onLogisticaChatRead,
} from '@/services/logistica-chat-socket';
import type { LogisticaChatMessage } from '@/types/logistica-chat';

export default function YordamScreen() {
  const router = useRouter();
  const { token, profile, isLoading } = useAuth();
  const listRef = useRef<ScrollView | null>(null);
  const [messages, setMessages] = useState<LogisticaChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/auth');
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchLogisticaChatMessages(token!);
        if (cancelled) return;
        setMessages(data.messages || []);
        await markLogisticaChatRead(token!).catch(() => null);
      } catch (error) {
        if (!cancelled) {
          Alert.alert(
            'Xato',
            error instanceof Error ? error.message : 'Chat yuklanmadi',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    connectLogisticaChatSocket(token);
    const unsubscribe = onLogisticaChatMessage((payload) => {
      if (!payload?.message) return;
      if (
        profile?.id &&
        payload.logisticaId &&
        payload.logisticaId !== profile.id
      ) {
        return;
      }
      setMessages((prev) => {
        if (prev.some((item) => item.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
      if (payload.message.sender === 'admin') {
        markLogisticaChatRead(token).catch(() => null);
      }
    });
    const unsubscribeRead = onLogisticaChatRead((payload) => {
      if (payload.readBy !== 'admin') return;
      if (profile?.id && payload.logisticaId !== profile.id) return;
      setMessages((prev) =>
        prev.map((message) =>
          message.sender === 'logistica'
            ? { ...message, readByAdmin: true }
            : message,
        ),
      );
    });

    return () => {
      cancelled = true;
      unsubscribe();
      unsubscribeRead();
    };
  }, [token, profile?.id]);

  async function handleSend() {
    if (!token || sending) return;
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    try {
      const data = await sendLogisticaChatTextMessage(token, content);
      setDraft('');
      setMessages((prev) => {
        if (prev.some((item) => item.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    } catch (error) {
      Alert.alert(
        'Xato',
        error instanceof Error ? error.message : 'Xabar yuborilmadi',
      );
    } finally {
      setSending(false);
    }
  }

  async function handlePickImage() {
    if (!token || sending) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Galereya ruxsati',
        'Rasm yuborish uchun galereya ruxsatini yoqing.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setSending(true);
    try {
      const context = ImageManipulator.manipulate(result.assets[0].uri);
      context.resize({ width: 1024 });
      const imageRef = await context.renderAsync();
      const saved = await imageRef.saveAsync({
        compress: 0.7,
        format: SaveFormat.JPEG,
        base64: true,
      });

      if (!saved.base64) {
        throw new Error('Rasmni o‘qib bo‘lmadi');
      }

      const data = await sendLogisticaChatImageMessage(
        token,
        `data:image/jpeg;base64,${saved.base64}`,
      );
      setMessages((prev) => {
        if (prev.some((item) => item.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    } catch (error) {
      Alert.alert(
        'Xato',
        error instanceof Error ? error.message : 'Rasm yuborilmadi',
      );
    } finally {
      setSending(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color="#6d32c5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#4C1D95" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Yordam</Text>
            <Text style={styles.headerSubtitle}>Asosiy admin bilan chat</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#6d32c5" />
          </View>
        ) : (
          <LogisticaChatMessageList messages={messages} listRef={listRef} />
        )}

        <LogisticaChatComposer
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          onPickImage={handlePickImage}
          sending={sending}
          disabled={loading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#312E81',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#7C3AED',
  },
  pressed: {
    opacity: 0.85,
  },
});
