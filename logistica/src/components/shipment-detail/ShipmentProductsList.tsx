import { StyleSheet, Text, View } from 'react-native';

import type { ShipmentProduct } from '@/types/shipment';

type Props = {
  products: ShipmentProduct[];
};

export function ShipmentProductsList({ products }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Mahsulotlar</Text>
      <View style={styles.card}>
        {products.map((product, index) => (
          <View key={product.id}>
            <View style={styles.row}>
              <View style={styles.left}>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.variant}>{product.variant}</Text>
              </View>
              <Text style={styles.meta}>
                {product.weightKg} kg x{product.quantity}
              </Text>
            </View>
            {index < products.length - 1 ? <View style={styles.line} /> : null}
          </View>
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
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
  meta: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  line: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});
