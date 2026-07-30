import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { WeightLabel } from '@/types/shipment';

type Props = {
  productCount: number;
  weightLabel: WeightLabel | string;
  weightKg: number;
  warehouseAddress: string;
  note: string;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function translateWeightLabel(
  t: (key: string) => string,
  label: WeightLabel | string,
) {
  return String(label) === "Og'irlik"
    ? t('shipments.weight.exact')
    : t('shipments.weight.estimated');
}

export function ShipmentRequestInfo({
  productCount,
  weightLabel,
  weightKg,
  warehouseAddress,
  note,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('shipments.detail.requestInfo')}</Text>
      <View style={styles.card}>
        <InfoRow
          label={t('shipments.detail.productCount')}
          value={t('shipments.detail.productCountValue', { count: productCount })}
        />
        <View style={styles.line} />
        <InfoRow
          label={translateWeightLabel(t, weightLabel)}
          value={`${weightKg} kg`}
        />
        <View style={styles.line} />
        <InfoRow
          label={t('shipments.detail.chinaWarehouse')}
          value={warehouseAddress}
        />
        <View style={styles.line} />
        <InfoRow label={t('shipments.detail.note')} value={note} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  row: {
    paddingVertical: 12,
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 20,
  },
  line: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});
