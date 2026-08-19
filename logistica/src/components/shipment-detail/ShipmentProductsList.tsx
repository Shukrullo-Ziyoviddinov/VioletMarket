import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ShipmentProduct } from '@/types/shipment';
import { resolveProductCargoLane } from '@/utils/cargoServiceLabel';

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

function productLane(product: ShipmentProduct): 'express' | 'standard' {
  return resolveProductCargoLane(product);
}

function partitionProductsByLane(products: ShipmentProduct[]) {
  const express: ShipmentProduct[] = [];
  const standard: ShipmentProduct[] = [];
  for (const product of Array.isArray(products) ? products : []) {
    if (productLane(product) === 'express') express.push(product);
    else standard.push(product);
  }
  return { express, standard };
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
  const list = Array.isArray(products) ? products : [];
  const lanes = partitionProductsByLane(list);
  const mixed = lanes.express.length > 0 && lanes.standard.length > 0;
  const sections = mixed
    ? [
        { type: 'express' as const, items: lanes.express },
        { type: 'standard' as const, items: lanes.standard },
      ]
    : [{ type: null, items: list }];

  const productsWeightSum = list.reduce(
    (sum, product) => sum + Math.max(0, Number(product.weightKg) || 0),
    0,
  );
  const totalKg =
    Number(totalWeightKg) > 0
      ? Number(totalWeightKg)
      : Math.round(productsWeightSum * 1000) / 1000;

  const renderProductRow = (product: ShipmentProduct, isLast: boolean) => {
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
          <View style={styles.titleRow}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <View
              style={[
                styles.laneBadge,
                productLane(product) === 'express'
                  ? styles.laneBadgeExpress
                  : styles.laneBadgeStandard,
              ]}
            >
              <Text
                style={[
                  styles.laneBadgeText,
                  productLane(product) === 'express'
                    ? styles.laneBadgeTextExpress
                    : styles.laneBadgeTextStandard,
                ]}
              >
                {productLane(product) === 'express'
                  ? t('shipments.cargoService.express')
                  : t('shipments.cargoService.standard')}
              </Text>
            </View>
          </View>
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
        {!isLast ? <View style={styles.line} /> : null}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('shipments.detail.products')}</Text>
      {selectable ? (
        <Text style={styles.hint}>{t('shipments.detail.selectReturnHint')}</Text>
      ) : null}
      {mixed && !selectable ? (
        <Text style={styles.hint}>{t('shipments.detail.mixedPackagesHint')}</Text>
      ) : null}
      {mixed && selectable ? (
        <Text style={styles.hint}>{t('shipments.detail.mixedReturnHint')}</Text>
      ) : null}
      <View style={styles.card}>
        {sections.map((section, sectionIndex) => (
          <View key={section.type || 'all'}>
            {section.type ? (
              <View
                style={[
                  styles.packageHead,
                  section.type === 'express'
                    ? styles.packageHeadExpress
                    : styles.packageHeadStandard,
                  sectionIndex > 0 ? styles.packageHeadSpaced : null,
                ]}
              >
                <Text
                  style={[
                    styles.packageTitle,
                    section.type === 'express'
                      ? styles.packageTitleExpress
                      : styles.packageTitleStandard,
                  ]}
                >
                  {section.type === 'express'
                    ? t('shipments.cargoService.expressPackage')
                    : t('shipments.cargoService.standardPackage')}
                </Text>
                <Text style={styles.packageCount}>
                  {t('common.productsCount', { count: section.items.length })}
                </Text>
              </View>
            ) : null}
            {section.items.map((product, index) =>
              renderProductRow(product, index === section.items.length - 1),
            )}
          </View>
        ))}

        {showTotalWeight && list.length > 0 ? (
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  laneBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  laneBadgeExpress: {
    backgroundColor: '#EDE9FE',
  },
  laneBadgeStandard: {
    backgroundColor: '#E2E8F0',
  },
  laneBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  laneBadgeTextExpress: {
    color: '#6D28D9',
  },
  laneBadgeTextStandard: {
    color: '#334155',
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
  packageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  packageHeadSpaced: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  packageHeadExpress: {
    backgroundColor: '#F5F3FF',
  },
  packageHeadStandard: {
    backgroundColor: '#F8FAFC',
  },
  packageTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  packageTitleExpress: {
    color: '#6D28D9',
  },
  packageTitleStandard: {
    color: '#334155',
  },
  packageCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
});
