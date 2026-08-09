import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ShipmentProduct } from '@/types/shipment';

export type ReturnUnitSelection = {
  shipmentId: string;
  unitIndex: number;
};

type Props = {
  products: ShipmentProduct[];
  selectable?: boolean;
  selectedUnits?: ReturnUnitSelection[];
  onToggleUnit?: (shipmentId: string, unitIndex: number) => void;
  /** Mahsulotlar ostida umumiy og‘irlik */
  showTotalWeight?: boolean;
  totalWeightKg?: number;
};

function unitKey(shipmentId: string, unitIndex: number) {
  return `${shipmentId}:${unitIndex}`;
}

function isReturnable(product: ShipmentProduct) {
  const status = String(product.returnStatus || 'active').toLowerCase();
  return status === 'active' || !product.returnStatus;
}

export function ShipmentProductsList({
  products,
  selectable = false,
  selectedUnits = [],
  onToggleUnit,
  showTotalWeight = false,
  totalWeightKg,
}: Props) {
  const { t } = useTranslation();
  const selectedSet = new Set(
    (Array.isArray(selectedUnits) ? selectedUnits : []).map((row) =>
      unitKey(String(row.shipmentId), Number(row.unitIndex) || 0),
    ),
  );

  const productsWeightSum = products.reduce(
    (sum, product) => sum + Math.max(0, Number(product.weightKg) || 0),
    0,
  );
  const totalKg =
    Number(totalWeightKg) > 0
      ? Number(totalWeightKg)
      : Math.round(productsWeightSum * 1000) / 1000;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('shipments.detail.products')}</Text>
      {selectable ? (
        <Text style={styles.hint}>{t('shipments.detail.selectReturnHint')}</Text>
      ) : null}
      <View style={styles.card}>
        {products.map((product, index) => {
          const shipmentId = String(product.shipmentId || '').trim();
          const unitIndex = Number(product.unitIndex) || 0;
          const returnable = isReturnable(product);
          const selected =
            Boolean(selectable) &&
            Boolean(returnable) &&
            Boolean(shipmentId) &&
            selectedSet.has(unitKey(shipmentId, unitIndex));
          const status = String(product.returnStatus || 'active');

          const row = (
            <View style={[styles.row, !returnable && styles.rowMuted]}>
              {selectable ? (
                <View
                  style={[
                    styles.check,
                    selected && styles.checkOn,
                    !returnable && styles.checkDisabled,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{
                    checked: selected,
                    disabled: !returnable,
                  }}
                >
                  {selected ? <View style={styles.checkDot} /> : null}
                </View>
              ) : null}
              <View style={styles.left}>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.variant}>{product.variant}</Text>
                {!returnable ? (
                  <Text style={styles.statusHint}>
                    {status === 'returned'
                      ? t('shipments.detail.unitReturned', {
                          defaultValue: 'Qaytarilgan',
                        })
                      : t('shipments.detail.unitInReturn', {
                          defaultValue: 'Qaytarish oqimida',
                        })}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.meta}>
                {product.weightKg} kg
                {product.quantity > 1 ? ` ×${product.quantity}` : ''}
              </Text>
            </View>
          );

          return (
            <View key={product.id}>
              {selectable && shipmentId && returnable ? (
                <Pressable
                  onPress={() => onToggleUnit?.(shipmentId, unitIndex)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  {row}
                </Pressable>
              ) : (
                row
              )}
              {index < products.length - 1 ? <View style={styles.line} /> : null}
            </View>
          );
        })}

        {showTotalWeight && products.length > 0 ? (
          <>
            <View style={styles.line} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {t('shipments.detail.totalWeight')}
              </Text>
              <Text style={styles.totalValue}>{totalKg} kg</Text>
            </View>
          </>
        ) : null}
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
  hint: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  rowMuted: {
    opacity: 0.55,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    borderColor: '#7c3aed',
    backgroundColor: '#F5F3FF',
  },
  checkDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7c3aed',
  },
  left: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  variant: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusHint: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B21B6',
  },
  line: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  pressed: {
    opacity: 0.85,
  },
});
