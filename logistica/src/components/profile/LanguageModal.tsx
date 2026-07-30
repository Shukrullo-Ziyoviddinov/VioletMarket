import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppLanguage } from '@/i18n';
import { useAppLanguage } from '@/providers/LanguageProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const LANGUAGE_OPTIONS: {
  key: AppLanguage;
  flag: string;
  labelKey: string;
}[] = [
  { key: 'uz', flag: '🇺🇿', labelKey: 'language.uz' },
  { key: 'en', flag: '🇬🇧', labelKey: 'language.en' },
  { key: 'zh', flag: '🇨🇳', labelKey: 'language.zh' },
];

export function LanguageModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { language, changeLanguage } = useAppLanguage();
  const translateY = useRef(new Animated.Value(700)).current;
  const [sheetHeight, setSheetHeight] = useState(0);
  const [selectedLanguage, setSelectedLanguage] =
    useState<AppLanguage>(language);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSelectedLanguage(language);
    translateY.setValue(700);
    const frame = requestAnimationFrame(() => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    });
    return () => cancelAnimationFrame(frame);
  }, [language, translateY, visible]);

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
        onStartShouldSetPanResponder: () => !saving,
        onStartShouldSetPanResponderCapture: () => !saving,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !saving &&
          Math.abs(gesture.dy) > 4 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          !saving &&
          Math.abs(gesture.dy) > 4 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => translateY.stopAnimation(),
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
            mass: 0.8,
          }).start();
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [closeSheet, saving, sheetHeight, translateY],
  );

  const saveLanguage = async () => {
    if (saving) return;
    setSaving(true);
    Animated.timing(translateY, {
      toValue: sheetHeight || 700,
      duration: 210,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        setSaving(false);
        return;
      }

      // Avval modalni ota komponentda yoping. Tilni undan keyin almashtirish
      // visible=true effektining sheetni qayta ochib yuborishiga yo'l qo'ymaydi.
      onClose();
      requestAnimationFrame(() => {
        void changeLanguage(selectedLanguage).finally(() => {
          setSaving(false);
        });
      });
    });
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
        <Animated.View
          onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.dragArea} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
            <Text style={styles.title}>{t('language.title')}</Text>
            <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
          </View>

          <View style={styles.options}>
            {LANGUAGE_OPTIONS.map((option) => {
              const selected = selectedLanguage === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setSelectedLanguage(option.key)}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={styles.flag}>{option.flag}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      selected && styles.optionLabelSelected,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                  <View
                    style={[
                      styles.radio,
                      selected && styles.radioSelected,
                    ]}
                  >
                    {selected ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            disabled={saving}
            onPress={saveLanguage}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && !saving && styles.saveButtonPressed,
              saving && styles.saveButtonDisabled,
            ]}
          >
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </Pressable>
        </Animated.View>
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
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  sheet: {
    width: '100%',
    maxHeight: '82%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 16,
  },
  dragArea: {
    alignItems: 'center',
    paddingBottom: 18,
  },
  dragHandle: {
    width: 46,
    height: 5,
    marginBottom: 16,
    borderRadius: 999,
    backgroundColor: '#D8D2E5',
  },
  title: {
    color: '#24123D',
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 5,
    color: '#7C6B95',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  options: {
    gap: 10,
  },
  option: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E8E2F1',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  optionPressed: {
    opacity: 0.86,
  },
  flag: {
    fontSize: 28,
  },
  optionLabel: {
    flex: 1,
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
  },
  optionLabelSelected: {
    color: '#6D28D9',
    fontWeight: '900',
  },
  radio: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 13,
  },
  radioSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#7C3AED',
  },
  saveButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
  },
  saveButtonPressed: {
    opacity: 0.88,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
