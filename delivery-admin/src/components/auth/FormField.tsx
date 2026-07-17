import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

type Props = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function FormField({ label, icon, style, ...inputProps }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name={icon} size={20} color="#7C3AED" />
        <TextInput
          {...inputProps}
          placeholderTextColor="#9CA3AF"
          style={[styles.input, style]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 7,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
  inputContainer: {
    minHeight: 55,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: '#111827',
    fontSize: 16,
  },
});
