import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  isKnownCargoServiceType,
  normalizeCargoServiceType,
} from '@volet/cargo-service-rules';

type Props = {
  value?: string | null;
  style?: ViewStyle;
};

export function TarixCargoServiceBadge({ value, style }: Props) {
  const { t } = useTranslation();
  if (!isKnownCargoServiceType(value)) return null;

  const type = normalizeCargoServiceType(value);
  const isExpress = type === 'express';
  const label = isExpress
    ? t('shipments.cargoService.express')
    : t('shipments.cargoService.standard');

  return (
    <View
      style={[
        styles.badge,
        isExpress ? styles.badgeExpress : styles.badgeStandard,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isExpress ? styles.textExpress : styles.textStandard,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeExpress: {
    backgroundColor: '#FEF3C7',
  },
  badgeStandard: {
    backgroundColor: '#E0E7FF',
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
  },
  textExpress: {
    color: '#B45309',
  },
  textStandard: {
    color: '#4338CA',
  },
});
