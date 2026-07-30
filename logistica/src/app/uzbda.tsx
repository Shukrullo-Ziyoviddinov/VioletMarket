import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    <ScreenShell title={t('navigation.inUzbekistan')}>
      <View style={{ flex: 1 }}>
        <UzbCargoPaymentFilter
          value={paymentFilter}
          onChange={setPaymentFilter}
        />
        <ShipmentsListPanel
          loadShipments={loadShipments}
          hrefBase="/ish-stoli/[id]"
          emptyIcon="business-outline"
          emptyTitle={t('shipments.empty.uzbTitle')}
          emptyText={t('shipments.empty.uzbText')}
          showCargoPaymentStatus
          filterItems={filterItems}
        />
      </View>
    </ScreenShell>
  );
}
