import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export type UzArrivalWeightItem = {
  shipmentId: string;
  label: string;
  initialWeightKg?: number;
};

export type UzArrivalSubmitPayload = {
  weightKg: number;
  cargoDeliveryFee: number;
  comment: string;
  photoBase64: string | null;
  itemWeights: Array<{ shipmentId: string; weightKg: number }>;
};

type Props = {
  disabled?: boolean;
  loading?: boolean;
  /** Guruh/yolg‘on mahsulotlar — har biri alohida kg */
  items?: UzArrivalWeightItem[];
  /** items yo‘q yoki 1 ta bo‘lganda dastlabki qiymat */
  initialWeightKg?: number;
  onSubmit: (payload: UzArrivalSubmitPayload) => void | Promise<void>;
};

function parseKg(raw: string) {
  return Number(String(raw).replace(',', '.').trim());
}

function formatTotal(sum: number) {
  if (!Number.isFinite(sum) || sum <= 0) return '0';
  return String(Math.round(sum * 1000) / 1000);
}

export function UzWarehouseArrivalForm({
  disabled = false,
  loading = false,
  items = [],
  initialWeightKg = 0,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const weightRows = useMemo(() => {
    if (Array.isArray(items) && items.length > 0) {
      return items.map((item) => ({
        shipmentId: String(item.shipmentId || '').trim(),
        label: String(item.label || '').trim() || item.shipmentId,
        initial:
          Number(item.initialWeightKg) > 0 ? Number(item.initialWeightKg) : 0,
      }));
    }
    return [
      {
        shipmentId: '',
        label: t('shipments.uzArrival.weightLabel'),
        initial: initialWeightKg > 0 ? initialWeightKg : 0,
      },
    ];
  }, [items, initialWeightKg, t]);

  const [weightMap, setWeightMap] = useState<Record<string, string>>({});
  const [feeText, setFeeText] = useState('');
  const [comment, setComment] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const rowsKey = weightRows.map((row) => row.shipmentId || '_single').join('|');
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const row of weightRows) {
      const key = row.shipmentId || '_single';
      next[key] = row.initial > 0 ? String(row.initial) : '';
    }
    setWeightMap(next);
    // faqat product/shipment seti o‘zgaganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsKey]);

  const busy = disabled || loading || picking;
  const multi = weightRows.length > 1;

  const totalWeight = useMemo(() => {
    return weightRows.reduce((sum, row) => {
      const key = row.shipmentId || '_single';
      const kg = parseKg(weightMap[key] || '');
      return sum + (Number.isFinite(kg) && kg > 0 ? kg : 0);
    }, 0);
  }, [weightRows, weightMap]);

  const setItemWeight = (key: string, value: string) => {
    setWeightMap((prev) => ({ ...prev, [key]: value }));
  };

  const pickPhoto = async () => {
    if (busy) return;
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t('shipments.uzArrival.permissionTitle'),
          t('shipments.uzArrival.permissionMessage'),
        );
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
        Alert.alert(
          t('common.error'),
          t('shipments.uzArrival.photoReadFailed'),
        );
        return;
      }

      const mime =
        asset.mimeType && asset.mimeType.includes('png')
          ? 'image/png'
          : 'image/jpeg';
      setPhotoPreview(asset.uri);
      setPhotoBase64(`data:${mime};base64,${asset.base64}`);
    } catch {
      Alert.alert(
        t('common.error'),
        t('shipments.uzArrival.photoPickFailed'),
      );
    } finally {
      setPicking(false);
    }
  };

  const handleSubmit = () => {
    if (busy) return;

    const itemWeights: Array<{ shipmentId: string; weightKg: number }> = [];
    for (const row of weightRows) {
      const key = row.shipmentId || '_single';
      const kg = parseKg(weightMap[key] || '');
      if (!Number.isFinite(kg) || kg <= 0) {
        Alert.alert(
          t('shipments.uzArrival.weightAlertTitle'),
          multi
            ? t('shipments.uzArrival.itemWeightAlertMessage', {
                name: row.label,
              })
            : t('shipments.uzArrival.weightAlertMessage'),
        );
        return;
      }
      if (row.shipmentId) {
        itemWeights.push({
          shipmentId: row.shipmentId,
          weightKg: Math.round(kg * 1000) / 1000,
        });
      }
    }

    const weightKg = Math.round(totalWeight * 1000) / 1000;
    if (!(weightKg > 0)) {
      Alert.alert(
        t('shipments.uzArrival.weightAlertTitle'),
        t('shipments.uzArrival.weightAlertMessage'),
      );
      return;
    }

    const cargoDeliveryFee = Number(
      String(feeText).replace(/\s/g, '').replace(',', '.'),
    );
    if (!Number.isFinite(cargoDeliveryFee) || cargoDeliveryFee < 0) {
      Alert.alert(
        t('shipments.uzArrival.feeAlertTitle'),
        t('shipments.uzArrival.feeAlertMessage'),
      );
      return;
    }

    void onSubmit({
      weightKg,
      cargoDeliveryFee,
      comment: comment.trim(),
      photoBase64,
      itemWeights,
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('shipments.uzArrival.title')}</Text>
      <Text style={styles.hint}>
        {multi
          ? t('shipments.uzArrival.hintGroup')
          : t('shipments.uzArrival.hint')}
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
            <Text style={styles.photoBtnText}>
              {t('shipments.uzArrival.photoOptional')}
            </Text>
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
          <Text style={styles.clearPhoto}>
            {t('shipments.uzArrival.removePhoto')}
          </Text>
        </Pressable>
      ) : null}

      <Text style={styles.label}>
        {multi
          ? t('shipments.uzArrival.itemWeightsLabel')
          : t('shipments.uzArrival.weightLabel')}
      </Text>

      {weightRows.map((row) => {
        const key = row.shipmentId || '_single';
        return (
          <View key={key} style={multi ? styles.itemBlock : undefined}>
            {multi ? (
              <Text style={styles.itemLabel} numberOfLines={2}>
                {row.label}
              </Text>
            ) : null}
            <TextInput
              style={styles.input}
              value={weightMap[key] || ''}
              onChangeText={(value) => setItemWeight(key, value)}
              keyboardType="decimal-pad"
              placeholder={t('shipments.uzArrival.weightPlaceholder')}
              placeholderTextColor="#9CA3AF"
              editable={!busy}
            />
          </View>
        );
      })}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>
          {t('shipments.uzArrival.totalWeightLabel')}
        </Text>
        <Text style={styles.totalValue}>
          {formatTotal(totalWeight)} kg
        </Text>
      </View>

      <Text style={styles.label}>{t('shipments.uzArrival.feeLabel')}</Text>
      <Text style={styles.feeHint}>{t('shipments.uzArrival.feeHintOnce')}</Text>
      <TextInput
        style={styles.input}
        value={feeText}
        onChangeText={setFeeText}
        keyboardType="number-pad"
        placeholder={t('shipments.uzArrival.feePlaceholder')}
        placeholderTextColor="#9CA3AF"
        editable={!busy}
      />

      <Text style={styles.label}>{t('shipments.uzArrival.commentLabel')}</Text>
      <TextInput
        style={[styles.input, styles.comment]}
        value={comment}
        onChangeText={setComment}
        placeholder={t('shipments.uzArrival.commentPlaceholder')}
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
          <Text style={styles.submitText}>
            {t('shipments.actions.sendToClient')}
          </Text>
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
  feeHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -4,
  },
  itemBlock: {
    gap: 6,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
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
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4C1D95',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5B21B6',
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
