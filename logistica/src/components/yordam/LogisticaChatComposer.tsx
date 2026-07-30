import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

type LogisticaChatComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  sending?: boolean;
  disabled?: boolean;
};

export function LogisticaChatComposer({
  value,
  onChangeText,
  onSend,
  onPickImage,
  sending,
  disabled,
}: LogisticaChatComposerProps) {
  const { t } = useTranslation();
  const canSend = Boolean(value.trim()) && !sending && !disabled;

  return (
    <View style={styles.root}>
      <Pressable
        disabled={sending || disabled}
        style={({ pressed }) => [
          styles.imageButton,
          pressed && styles.pressed,
          (sending || disabled) && styles.disabled,
        ]}
        onPress={onPickImage}
      >
        <Ionicons name="image-outline" size={22} color="#6d32c5" />
      </Pressable>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={t('help.placeholder')}
        placeholderTextColor="#9CA3AF"
        editable={!sending && !disabled}
        multiline
        maxLength={4000}
      />

      <Pressable
        disabled={!canSend}
        style={({ pressed }) => [
          styles.sendButton,
          pressed && styles.pressed,
          !canSend && styles.disabled,
        ]}
        onPress={onSend}
      >
        {sending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="send" size={18} color="#FFFFFF" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
    backgroundColor: '#FFFFFF',
  },
  imageButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
    fontSize: 15,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6d32c5',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
