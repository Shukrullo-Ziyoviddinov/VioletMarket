import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FALLBACK_DELIVERY_REGIONS,
  canonicalizeDeliveryRegion,
  isDeliveryRegion,
  type DeliveryRegion,
  pickInitialRegion,
} from '@/constants/deliveryRegions';
import { fetchDeliveryRegions } from '@/services/delivery-auth';

type RegionModalProps = {
  visible: boolean;
  currentRegion?: string | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (region: DeliveryRegion) => Promise<void> | void;
};

function withServerRegions(
  regions: readonly string[],
  currentRegion?: string | null,
) {
  const unique: string[] = [];
  for (const item of regions) {
    const value = String(item || '').trim();
    if (!value) continue;
    if (unique.some((region) => isDeliveryRegion(value, [region]))) continue;
    unique.push(value);
  }
  const current = canonicalizeDeliveryRegion(currentRegion, unique);
  if (current && !unique.some((region) => isDeliveryRegion(current, [region]))) {
    unique.unshift(current);
  }
  return unique;
}

export function RegionModal({
  visible,
  currentRegion,
  saving = false,
  onClose,
  onSave,
}: RegionModalProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(700)).current;
  const [sheetHeight, setSheetHeight] = useState(0);
  const [regions, setRegions] = useState<string[]>(() =>
    withServerRegions(FALLBACK_DELIVERY_REGIONS, currentRegion),
  );
  const [selectedRegion, setSelectedRegion] = useState(
    pickInitialRegion(
      currentRegion,
      withServerRegions(FALLBACK_DELIVERY_REGIONS, currentRegion),
    ),
  );
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const currentRegionRef = useRef(currentRegion);
  const regionsRef = useRef<readonly string[]>(regions);
  const touchedRef = useRef(false);

  useEffect(() => {
    currentRegionRef.current = currentRegion;
  }, [currentRegion]);

  useEffect(() => {
    regionsRef.current = regions;
  }, [regions]);

  useEffect(() => {
    if (!visible) return;
    setIsClosing(false);
    touchedRef.current = false;
    setLoadingRegions(false);
    const nextRegions = withServerRegions(
      regionsRef.current.length ? regionsRef.current : FALLBACK_DELIVERY_REGIONS,
      currentRegionRef.current,
    );
    setRegions(nextRegions);
    setSelectedRegion(
      pickInitialRegion(currentRegionRef.current, nextRegions),
    );
    translateY.setValue(700);
    const frame = requestAnimationFrame(() => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    });
    return () => cancelAnimationFrame(frame);
  }, [translateY, visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    async function loadRegions() {
      setLoadingRegions(true);
      try {
        const data = await fetchDeliveryRegions();
        const next = Array.isArray(data?.regions)
          ? data.regions
              .map((item) => String(item || '').trim())
              .filter(Boolean)
          : [];
        const source = next.length ? next : [...FALLBACK_DELIVERY_REGIONS];
        if (cancelled) return;
        const merged = withServerRegions(source, currentRegionRef.current);
        setRegions(merged);
        setSelectedRegion((selected) => {
          if (touchedRef.current && isDeliveryRegion(selected, merged)) {
            return selected;
          }
          return pickInitialRegion(currentRegionRef.current, merged);
        });
      } catch {
        if (cancelled) return;
        const fallbackRegions = withServerRegions(
          FALLBACK_DELIVERY_REGIONS,
          currentRegionRef.current,
        );
        setRegions(fallbackRegions);
        setSelectedRegion((selected) => {
          if (touchedRef.current && isDeliveryRegion(selected, fallbackRegions)) {
            return selected;
          }
          return pickInitialRegion(currentRegionRef.current, fallbackRegions);
        });
      } finally {
        setLoadingRegions(false);
      }
    }

    void loadRegions();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const closeSheet = useCallback(() => {
    if (saving || isClosing) return;
    setIsClosing(true);
    Animated.timing(translateY, {
      toValue: sheetHeight || 700,
      duration: 210,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
      setIsClosing(false);
    });
  }, [isClosing, onClose, saving, sheetHeight, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !saving && !isClosing,
        onStartShouldSetPanResponderCapture: () => !saving && !isClosing,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !saving &&
          !isClosing &&
          Math.abs(gesture.dy) > 4 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          !saving &&
          !isClosing &&
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
    [closeSheet, isClosing, saving, sheetHeight, translateY],
  );

  const canSave =
    Boolean(selectedRegion) &&
    isDeliveryRegion(selectedRegion, regions) &&
    !loadingRegions &&
    (touchedRef.current ||
      canonicalizeDeliveryRegion(currentRegion, regions) === selectedRegion);

  const handleSave = async () => {
    if (saving || isClosing || !canSave || !selectedRegion) return;
    try {
      await onSave(selectedRegion);
      setIsClosing(true);
      Animated.timing(translateY, {
        toValue: sheetHeight || 700,
        duration: 210,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onClose();
        setIsClosing(false);
      });
    } catch {
      // Parent shows the error toast/alert.
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeSheet}>
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
          ]}>
          <View style={styles.dragArea} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
            <Text style={styles.title}>Region</Text>
            <Text style={styles.subtitle}>
              Faqat tanlangan viloyat buyurtmalari chiqadi
            </Text>
          </View>

          {loadingRegions ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#6d32c5" />
            </View>
          ) : (
            <ScrollView
              style={styles.optionsScroll}
              contentContainerStyle={styles.options}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {regions.map((region) => {
                const selected = selectedRegion === region;
                return (
                  <Pressable
                    key={region}
                    onPress={() => {
                      touchedRef.current = true;
                      setSelectedRegion(region);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}>
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                      ]}>
                      {region}
                    </Text>
                    <View
                      style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Pressable
            disabled={saving || isClosing || !canSave}
            onPress={() => {
              void handleSave();
            }}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && !saving && !isClosing && styles.saveButtonPressed,
              (saving || isClosing || !canSave) && styles.saveButtonDisabled,
            ]}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Text>
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
    paddingBottom: 14,
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
    textAlign: 'center',
  },
  loadingWrap: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  optionsScroll: {
    flexGrow: 0,
  },
  options: {
    gap: 10,
    paddingBottom: 12,
  },
  option: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E2F3',
    backgroundColor: '#FAF8FF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionSelected: {
    borderColor: '#6d32c5',
    backgroundColor: '#F3E8FF',
  },
  optionPressed: {
    opacity: 0.9,
  },
  optionLabel: {
    flex: 1,
    color: '#374151',
    fontSize: 15,
    fontWeight: '700',
  },
  optionLabelSelected: {
    color: '#6d32c5',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#6d32c5',
    backgroundColor: '#6d32c5',
  },
  saveButton: {
    marginTop: 8,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#6d32c5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
