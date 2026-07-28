import { useCallback } from 'react';

import { ShipmentsListPanel } from '@/components/home/ShipmentsListPanel';
import { ScreenShell } from '@/components/ScreenShell';
import { fetchUzWarehouseShipments } from '@/services/logistica-shipments';

export default function UzbdaScreen() {
  const loadShipments = useCallback(
    (token: string) => fetchUzWarehouseShipments(token),
    [],
  );

  return (
    <ScreenShell title="UZBda">
      <ShipmentsListPanel
        loadShipments={loadShipments}
        hrefBase="/ish-stoli/[id]"
        emptyTitle="Toshkent omborida yuk yo‘q"
        emptyText="«Toshkent omborida» belgilangan mahsulotlar shu yerda chiqadi. To‘landidan keyin asosiy adminga o‘tadi."
      />
    </ScreenShell>
  );
}
