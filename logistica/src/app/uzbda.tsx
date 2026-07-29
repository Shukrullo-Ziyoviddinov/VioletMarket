import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { ShipmentsListPanel } from '@/components/home/ShipmentsListPanel';
import { ScreenShell } from '@/components/ScreenShell';
import {
  UzbCargoPaymentFilter,
  type UzbCargoPaymentFilterValue,
} from '@/components/uzb/UzbCargoPaymentFilter';
import { fetchUzWarehouseShipments } from '@/services/logistica-shipments';
import type { ShipmentRequest } from '@/components/home/ShipmentRequestCard';

export default function UzbdaScreen() {
  const [paymentFilter, setPaymentFilter] =
    useState<UzbCargoPaymentFilterValue>('all');

  const loadShipments = useCallback(
    (token: string) => fetchUzWarehouseShipments(token),
    [],
  );

  const filterItems = useCallback(
    (item: ShipmentRequest) => {
      if (paymentFilter === 'all') return true;
      if (!item.cargoFeePaymentRequired) return false;
      const isPaid = Boolean(item.adminCargoFeeConfirmedAt);
      return paymentFilter === 'paid' ? isPaid : !isPaid;
    },
    [paymentFilter],
  );

  return (
    <ScreenShell title="UZBda">
      <View style={{ flex: 1 }}>
        <UzbCargoPaymentFilter
          value={paymentFilter}
          onChange={setPaymentFilter}
        />
        <ShipmentsListPanel
          loadShipments={loadShipments}
          hrefBase="/ish-stoli/[id]"
          emptyIcon="business-outline"
          emptyTitle="Toshkent omborida yuk yo‘q"
          emptyText="«Toshkent omborida» belgilangan mahsulotlar shu yerda chiqadi. To‘landidan keyin asosiy adminga o‘tadi."
          showCargoPaymentStatus
          filterItems={filterItems}
        />
      </View>
    </ScreenShell>
  );
}
