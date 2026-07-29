import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiError } from '@/services/api';
import { updateLogisticaProfileDetails } from '@/services/logistica-auth';
import type { LogisticaProfile } from '@/types/logistica';

type Props = {
  visible: boolean;
  token: string | null;
  profile: LogisticaProfile | null;
  onClose: () => void;
  onSaved: (profile: LogisticaProfile) => void;
};

export function MyLogisticaInfoBottomSheet({
  visible,
  token,
  profile,
  onClose,
  onSaved,
}: Props) {
  const translateY = useRef(new Animated.Value(700)).current;
  const [sheetHeight, setSheetHeight] = useState(0);
  const [chinaAddress, setChinaAddress] = useState('');
  const [chinaPhone, setChinaPhone] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setChinaAddress(profile?.chinaAddress || '');
    setChinaPhone(profile?.chinaPhone || '');
    setProfileDescription(profile?.profileDescription || '');
    setError('');
    translateY.setValue(sheetHeight || 700);
    const frame = requestAnimationFrame(() => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    });
    return () => cancelAnimationFrame(frame);
  }, [
    profile?.chinaAddress,
    profile?.chinaPhone,
    profile?.profileDescription,
    sheetHeight,
    translateY,
    visible,
  ]);

  const closeSheet = useCallback(() => {
    if (saving) return;
    Animated.timing(translateY, {
      toValue: sheetHeight || 700,
      duration: 210,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [onClose, saving, sheetHeight, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          !saving &&
          Math.abs(gesture.dy) > 4 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          const closeThreshold = Math.max(70, (sheetHeight || 350) * 0.2);
          if (gesture.dy >= closeThreshold) {
            closeSheet();
            return;
          }
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 220,
            mass: 0.8,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 220,
          }).start();
        },
      }),
    [closeSheet, saving, sheetHeight, translateY],
  );

  const save = async () => {
    if (!token || saving) return;
    const address = chinaAddress.trim();
    const phone = chinaPhone.trim();
    if (!address) {
      setError('Xitoydagi manzilni kiriting');
      return;
    }
    if (!phone) {
      setError('Xitoydagi telefon raqamini kiriting');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const updated = await updateLogisticaProfileDetails(token, {
        chinaAddress: address,
        chinaPhone: phone,
        profileDescription: profileDescription.trim(),
      });
      Animated.timing(translateY, {
        toValue: sheetHeight || 700,
        duration: 210,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onSaved(updated);
          onClose();
        }
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Ma’lumotlarni saqlab bo‘lmadi',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeSheet}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={closeSheet} />

        <KeyboardAvoidingView
          style={styles.keyboardArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <Animated.View
            onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
            style={[styles.sheet, { transform: [{ translateY }] }]}
          >
            <View style={styles.dragArea} {...panResponder.panHandlers}>
              <View style={styles.dragHandle} />
              <Text style={styles.title}>Mening ma’lumotlarim</Text>
              <Text style={styles.subtitle}>
                Xitoydagi ombor va aloqa ma’lumotlarini kiriting
              </Text>
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.field}>
                <Text style={styles.label}>Xitoydagi manzil</Text>
                <TextInput
                  value={chinaAddress}
                  onChangeText={setChinaAddress}
                  editable={!saving}
                  placeholder="Ombor yoki ofis manzili"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, styles.multiline]}
                  multiline
                  maxLength={300}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Xitoydagi telefon raqami</Text>
                <TextInput
                  value={chinaPhone}
                  onChangeText={setChinaPhone}
                  editable={!saving}
                  placeholder="+86 ..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  keyboardType="phone-pad"
                  maxLength={40}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  Qisqacha tavsif <Text style={styles.optional}>(ixtiyoriy)</Text>
                </Text>
                <TextInput
                  value={profileDescription}
                  onChangeText={setProfileDescription}
                  editable={!saving}
                  placeholder="Qo‘shimcha ma’lumot"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, styles.description]}
                  multiline
                  maxLength={500}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                disabled={saving}
                onPress={() => {
                  void save();
                }}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && !saving && styles.pressed,
                  saving && styles.saveButtonDisabled,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveText}>Saqlash</Text>
                )}
              </Pressable>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.48)',
  },
  keyboardArea: {
    justifyContent: 'flex-end',
    maxHeight: '92%',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dragArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 13,
  },
  dragHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginBottom: 13,
  },
  title: {
    color: '#1F2937',
    fontSize: 19,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  formScroll: {
    flexGrow: 0,
  },
  form: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 14,
  },
  field: {
    gap: 7,
  },
  label: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
  optional: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 13,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  description: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  error: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    marginTop: 2,
  },
  saveButtonDisabled: {
    opacity: 0.68,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.88,
  },
});
