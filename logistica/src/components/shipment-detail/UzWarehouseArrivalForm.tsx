import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const ACCENT = '#7c3aed';

type Props = {
  disabled?: boolean;
  loading?: boolean;
  initialWeightKg?: number;
  onSubmit: (payload: {
    weightKg: number;
    cargoDeliveryFee: number;
    comment: string;
    photoBase64: string | null;
  }) => void | Promise<void>;
};

export function UzWarehouseArrivalForm({
  disabled = false,
  loading = false,
  initialWeightKg = 0,
  onSubmit,
}: Props) {
  const [weightText, setWeightText] = useState(
    initialWeightKg > 0 ? String(initialWeightKg) : '',
  );
  const [feeText, setFeeText] = useState('');
  const [comment, setComment] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const busy = disabled || loading || picking;

  const pickPhoto = async () => {
    if (busy) return;
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Ruxsat', 'Surat uchun galereya ruxsatini yoqing.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Xato', 'Rasmni o‘qib bo‘lmadi');
        return;
      }

      const mime =
        asset.mimeType && asset.mimeType.includes('png')
          ? 'image/png'
          : 'image/jpeg';
      setPhotoPreview(asset.uri);
      setPhotoBase64(`data:${mime};base64,${asset.base64}`);
    } catch {
      Alert.alert('Xato', 'Rasm tanlab bo‘lmadi');
    } finally {
      setPicking(false);
    }
  };

  const handleSubmit = () => {
    if (busy) return;
    const weightKg = Number(String(weightText).replace(',', '.'));
    const cargoDeliveryFee = Number(String(feeText).replace(/\s/g, '').replace(',', '.'));

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      Alert.alert('Og‘irlik', 'Og‘irlikni to‘g‘ri kiriting (kg)');
      return;
    }
    if (!Number.isFinite(cargoDeliveryFee) || cargoDeliveryFee < 0) {
      Alert.alert('Summa', 'Og‘irlik summasini to‘g‘ri kiriting');
      return;
    }

    void onSubmit({
      weightKg,
      cargoDeliveryFee,
      comment: comment.trim(),
      photoBase64,
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Toshkent omboriga qabul</Text>
      <Text style={styles.hint}>
        Og‘irlik va summani kiriting. «Clientga yuborish» bosilganda holat
        avtomatik «Toshkent omborida» bo‘ladi.
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.photoBtn,
          pressed && !busy && styles.pressed,
        ]}
        disabled={busy}
        onPress={() => {
          void pickPhoto();
        }}
      >
        {photoPreview ? (
          <Image source={{ uri: photoPreview }} style={styles.photoPreview} />
        ) : (
          <>
            <Ionicons name="camera-outline" size={22} color={ACCENT} />
            <Text style={styles.photoBtnText}>Surat (ixtiyoriy)</Text>
          </>
        )}
      </Pressable>

      {photoPreview ? (
        <Pressable
          disabled={busy}
          onPress={() => {
            setPhotoPreview(null);
            setPhotoBase64(null);
          }}
        >
          <Text style={styles.clearPhoto}>Suratni olib tashlash</Text>
        </Pressable>
      ) : null}

      <Text style={styles.label}>Og‘irlik (kg) *</Text>
      <TextInput
        style={styles.input}
        value={weightText}
        onChangeText={setWeightText}
        keyboardType="decimal-pad"
        placeholder="Masalan: 2.5"
        placeholderTextColor="#9CA3AF"
        editable={!busy}
      />

      <Text style={styles.label}>Og‘irlik summasi (so‘m) *</Text>
      <TextInput
        style={styles.input}
        value={feeText}
        onChangeText={setFeeText}
        keyboardType="number-pad"
        placeholder="Masalan: 45000"
        placeholderTextColor="#9CA3AF"
        editable={!busy}
      />

      <Text style={styles.label}>Izoh (ixtiyoriy)</Text>
      <TextInput
        style={[styles.input, styles.comment]}
        value={comment}
        onChangeText={setComment}
        placeholder="Qo‘shimcha izoh"
        placeholderTextColor="#9CA3AF"
        multiline
        editable={!busy}
      />

      <Pressable
        style={({ pressed }) => [
          styles.submitBtn,
          pressed && !busy && styles.pressed,
          busy && styles.submitBtnDisabled,
        ]}
        disabled={busy}
        onPress={handleSubmit}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>Clientga yuborish</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  photoBtn: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
    backgroundColor: '#F5F3FF',
  },
  photoPreview: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  photoBtnText: {
    color: ACCENT,
    fontWeight: '700',
    fontSize: 14,
  },
  clearPhoto: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  comment: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 6,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
  },
});
